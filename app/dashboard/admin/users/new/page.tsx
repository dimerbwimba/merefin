import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { UserForm } from "@/components/admin/user-form"

export default async function NewUserPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 mx:px-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Créer un nouvel utilisateur</h1>
      <UserForm />
    </div>
  )
}
