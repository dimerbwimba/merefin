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

    // Pour les clients, récupérer uniquement leurs paiements
    if (session.user.role === "CLIENT") {
      // Récupérer tous les crédits de l'utilisateur
      const credits = await db.credit.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      })

      const creditIds = credits.map((credit) => credit.id)

      // Récupérer tous les paiements pour ces crédits
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

      // Calculer le montant total des paiements
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

      // Récupérer la date du dernier paiement
      const lastPaymentDate = payments.length > 0 ? payments[0].date : null

      return NextResponse.json({
        totalPayments: payments.length,
        totalAmount,
        lastPaymentDate,
      })
    }

    // Pour les superviseurs et administrateurs, renvoyer une erreur
    // (ils doivent utiliser l'API dédiée aux superviseurs)
    return NextResponse.json({ message: "Endpoint réservé aux clients" }, { status: 403 })
  } catch (error) {
    console.error("Payment summary error:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
