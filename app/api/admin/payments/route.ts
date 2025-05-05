import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const paymentSchema = z.object({
  creditId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT"]).default("ESPECES"),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { creditId, amount, paymentMethod, notes } = paymentSchema.parse(body)

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
    if (credit.status !== "APPROUVE") {
      return NextResponse.json(
        { message: "Ce crédit n'est pas dans un état permettant le remboursement" },
        { status: 400 },
      )
    }

    // Calculer le montant total déjà payé
    const totalPaid = credit.payments.reduce((sum, payment) => sum + payment.amount, 0)

    // Vérifier que le montant du paiement ne dépasse pas le montant restant à payer
    const remainingAmount = credit.amount - totalPaid
    if (amount > remainingAmount) {
      return NextResponse.json(
        {
          message: `Le montant du paiement ne peut pas dépasser le montant restant à payer (${remainingAmount})`,
        },
        { status: 400 },
      )
    }

    // Créer le paiement avec les métadonnées supplémentaires
    const payment = await db.payment.create({
      data: {
        amount,
        creditId,
        metadata: {
          paymentMethod,
          notes: notes || null,
          processedBy: session.user.id,
        },
      },
    })

    // Vérifier si le crédit est entièrement remboursé
    const newTotalPaid = totalPaid + amount
    if (newTotalPaid >= credit.amount) {
      // Mettre à jour le statut du crédit
      await db.credit.update({
        where: {
          id: creditId,
        },
        data: {
          status: "REMBOURSE",
        },
      })
    }

    return NextResponse.json(
      {
        message: "Paiement enregistré avec succès",
        payment,
        isFullyPaid: newTotalPaid >= credit.amount,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Payment error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
