import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un superviseur ou un administrateur
    if (session.user.role !== "SUPERVISEUR" && session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    // Récupérer tous les paiements
    const payments = await db.payment.findMany({
      orderBy: {
        date: "desc",
      },
    })

    // Calculer le montant total des paiements
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

    // Récupérer la date du dernier paiement
    const lastPaymentDate = payments.length > 0 ? payments[0].date : null

    // Récupérer les 5 paiements les plus récents avec les informations du client
    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: {
        date: "desc",
      },
      include: {
        credit: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    // Formater les paiements récents pour l'affichage
    const formattedRecentPayments = recentPayments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.date.toISOString(),
      clientName: payment.credit.user.name,
    }))

    return NextResponse.json({
      totalPayments: payments.length,
      totalAmount,
      lastPaymentDate,
      recentPayments: formattedRecentPayments,
    })
  } catch (error) {
    console.error("Supervisor payment summary error:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
