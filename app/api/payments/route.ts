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

    // Vérifier que l'utilisateur est le propriétaire du crédit ou un administrateur
    if (credit.userId !== session.user.id && session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
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
          processedBy: session.user.role === "ADMINISTRATEUR" ? session.user.id : null,
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const creditId = searchParams.get("creditId")

    if (creditId) {
      // Vérifier que le crédit existe
      const credit = await db.credit.findUnique({
        where: {
          id: creditId,
        },
      })

      if (!credit) {
        return NextResponse.json({ message: "Crédit non trouvé" }, { status: 404 })
      }

      // Vérifier que l'utilisateur est le propriétaire du crédit ou un administrateur/superviseur
      if (
        credit.userId !== session.user.id &&
        session.user.role !== "ADMINISTRATEUR" &&
        session.user.role !== "SUPERVISEUR"
      ) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
      }

      const payments = await db.payment.findMany({
        where: {
          creditId,
        },
        orderBy: {
          date: "desc",
        },
      })

      return NextResponse.json(payments)
    }

    // Si l'utilisateur est un client, renvoyer uniquement ses paiements
    if (session.user.role === "CLIENT") {
      const credits = await db.credit.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      })

      const creditIds = credits.map((credit) => credit.id)

      const payments = await db.payment.findMany({
        where: {
          creditId: {
            in: creditIds,
          },
        },
        orderBy: {
          date: "desc",
        },
      })

      return NextResponse.json(payments)
    }

    // Si l'utilisateur est un administrateur ou un superviseur, renvoyer tous les paiements
    if (session.user.role === "ADMINISTRATEUR" || session.user.role === "SUPERVISEUR") {
      const payments = await db.payment.findMany({
        include: {
          credit: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      })

      return NextResponse.json(payments)
    }

    return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
  } catch (error) {
    console.error("Get payments error:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
