import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const approvalSchema = z.object({
  dueDate: z.string().transform((str) => new Date(str)),
  interestRate: z.string().transform((val) => Number.parseFloat(val.replace(/\s/g, "").replace(",", "."))),
  notes: z.string().optional(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un superviseur ou un administrateur
    if (session.user.role !== "SUPERVISEUR" && session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const creditId = params.id
    const body = await req.json()
    const { dueDate, interestRate, notes } = approvalSchema.parse(body)

    // Vérifier que le crédit existe
    const credit = await db.credit.findUnique({
      where: {
        id: creditId,
      },
    })

    if (!credit) {
      return NextResponse.json({ message: "Crédit non trouvé" }, { status: 404 })
    }

    // Vérifier que le crédit est en attente
    if (credit.status !== "EN_ATTENTE") {
      return NextResponse.json({ message: "Ce crédit n'est pas en attente d'approbation" }, { status: 400 })
    }

    // Vérifier la disponibilité des fonds dans le fund pool
    const fundPool = await db.fundPool.findFirst()

    if (!fundPool) {
      return NextResponse.json({ message: "Fund pool non trouvé" }, { status: 404 })
    }

    if (fundPool.balance < credit.amount) {
      return NextResponse.json(
        {
          message: "Fonds insuffisants dans le fund pool pour approuver ce crédit",
        },
        { status: 400 },
      )
    }

    // Mettre à jour le crédit
    const updatedCredit = await db.credit.update({
      where: {
        id: creditId,
      },
      data: {
        status: "APPROUVE",
        approvalDate: new Date(),
        dueDate,
        supervisorId: session.user.id,
        metadata: {
          ...credit.metadata,
          interestRate,
          approvalNotes: notes,
          approvedBy: session.user.id,
        },
      },
    })

    // Mettre à jour le solde du fund pool
    const updatedFundPool = await db.fundPool.update({
      where: {
        id: fundPool.id,
      },
      data: {
        balance: fundPool.balance - credit.amount,
      },
    })

    // Créer une transaction
    const transaction = await db.transaction.create({
      data: {
        type: "CREDIT_APPROVAL",
        amount: credit.amount,
        description: `Approbation du crédit #${creditId.substring(0, 8)} pour ${credit.amount} XOF`,
        status: "COMPLETED",
        fundPoolId: fundPool.id,
        userId: session.user.id,
        creditId: creditId,
      },
    })

    return NextResponse.json({
      message: "Crédit approuvé avec succès",
      credit: updatedCredit,
      fundPool: updatedFundPool,
      transaction,
    })
  } catch (error) {
    console.error("Credit approval error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
