import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { CreditsList } from "@/components/credits/credits-list"

export default async function CreditsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const credits = await db.credit.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      requestDate: "desc",
    },
    include: {
      payments: true,
    },
  })

  return (
    <div className="container mx-auto py-8 px-20">
      <h1 className="text-2xl text-center font-bold mb-6">Mes Crédits</h1>
      <CreditsList credits={credits} />
    </div>
  )
}
