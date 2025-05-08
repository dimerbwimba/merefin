import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const depositSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un administrateur
    if (session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { amount, description } = depositSchema.parse(body)

    // Récupérer le fund pool (ou le créer s'il n'existe pas)
    let fundPool = await db.fundPool.findFirst()

    if (!fundPool) {
      fundPool = await db.fundPool.create({
        data: {
          balance: 0,
        },
      })
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
        type: "DEPOSIT",
        amount,
        description,
        status: "COMPLETED",
        fundPoolId: fundPool.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      message: "Dépôt effectué avec succès",
      fundPool: updatedFundPool,
      transaction,
    })
  } catch (error) {
    console.error("Fund pool deposit error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
