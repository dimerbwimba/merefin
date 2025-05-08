import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { DashboardSupervisor } from "@/components/dashboard/dashboard-supervisor"
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const { user } = session

  return (
    <div className="container mx-auto py-6 md:px-20 px-2 ">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      {user.role === "CLIENT" && <DashboardClient user={user} />}
      {user.role === "SUPERVISEUR" && <DashboardSupervisor user={user} />}
      {user.role === "ADMINISTRATEUR" && <DashboardAdmin user={user} />}
    </div>
  )
}
