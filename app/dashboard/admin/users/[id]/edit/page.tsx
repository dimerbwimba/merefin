import { getServerSession } from "next-auth/next"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserForm } from "@/components/admin/user-form"

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  // Récupérer les informations de l'utilisateur
  const user = await db.user.findUnique({
    where: {
      id: params.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="container mx-auto md:px-20 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier l'utilisateur</h1>
      <UserForm user={{ ...user, role: user.role as "ADMINISTRATEUR" | "CLIENT" | "SUPERVISEUR" }} />
    </div>
  )
}
