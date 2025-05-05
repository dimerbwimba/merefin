"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, ArrowRight, BanknoteIcon } from "lucide-react"

type Payment = {
  id: string
  amount: number
  date: Date
}

type Credit = {
  id: string
  amount: number
  status: string
  requestDate: Date
  approvalDate: Date | null
  dueDate: Date | null
  payments: Payment[]
}

interface CreditsListProps {
  credits: Credit[]
}

export function CreditsList({ credits }: CreditsListProps) {
  const [activeTab, setActiveTab] = useState("all")

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

  const filteredCredits = credits.filter((credit) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return credit.status === "EN_ATTENTE"
    if (activeTab === "approved") return credit.status === "APPROUVE"
    if (activeTab === "rejected") return credit.status === "REJETE"
    if (activeTab === "repaid") return credit.status === "REMBOURSE"
    return true
  })

  const calculateTotalPaid = (payments: Payment[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-md">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="approved">Approuvés</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés</TabsTrigger>
          <TabsTrigger value="repaid">Remboursés</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredCredits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">Aucun crédit trouvé dans cette catégorie.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard/credits/new">Demander un crédit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCredits.map((credit) => {
            const totalPaid = calculateTotalPaid(credit.payments)
            const remainingAmount = credit.amount - totalPaid
            const isFullyPaid = totalPaid >= credit.amount

            return (
              <Card key={credit.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle>
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(credit.amount)}
                    </CardTitle>
                    <Badge className={getStatusColor(credit.status)}>{getStatusLabel(credit.status)}</Badge>
                  </div>
                  <CardDescription className="flex items-center mt-1">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {format(new Date(credit.requestDate), "dd MMMM yyyy", { locale: fr })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Montant payé:</span>
                      <span>
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(totalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reste à payer:</span>
                      <span>
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(remainingAmount)}
                      </span>
                    </div>
                    {credit.dueDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Échéance:</span>
                        <span>{format(new Date(credit.dueDate), "dd/MM/yyyy", { locale: fr })}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 pt-3">
                  <div className="flex justify-between w-full">
                    {credit.status === "APPROUVE" && !isFullyPaid && (
                      <Button asChild size="sm" className="flex items-center">
                        <Link href={`/dashboard/credits/${credit.id}/payment`}>
                          <BanknoteIcon className="h-4 w-4 mr-1" />
                          Rembourser
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="sm" className="ml-auto">
                      <Link href={`/dashboard/credits/${credit.id}`}>
                        Détails
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {filteredCredits.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button asChild>
            <Link href="/dashboard/credits/new">Demander un nouveau crédit</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
