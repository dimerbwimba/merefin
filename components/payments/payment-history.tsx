"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type Payment = {
  id: string
  amount: number
  date: Date
  creditId: string
  creditAmount: number
  creditStatus: string
}

interface PaymentHistoryProps {
  payments: Payment[]
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
        return "En attente"
      case "APPROUVE":
        return "Approuvé"
      case "REJETE":
        return "Rejeté"
      case "REMBOURSE":
        return "Remboursé"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "APPROUVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "REJETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "REMBOURSE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Calculer le montant total des paiements
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour au tableau de bord
          </Link>
        </Button>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total des remboursements</p>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableCaption>Historique de vos remboursements</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Montant payé</TableHead>
              <TableHead>Crédit associé</TableHead>
              <TableHead>Statut du crédit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Aucun remboursement effectué pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.date), "dd MMMM yyyy", { locale: fr })}</TableCell>
                  <TableCell className="font-mono text-xs">#{payment.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{formatCurrency(payment.creditAmount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.creditStatus)}>
                      {getStatusLabel(payment.creditStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/credits/${payment.creditId}`}>Voir le crédit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
