import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ClientsList } from "@/components/supervisor/clients-list"

export default async function SupervisorClientsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "SUPERVISEUR" && session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  // Récupérer tous les clients
  const clients = await db.user.findMany({
    where: {
      role: "CLIENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      credits: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Enrichir les données des clients avec des statistiques
  const enrichedClients = clients.map((client) => {
    const totalCredits = client.credits.length
    const activeCredits = client.credits.filter((credit) => credit.status === "APPROUVE").length
    const totalCreditAmount = client.credits.reduce((sum, credit) => sum + credit.amount, 0)

    return {
      ...client,
      totalCredits,
      activeCredits,
      totalCreditAmount,
    }
  })

  return (
    <div className="container mx-auto px-20 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Clients</h1>
      <ClientsList clients={enrichedClients} />
    </div>
  )
}
