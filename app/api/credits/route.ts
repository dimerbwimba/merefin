import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const creditSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  purpose: z.string().min(10),
  duration: z.number().int().positive().max(36),
  // Modifier cette ligne pour accepter une chaîne et la convertir en Date
  expectedRepaymentDate: z.string().transform((str) => new Date(str)),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { userId, amount, purpose, duration, expectedRepaymentDate } = creditSchema.parse(body)

    // Vérifier que l'utilisateur ne demande pas un crédit pour quelqu'un d'autre
    if (session.user.id !== userId && session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    // Créer la demande de crédit
    const credit = await db.credit.create({
      data: {
        amount,
        status: "EN_ATTENTE",
        requestDate: new Date(),
        dueDate: expectedRepaymentDate,
        userId,
        // Stocker les métadonnées supplémentaires
        metadata: {
          purpose,
          duration,
        },
      },
    })

    return NextResponse.json(
      {
        message: "Demande de crédit créée avec succès",
        credit,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Credit request error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    // Si un ID utilisateur est fourni et que l'utilisateur est un administrateur ou un superviseur,
    // ou si l'utilisateur demande ses propres crédits
    if (
      userId &&
      (session.user.role === "ADMINISTRATEUR" || session.user.role === "SUPERVISEUR" || session.user.id === userId)
    ) {
      const credits = await db.credit.findMany({
        where: {
          userId,
        },
        include: {
          payments: true,
        },
        orderBy: {
          requestDate: "desc",
        },
      })

      return NextResponse.json(credits)
    }

    // Si l'utilisateur est un client, renvoyer uniquement ses crédits
    if (session.user.role === "CLIENT") {
      const credits = await db.credit.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          payments: true,
        },
        orderBy: {
          requestDate: "desc",
        },
      })

      return NextResponse.json(credits)
    }

    // Si l'utilisateur est un administrateur ou un superviseur, renvoyer tous les crédits
    if (session.user.role === "ADMINISTRATEUR" || session.user.role === "SUPERVISEUR") {
      const credits = await db.credit.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payments: true,
        },
        orderBy: {
          requestDate: "desc",
        },
      })

      return NextResponse.json(credits)
    }

    return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
  } catch (error) {
    console.error("Get credits error:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
