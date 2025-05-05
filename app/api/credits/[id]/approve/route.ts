import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const approvalSchema = z.object({
  dueDate: z.string().transform((str) => new Date(str)),
  interestRate: z.string().transform((val) => Number.parseFloat(val.replace(/\s/g, "").replace(",", "."))),
  notes: z.string().optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un superviseur ou un administrateur
    if (session.user.role !== "SUPERVISEUR" && session.user.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 })
    }

    const {id} = await params
    const body = await req.json()
    const { dueDate, interestRate, notes } = approvalSchema.parse(body)

    // Vérifier que le crédit existe
    const credit = await db.credit.findUnique({
      where: {
        id: id,
      },
    })

    if (!credit) {
      return NextResponse.json({ message: "Crédit non trouvé" }, { status: 404 })
    }

    // Vérifier que le crédit est en attente
    if (credit.status !== "EN_ATTENTE") {
      return NextResponse.json({ message: "Ce crédit n'est pas en attente d'approbation" }, { status: 400 })
    }

    // Mettre à jour le crédit
    const updatedCredit = await db.credit.update({
      where: {
        id: id,
      },
      data: {
        status: "APPROUVE",
        approvalDate: new Date(),
        dueDate,
        supervisorId: session.user.id,
        metadata: {
          ...(typeof credit.metadata === "object" && credit.metadata !== null ? credit.metadata : {}),
          interestRate,
          approvalNotes: notes,
          approvedBy: session.user.id,
        },
      },
    })

    return NextResponse.json({
      message: "Crédit approuvé avec succès",
      credit: updatedCredit,
    })
  } catch (error) {
    console.error("Credit approval error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
