import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminCreditsList } from "@/components/admin/credits-list"

export default async function AdminCreditsPage({
  searchParams,
}: {
  searchParams: { status?: string; userId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  // Construire les filtres en fonction des paramètres de recherche
  const filters: any = {}

  if (searchParams.status) {
    filters.status = searchParams.status
  }

  if (searchParams.userId) {
    filters.userId = searchParams.userId
  }

  // Récupérer les crédits avec les filtres
  const credits = await db.credit.findMany({
    where: filters,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: true,
    },
    orderBy: {
      requestDate: "desc",
    },
  })

  // Récupérer tous les utilisateurs clients pour le filtre
  const clients = await db.user.findMany({
    where: {
      role: "CLIENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto py-8 md:px-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Gestion des Crédits</h1>
      <AdminCreditsList credits={credits} clients={clients} currentFilters={searchParams} />
    </div>
  )
}
