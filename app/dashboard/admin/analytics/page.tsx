import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto md:px-20 px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de Bord Analytique</h1>
      <AnalyticsDashboard />
    </div>
  )
}
