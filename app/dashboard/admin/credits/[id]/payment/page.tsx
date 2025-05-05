import { getServerSession } from "next-auth/next"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminPaymentForm } from "@/components/admin/payment-form"

export default async function AdminMakePaymentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  const credit = await db.credit.findUnique({
    where: {
      id: params.id,
    },
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
  })

  if (!credit) {
    notFound()
  }

  // Vérifier si le crédit est dans un état qui permet le remboursement
  if (credit.status !== "APPROUVE") {
    redirect(`/dashboard/admin/credits/${credit.id}`)
  }

  // Calculer le montant restant à payer
  const totalPaid = credit.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingAmount = credit.amount - totalPaid

  // Si le crédit est déjà entièrement remboursé, rediriger vers la page de détail
  if (remainingAmount <= 0) {
    redirect(`/dashboard/admin/credits/${credit.id}`)
  }

  return (
    <div className="container mx-auto py-8 md:px-20 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">Enregistrer un Remboursement</h1>
      <AdminPaymentForm credit={credit} remainingAmount={remainingAmount} />
    </div>
  )
}
