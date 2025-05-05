"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { ClipboardList, CreditCard, History, Users } from "lucide-react"
import type { User } from "next-auth"

interface CreditSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  repaid: number
}

interface PaymentSummary {
  totalPayments: number
  totalAmount: number
  lastPaymentDate: string | null
  recentPayments: {
    id: string
    amount: number
    date: string
    clientName: string
  }[]
}

interface DashboardSupervisorProps {
  user: User
}

export function DashboardSupervisor({ user }: DashboardSupervisorProps) {
  const [creditSummary, setCreditSummary] = useState<CreditSummary>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    repaid: 0,
  })
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPayments: 0,
    totalAmount: 0,
    lastPaymentDate: null,
    recentPayments: [],
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        // Récupérer le résumé des crédits
        const creditResponse = await fetch("/api/supervisor/summary")
        if (!creditResponse.ok) {
          throw new Error("Erreur lors de la récupération des données de crédit")
        }
        const creditData = await creditResponse.json()
        setCreditSummary(creditData)

        // Récupérer le résumé des paiements
        const paymentResponse = await fetch("/api/supervisor/payments/summary")
        if (!paymentResponse.ok) {
          throw new Error("Erreur lors de la récupération des données de paiement")
        }
        const paymentData = await paymentResponse.json()
        setPaymentSummary(paymentData)
      } catch (error) {
        console.error("Erreur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données. Veuillez réessayer.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{creditSummary.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{creditSummary.pending}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">{creditSummary.approved}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600 dark:text-red-500">{creditSummary.rejected}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Demandes en attente</CardTitle>
            <CardDescription>Demandes nécessitant votre approbation</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p>
                {creditSummary.pending > 0
                  ? `Vous avez ${creditSummary.pending} demande(s) en attente d'approbation.`
                  : "Aucune demande en attente pour le moment."}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/supervisor/credits?status=EN_ATTENTE">
                <ClipboardList className="h-4 w-4 mr-2" />
                Voir les demandes
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crédits actifs</CardTitle>
            <CardDescription>Crédits actuellement en cours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p>
                {creditSummary.approved > 0
                  ? `Il y a ${creditSummary.approved} crédit(s) actif(s) à suivre.`
                  : "Aucun crédit actif pour le moment."}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/supervisor/credits?status=APPROUVE">
                <CreditCard className="h-4 w-4 mr-2" />
                Voir les crédits actifs
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remboursements</CardTitle>
            <CardDescription>Suivi des remboursements clients</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-2">
                <p>Total des remboursements: {formatCurrency(paymentSummary.totalAmount)}</p>
                <p>Nombre de paiements: {paymentSummary.totalPayments}</p>
                {paymentSummary.recentPayments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Paiements récents:</p>
                    <ul className="space-y-2 text-sm">
                      {paymentSummary.recentPayments.map((payment) => (
                        <li key={payment.id} className="flex justify-between">
                          <span>{payment.clientName}</span>
                          <span>{formatCurrency(payment.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/supervisor/payments">
                <History className="h-4 w-4 mr-2" />
                Voir les remboursements
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des clients</CardTitle>
          <CardDescription>Consultez et gérez les clients</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Accédez à la liste complète des clients et consultez leurs informations.</p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/supervisor/clients">
              <Users className="h-4 w-4 mr-2" />
              Gérer les clients
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
