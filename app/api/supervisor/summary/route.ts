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

    // Récupérer le nombre total de crédits
    const totalCredits = await db.credit.count()

    // Récupérer le nombre de crédits en attente
    const pendingCredits = await db.credit.count({
      where: {
        status: "EN_ATTENTE",
      },
    })

    // Récupérer le nombre de crédits approuvés
    const approvedCredits = await db.credit.count({
      where: {
        status: "APPROUVE",
      },
    })

    // Récupérer le nombre de crédits rejetés
    const rejectedCredits = await db.credit.count({
      where: {
        status: "REJETE",
      },
    })

    // Récupérer le nombre de crédits remboursés
    const repaidCredits = await db.credit.count({
      where: {
        status: "REMBOURSE",
      },
    })

    // Récupérer le montant total des crédits approuvés
    const totalApprovedAmount = await db.credit.aggregate({
      where: {
        status: {
          in: ["APPROUVE", "REMBOURSE"],
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Récupérer le montant total des remboursements
    const totalRepaidAmount = await db.payment.aggregate({
      _sum: {
        amount: true,
      },
    })

    // Récupérer le nombre total de clients
    const totalClients = await db.user.count({
      where: {
        role: "CLIENT",
      },
    })

    return NextResponse.json({
      total: totalCredits,
      pending: pendingCredits,
      approved: approvedCredits,
      rejected: rejectedCredits,
      repaid: repaidCredits,
      totalApprovedAmount: totalApprovedAmount._sum.amount || 0,
      totalRepaidAmount: totalRepaidAmount._sum.amount || 0,
      totalClients,
    })
  } catch (error) {
    console.error("Summary error:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
