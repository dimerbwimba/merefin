import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PaymentsList } from "@/components/supervisor/payments-list"

export default async function SupervisorPaymentsPage({
  searchParams,
}: {
  searchParams: { userId?: string; creditId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "SUPERVISEUR" && session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard")
  }

  // Récupérer tous les paiements avec les informations sur les crédits et les utilisateurs
  const payments = await db.payment.findMany({
    include: {
      credit: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  })

  // Récupérer tous les clients pour le filtre
  const clients = await db.user.findMany({
    where: {
      role: "CLIENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Récupérer tous les crédits pour le filtre
  const credits = await db.credit.findMany({
    where: {
      status: {
        in: ["APPROUVE", "REMBOURSE"],
      },
    },
    select: {
      id: true,
      amount: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      requestDate: "desc",
    },
  })

  return (
    <div className="container mx-auto py-8 px-20">
      <h1 className="text-2xl font-bold mb-6">Suivi des Remboursements</h1>
      <PaymentsList payments={payments} clients={clients} credits={credits} currentFilters={searchParams} />
    </div>
  )
}
