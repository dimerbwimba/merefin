import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const rejectionSchema = z.object({
  rejectionReason: z.string().min(10),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un superviseur ou un administrateur
    if (
      session.user.role !== "SUPERVISEUR" &&
      session.user.role !== "ADMINISTRATEUR"
    ) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
    }
    const { id } = await params;
    const creditId = id;
    const body = await req.json();
    const { rejectionReason } = rejectionSchema.parse(body);

    // Vérifier que le crédit existe
    const credit = await db.credit.findUnique({
      where: {
        id: creditId,
      },
    });

    if (!credit) {
      return NextResponse.json(
        { message: "Crédit non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le crédit est en attente
    if (credit.status !== "EN_ATTENTE") {
      return NextResponse.json(
        { message: "Ce crédit n'est pas en attente d'approbation" },
        { status: 400 }
      );
    }

    // Mettre à jour le crédit
    const updatedCredit = await db.credit.update({
      where: {
        id: creditId,
      },
      data: {
        status: "REJETE",
        supervisorId: session.user.id,
        metadata: {
          ...(typeof credit.metadata === "object" && credit.metadata !== null ? credit.metadata : {}),
          rejectionReason,
          rejectedBy: session.user.id,
          rejectionDate: new Date(),
        },
      },
    });

    return NextResponse.json({
      message: "Crédit rejeté avec succès",
      credit: updatedCredit,
    });
  } catch (error) {
    console.error("Credit rejection error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Données d'entrée invalides", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
