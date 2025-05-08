"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FundPoolDashboardProps {
  fundPool: {
    id: string
    balance: number
    createdAt: Date
    updatedAt: Date
  }
  recentTransactions: any[]
  pendingCredits: any[]
  totalPendingAmount: number
}

export function FundPoolDashboard({
  fundPool,
  recentTransactions,
  pendingCredits,
  totalPendingAmount,
}: FundPoolDashboardProps) {
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount)
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr })
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case "WITHDRAWAL":
        return <ArrowDownLeft className="h-4 w-4 text-red-500" />
      case "CREDIT_APPROVAL":
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />
      case "PAYMENT":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "Dépôt"
      case "WITHDRAWAL":
        return "Retrait"
      case "CREDIT_APPROVAL":
        return "Approbation de crédit"
      case "PAYMENT":
        return "Remboursement"
      default:
        return type
    }
  }

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Complété</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-500">En attente</Badge>
      case "FAILED":
        return <Badge className="bg-red-500">Échoué</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleDeposit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/fund-pool/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount.replace(/\s/g, "").replace(",", ".")),
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors du dépôt.")
      }

      toast({
        title: "Dépôt effectué",
        description: `${formatCurrency(Number.parseFloat(amount))} ont été ajoutés au fund pool.`,
        variant: "success",
      })

      setAmount("")
      setDescription("")
      setIsDepositDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Deposit error:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du dépôt.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
      })
      return
    }

    if (Number.parseFloat(amount) > fundPool.balance) {
      toast({
        variant: "destructive",
        title: "Fonds insuffisants",
        description: "Le montant demandé dépasse le solde disponible dans le fund pool.",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/fund-pool/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount.replace(/\s/g, "").replace(",", ".")),
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors du retrait.")
      }

      toast({
        title: "Retrait effectué",
        description: `${formatCurrency(Number.parseFloat(amount))} ont été retirés du fund pool.`,
        variant: "success",
      })

      setAmount("")
      setDescription("")
      setIsWithdrawDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du retrait.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 md:px-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion du Fund Pool</h2>
          <p className="text-muted-foreground">
            Gérez le compte central qui contient les fonds disponibles pour les crédits.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Solde actuel</CardTitle>
            <CardDescription>Montant disponible dans le fund pool</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 items-center justify-between">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-primary mr-2" />
                <div className="text-3xl font-bold">{formatCurrency(fundPool.balance)}</div>
              </div>
              <div className="flex gap-2">
                <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Dépôt
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Effectuer un dépôt</DialogTitle>
                      <DialogDescription>
                        Ajoutez des fonds au fund pool. Ces fonds seront disponibles pour les crédits.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Montant (USD)</Label>
                        <Input
                          id="amount"
                          placeholder="Ex: 1 000 000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optionnel)</Label>
                        <Textarea
                          id="description"
                          placeholder="Ex: Financement initial du fund pool"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleDeposit} disabled={isLoading}>
                        {isLoading ? "Traitement..." : "Confirmer le dépôt"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowDownLeft className="h-4 w-4 mr-2" />
                      Retrait
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Effectuer un retrait</DialogTitle>
                      <DialogDescription>
                        Retirez des fonds du fund pool. Assurez-vous de laisser suffisamment pour couvrir les demandes
                        en attente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Montant (USD)</Label>
                        <Input
                          id="amount"
                          placeholder="Ex: 500 000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Solde disponible: {formatCurrency(fundPool.balance)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Raison du retrait (optionnel)</Label>
                        <Textarea
                          id="description"
                          placeholder="Ex: Transfert vers compte bancaire principal"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={isLoading || Number.parseFloat(amount || "0") > fundPool.balance}
                      >
                        {isLoading ? "Traitement..." : "Confirmer le retrait"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Demandes en attente</CardTitle>
            <CardDescription>Crédits en attente d'approbation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nombre de demandes:</span>
                <span className="font-medium">{pendingCredits.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Montant total:</span>
                <span className="font-medium">{formatCurrency(totalPendingAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Solde après approbation:</span>
                <span
                  className={`font-medium ${fundPool.balance < totalPendingAmount ? "text-red-500" : "text-green-500"}`}
                >
                  {formatCurrency(fundPool.balance - totalPendingAmount)}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/dashboard/admin/credits">Voir toutes les demandes</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Dernière mise à jour</CardTitle>
            <CardDescription>Informations sur le fund pool</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Créé le:</span>
                <span className="font-medium">{formatDate(fundPool.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dernière mise à jour:</span>
                <span className="font-medium">{formatDate(fundPool.updatedAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ID du fund pool:</span>
                <span className="font-medium text-xs">{fundPool.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions récentes</TabsTrigger>
          <TabsTrigger value="pending">Demandes en attente</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des transactions</CardTitle>
              <CardDescription>Les 10 dernières transactions effectuées sur le fund pool</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Liste des transactions récentes</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getTransactionTypeIcon(transaction.type)}
                            {getTransactionTypeLabel(transaction.type)}
                          </div>
                        </TableCell>
                        <TableCell
                          className={
                            transaction.type === "DEPOSIT" || transaction.type === "PAYMENT"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "DEPOSIT" || transaction.type === "PAYMENT" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                        <TableCell>{transaction.user ? transaction.user.name : "-"}</TableCell>
                        <TableCell>{getTransactionStatusBadge(transaction.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Aucune transaction récente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Voir toutes les transactions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de crédit en attente</CardTitle>
              <CardDescription>Liste des demandes de crédit en attente d'approbation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Liste des demandes en attente</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date de demande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCredits.length > 0 ? (
                    pendingCredits.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell>{format(new Date(credit.requestDate), "dd/MM/yyyy", { locale: fr })}</TableCell>
                        <TableCell>{credit.user.name}</TableCell>
                        <TableCell>{formatCurrency(credit.amount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a href={`/dashboard/admin/credits/${credit.id}`}>Détails</a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Aucune demande en attente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
