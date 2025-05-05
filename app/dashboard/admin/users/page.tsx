import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UsersList } from "@/components/admin/users-list"

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  // Récupérer tous les utilisateurs
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      credits: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Enrichir les données des utilisateurs
  const enrichedUsers = users.map((user) => ({
    ...user,
    creditsCount: user.credits.length,
  }))

  return (
    <div className="container mx-auto py-8 md:px-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h1>
      <UsersList users={enrichedUsers} />
    </div>
  )
}
