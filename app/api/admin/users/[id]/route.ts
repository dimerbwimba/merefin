import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["CLIENT", "SUPERVISEUR", "ADMINISTRATEUR"]),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const userId = params.id
    const body = await req.json()
    const { name, email, password, role } = updateUserSchema.parse(body)

    // Vérifier si l'utilisateur existe
    const existingUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== existingUser.email) {
      const userWithEmail = await db.user.findUnique({
        where: {
          email,
        },
      })

      if (userWithEmail && userWithEmail.id !== userId) {
        return NextResponse.json({ message: "Cet email est déjà utilisé par un autre utilisateur." }, { status: 409 })
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      name,
      email,
      role,
    }

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      updateData.password = await hash(password, 10)
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    })

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: "Utilisateur mis à jour avec succès",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Update user error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const userId = params.id

    // Vérifier si l'utilisateur existe
    const existingUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Empêcher la suppression de son propre compte
    if (userId === session.user.id) {
      return NextResponse.json({ message: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 })
    }

    // Supprimer l'utilisateur
    await db.user.delete({
      where: {
        id: userId,
      },
    })

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès",
    })
  } catch (error) {
    console.error("Delete user error:", error)

    // Si l'erreur est due à des contraintes de clé étrangère (l'utilisateur a des crédits)
    if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
      return NextResponse.json(
        {
          message:
            "Impossible de supprimer cet utilisateur car il possède des crédits. Supprimez d'abord ses crédits ou assignez-les à un autre utilisateur.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
