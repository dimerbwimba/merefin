"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, History, PlusCircle } from "lucide-react"
import type { User } from "next-auth"

interface Credit {
  id: string
  amount: number
  status: string
}

interface PaymentSummary {
  totalPayments: number
  totalAmount: number
  lastPaymentDate: string | null
}

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [credits, setCredits] = useState<Credit[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPayments: 0,
    totalAmount: 0,
    lastPaymentDate: null,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        // Récupérer les crédits
        const creditsResponse = await fetch("/api/credits")
        if (!creditsResponse.ok) {
          throw new Error("Erreur lors de la récupération des crédits")
        }
        const creditsData = await creditsResponse.json()
        setCredits(creditsData)

        // Récupérer le résumé des paiements
        const paymentsResponse = await fetch("/api/payments/summary")
        if (!paymentsResponse.ok) {
          throw new Error("Erreur lors de la récupération des paiements")
        }
        const paymentsData = await paymentsResponse.json()
        setPaymentSummary(paymentsData)
      } catch (error) {
        console.error("Erreur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger vos données. Veuillez réessayer.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const pendingCredits = credits.filter((credit) => credit.status === "EN_ATTENTE")
  const approvedCredits = credits.filter((credit) => credit.status === "APPROUVE")
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue, {user.name}</CardTitle>
          <CardDescription>Tableau de bord client</CardDescription>
        </CardHeader>
        <CardContent>
          <p>En tant que client, vous pouvez:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Demander un crédit</li>
            <li>Voir l'historique de vos crédits</li>
            <li>Effectuer des remboursements</li>
            <li>Mettre à jour votre profil</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/dashboard/credits/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Demander un crédit
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes crédits</CardTitle>
          <CardDescription>Consultez vos crédits actuels et passés</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : credits.length > 0 ? (
            <div className="space-y-2">
              <p>Vous avez {credits.length} crédit(s) au total.</p>
              <p>{pendingCredits.length} en attente d'approbation.</p>
              <p>{approvedCredits.length} crédit(s) actif(s).</p>
            </div>
          ) : (
            <p>Vous n'avez pas encore de crédits.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/credits">
              <CreditCard className="h-4 w-4 mr-2" />
              Voir tous mes crédits
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des remboursements</CardTitle>
          <CardDescription>Consultez vos remboursements effectués</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-2">
              {paymentSummary.totalPayments > 0 ? (
                <>
                  <p>Vous avez effectué {paymentSummary.totalPayments} paiement(s).</p>
                  <p>Montant total remboursé: {formatCurrency(paymentSummary.totalAmount)}</p>
                  {paymentSummary.lastPaymentDate && (
                    <p>Dernier paiement: {new Date(paymentSummary.lastPaymentDate).toLocaleDateString("fr-FR")}</p>
                  )}
                </>
              ) : (
                <p>Vous n'avez pas encore effectué de remboursement.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/payments">
              <History className="h-4 w-4 mr-2" />
              Voir l'historique
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
