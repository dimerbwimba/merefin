import { getServerSession } from "next-auth/next"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ClientProfile } from "@/components/supervisor/client-profile"

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "SUPERVISEUR" && session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  // Récupérer les informations du client
  const client = await db.user.findUnique({
    where: {
      id: params.id,
      role: "CLIENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      credits: {
        include: {
          payments: true,
        },
        orderBy: {
          requestDate: "desc",
        },
      },
    },
  })

  if (!client) {
    notFound()
  }

  // Calculer les statistiques du client
  const totalCredits = client.credits.length
  const activeCredits = client.credits.filter((credit) => credit.status === "APPROUVE").length
  const totalCreditAmount = client.credits.reduce((sum, credit) => sum + credit.amount, 0)

  // Calculer le montant total remboursé
  const totalRepaidAmount = client.credits.reduce(
    (sum, credit) => sum + credit.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0),
    0,
  )

  // Enrichir les données du client
  const enrichedClient = {
    ...client,
    totalCredits,
    activeCredits,
    totalCreditAmount,
    totalRepaidAmount,
  }

  return (
    <div className="container mx-auto px-20 py-8">
      <h1 className="text-2xl font-bold mb-6">Profil Client</h1>
      <ClientProfile client={enrichedClient} />
    </div>
  )
}
