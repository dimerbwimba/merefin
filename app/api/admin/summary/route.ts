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

    // Vérifier que l'utilisateur est un administrateur
    if (session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    // Récupérer le nombre total d'utilisateurs
    const totalUsers = await db.user.count()

    // Récupérer le nombre d'utilisateurs par rôle
    const clientsCount = await db.user.count({
      where: {
        role: "CLIENT",
      },
    })

    const supervisorsCount = await db.user.count({
      where: {
        role: "SUPERVISEUR",
      },
    })

    const adminsCount = await db.user.count({
      where: {
        role: "ADMINISTRATEUR",
      },
    })

    // Récupérer le nombre total de crédits
    const totalCredits = await db.credit.count()

    // Récupérer le nombre de crédits par statut
    const pendingCredits = await db.credit.count({
      where: {
        status: "EN_ATTENTE",
      },
    })

    const approvedCredits = await db.credit.count({
      where: {
        status: "APPROUVE",
      },
    })

    const rejectedCredits = await db.credit.count({
      where: {
        status: "REJETE",
      },
    })

    // Récupérer le montant total des crédits approuvés
    const totalCreditAmount = await db.credit.aggregate({
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

    // Récupérer les 5 derniers utilisateurs inscrits
    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Récupérer les 5 derniers crédits
    const recentCredits = await db.credit.findMany({
      take: 5,
      orderBy: {
        requestDate: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    // Formater les données pour la réponse
    const formattedRecentUsers = recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }))

    const formattedRecentCredits = recentCredits.map((credit) => ({
      id: credit.id,
      amount: credit.amount,
      status: credit.status,
      clientName: credit.user.name,
      requestDate: credit.requestDate.toISOString(),
    }))

    return NextResponse.json({
      totalUsers,
      clientsCount,
      supervisorsCount,
      adminsCount,
      totalCredits,
      pendingCredits,
      approvedCredits,
      rejectedCredits,
      totalCreditAmount: totalCreditAmount._sum.amount || 0,
      totalRepaidAmount: totalRepaidAmount._sum.amount || 0,
      recentUsers: formattedRecentUsers,
      recentCredits: formattedRecentCredits,
    })
  } catch (error) {
    console.error("Admin summary error:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
