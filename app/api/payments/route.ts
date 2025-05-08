import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const paymentSchema = z.object({
  amount: z.number().positive(),
  creditId: z.string(),
  metadata: z
    .object({
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un superviseur ou un administrateur
    if (session.user.role !== "SUPERVISEUR" && session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { amount, creditId, metadata } = paymentSchema.parse(body)

    // Vérifier que le crédit existe
    const credit = await db.credit.findUnique({
      where: {
        id: creditId,
      },
      include: {
        payments: true,
      },
    })

    if (!credit) {
      return NextResponse.json({ message: "Crédit non trouvé" }, { status: 404 })
    }

    // Vérifier que le crédit est approuvé
    if (credit.status !== "APPROUVE" && credit.status !== "REMBOURSE") {
      return NextResponse.json({ message: "Ce crédit n'est pas approuvé" }, { status: 400 })
    }

    // Calculer le montant total remboursé
    const totalRepaid = credit.payments.reduce((sum, payment) => sum + payment.amount, 0) + amount

    // Créer le paiement
    const payment = await db.payment.create({
      data: {
        amount,
        creditId,
        metadata,
      },
    })

    // Récupérer le fund pool
    const fundPool = await db.fundPool.findFirst()

    if (!fundPool) {
      return NextResponse.json({ message: "Fund pool non trouvé" }, { status: 404 })
    }

    // Mettre à jour le solde du fund pool
    const updatedFundPool = await db.fundPool.update({
      where: {
        id: fundPool.id,
      },
      data: {
        balance: fundPool.balance + amount,
      },
    })

    // Créer une transaction
    const transaction = await db.transaction.create({
      data: {
        type: "PAYMENT",
        amount,
        description: `Remboursement pour le crédit #${creditId.substring(0, 8)}`,
        status: "COMPLETED",
        fundPoolId: fundPool.id,
        userId: credit.userId,
        paymentId: payment.id,
      },
    })

    // Mettre à jour le statut du crédit si entièrement remboursé
    if (totalRepaid >= credit.amount) {
      await db.credit.update({
        where: {
          id: creditId,
        },
        data: {
          status: "REMBOURSE",
        },
      })
    }

    return NextResponse.json({
      message: "Paiement enregistré avec succès",
      payment,
      fundPool: updatedFundPool,
      transaction,
    })
  } catch (error) {
    console.error("Payment error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
