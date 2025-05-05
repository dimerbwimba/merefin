import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["CLIENT", "SUPERVISEUR", "ADMINISTRATEUR"]),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, role } = userSchema.parse(body)

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return NextResponse.json({ message: "Un utilisateur avec cet email existe déjà." }, { status: 409 })
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 10)

    // Créer l'utilisateur
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    })

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: "Utilisateur créé avec succès",
        user: userWithoutPassword,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create user error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
