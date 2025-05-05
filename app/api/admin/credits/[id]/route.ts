import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const {id} = await params
   

    // Vérifier si le crédit existe
    const credit = await db.credit.findUnique({
      where: {
        id: id,
      },
      include: {
        payments: true,
      },
    })

    if (!credit) {
      return NextResponse.json({ message: "Crédit non trouvé" }, { status: 404 })
    }

    // Supprimer d'abord tous les paiements associés
    if (credit.payments.length > 0) {
      await db.payment.deleteMany({
        where: {
          id,
        },
      })
    }

    // Supprimer le crédit
    await db.credit.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({
      message: "Crédit et paiements associés supprimés avec succès",
    })
  } catch (error) {
    console.error("Delete credit error:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
