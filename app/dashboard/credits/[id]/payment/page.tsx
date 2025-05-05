import { getServerSession } from "next-auth/next"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PaymentForm } from "@/components/payments/payment-form"

export default async function MakePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const {id} = await params
  const credit = await db.credit.findUnique({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      payments: true,
    },
  })

  if (!credit) {
    notFound()
  }

  // Vérifier si le crédit est dans un état qui permet le remboursement
  if (credit.status !== "APPROUVE") {
    redirect(`/dashboard/credits`)
  }

  // Calculer le montant restant à payer
  const totalPaid = credit.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingAmount = credit.amount - totalPaid

  // Si le crédit est déjà entièrement remboursé, rediriger vers la page de détail
  if (remainingAmount <= 0) {
    redirect(`/dashboard/credits/${credit.id}`)
  }

  return (
    <div className="container mx-auto py-8 px-20">
      <h1 className="text-2xl font-bold text-center mb-6">Effectuer un Remboursement</h1>
      <PaymentForm creditId={credit.id} remainingAmount={remainingAmount} creditAmount={credit.amount} />
    </div>
  )
}
