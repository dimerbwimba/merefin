import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { CreditRequestForm } from "@/components/credits/credits-request-form"

export default async function NewCreditPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "CLIENT") {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 px-20">
      <h1 className="text-2xl text-center font-bold mb-6">Demande de Crédit</h1>
      <CreditRequestForm userId={session.user.id} />
    </div>
  )
}
