"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Mail, Calendar, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

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

type Client = {
  id: string
  name: string
  email: string
  createdAt: Date
  credits: Credit[]
  totalCredits: number
  activeCredits: number
  totalCreditAmount: number
  totalRepaidAmount: number
}

interface ClientProfileProps {
  client: Client
}

export function ClientProfile({ client }: ClientProfileProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount)
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

  const calculateRepaymentProgress = (credit: Credit) => {
    const totalPaid = credit.payments.reduce((sum, payment) => sum + payment.amount, 0)
    return (totalPaid / credit.amount) * 100
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/dashboard/supervisor/clients">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la liste des clients
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informations du client</CardTitle>
            <CardDescription>Détails personnels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">Nom complet</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{client.email}</p>
                <p className="text-sm text-muted-foreground">Email</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{format(new Date(client.createdAt), "dd MMMM yyyy", { locale: fr })}</p>
                <p className="text-sm text-muted-foreground">Date d'inscription</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/dashboard/supervisor/credits?userId=${client.id}`}>
                <CreditCard className="h-4 w-4 mr-2" />
                Voir tous les crédits
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
            <CardDescription>Aperçu des activités financières</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Total des crédits</p>
                <p className="text-2xl font-bold">{client.totalCredits}</p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Crédits actifs</p>
                <p className="text-2xl font-bold">{client.activeCredits}</p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Montant total emprunté</p>
                <p className="text-2xl font-bold">{formatCurrency(client.totalCreditAmount)}</p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Montant total remboursé</p>
                <p className="text-2xl font-bold">{formatCurrency(client.totalRepaidAmount)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Taux de remboursement global</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={client.totalCreditAmount > 0 ? (client.totalRepaidAmount / client.totalCreditAmount) * 100 : 0}
                  className="h-2"
                />
                <span className="text-sm">
                  {client.totalCreditAmount > 0
                    ? Math.round((client.totalRepaidAmount / client.totalCreditAmount) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des crédits</CardTitle>
          <CardDescription>Liste des crédits demandés par ce client</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="active">Actifs</TabsTrigger>
              <TabsTrigger value="completed">Terminés</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderCreditsTable(client.credits)}</TabsContent>
            <TabsContent value="pending">
              {renderCreditsTable(client.credits.filter((credit) => credit.status === "EN_ATTENTE"))}
            </TabsContent>
            <TabsContent value="active">
              {renderCreditsTable(client.credits.filter((credit) => credit.status === "APPROUVE"))}
            </TabsContent>
            <TabsContent value="completed">
              {renderCreditsTable(
                client.credits.filter((credit) => credit.status === "REMBOURSE" || credit.status === "REJETE"),
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  function renderCreditsTable(credits: Credit[]) {
    if (credits.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-muted-foreground">Aucun crédit trouvé dans cette catégorie.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Montant</th>
              <th className="text-left py-3 px-4">Date de demande</th>
              <th className="text-left py-3 px-4">Statut</th>
              <th className="text-left py-3 px-4">Progression</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {credits.map((credit) => {
              const progressPercentage = calculateRepaymentProgress(credit)

              return (
                <tr key={credit.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-mono text-sm">{credit.id.substring(0, 8)}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(credit.amount)}</td>
                  <td className="py-3 px-4">{format(new Date(credit.requestDate), "dd MMM yyyy", { locale: fr })}</td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(credit.status)}>{getStatusLabel(credit.status)}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    {credit.status === "APPROUVE" || credit.status === "REMBOURSE" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <span className="text-xs">{Math.round(progressPercentage)}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/supervisor/credits/${credit.id}`}>Détails</Link>
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }
}
