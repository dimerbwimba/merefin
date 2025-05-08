import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { FundPoolDashboard } from "@/components/admin/fund-pool-dashboard"

export default async function FundPoolPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  // Récupérer le fund pool (en créer un s'il n'existe pas)
  let fundPool = await db.fundPool.findFirst()

  if (!fundPool) {
    fundPool = await db.fundPool.create({
      data: {
        balance: 0,
      },
    })
  }

  // Récupérer les transactions récentes
  const recentTransactions = await db.transaction.findMany({
    where: {
      fundPoolId: fundPool.id,
    },
    orderBy: {
      date: "desc",
    },
    take: 10,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      credit: true,
      payment: true,
    },
  })

  // Récupérer les statistiques
  const pendingCredits = await db.credit.findMany({
    where: {
      status: "EN_ATTENTE",
    },
    select: {
      id: true,
      amount: true,
      user: {
        select: {
          name: true,
        },
      },
      requestDate: true,
    },
  })

  // Ce code additionne tous les montants des crédits en attente et stocke le résultat dans la variable totalPendingAmount.
  const totalPendingAmount = pendingCredits.reduce((sum, credit) => sum + credit.amount, 0)

  return (
    <div className="container mx-auto py-6">
      <FundPoolDashboard
        fundPool={fundPool}
        recentTransactions={recentTransactions}
        pendingCredits={pendingCredits}
        totalPendingAmount={totalPendingAmount}
      />
    </div>
  )
}
