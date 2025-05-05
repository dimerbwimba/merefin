import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PaymentHistory } from "@/components/payments/payment-history"

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Récupérer tous les crédits de l'utilisateur
  const credits = await db.credit.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      amount: true,
      status: true,
      payments: {
        orderBy: {
          date: "desc",
        },
      },
    },
  })

  // Extraire tous les paiements de tous les crédits
  const payments = credits.flatMap((credit) =>
    credit.payments.map((payment) => ({
      ...payment,
      creditAmount: credit.amount,
      creditStatus: credit.status,
    })),
  )

  // Trier les paiements par date (du plus récent au plus ancien)
  payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="container mx-auto px-20 py-8">
      <h1 className="text-2xl font-bold mb-6">Historique des Remboursements</h1>
      <PaymentHistory payments={payments} />
    </div>
  )
}
