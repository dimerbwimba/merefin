"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle, XCircle, Search, UserCircle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
}

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
  userId: string
  user: User
  payments: Payment[]
}

interface AdminCreditsListProps {
  credits: Credit[]
  clients: User[]
  currentFilters: {
    status?: string
    userId?: string
  }
}

export function AdminCreditsList({ credits, clients, currentFilters }: AdminCreditsListProps) {
  const [activeTab, setActiveTab] = useState(currentFilters.status || "all")
  const [selectedClient, setSelectedClient] = useState(currentFilters.userId || "")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const router = useRouter()

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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Mettre à jour l'URL avec le nouveau filtre
    const url = new URL(window.location.href)
    if (value === "all") {
      url.searchParams.delete("status")
    } else {
      url.searchParams.set("status", value)
    }
    window.history.pushState({}, "", url.toString())
  }

  const handleClientChange = (value: string) => {
    setSelectedClient(value)
    // Mettre à jour l'URL avec le nouveau filtre
    const url = new URL(window.location.href)
    if (value === "") {
      url.searchParams.delete("userId")
    } else {
      url.searchParams.set("userId", value)
    }
    window.history.pushState({}, "", url.toString())
  }

  const handleDeleteCredit = async (creditId: string) => {
    try {
      const response = await fetch(`/api/admin/credits/${creditId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erreur lors de la suppression du crédit")
      }

      toast({
        variant: "success",
        title: "Crédit supprimé",
        description: "Le crédit a été supprimé avec succès.",
      })

      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression du crédit.",
      })
    }
  }

  // Filtrer les crédits en fonction des filtres actifs
  const filteredCredits = credits.filter((credit) => {
    // Filtre par statut
    if (activeTab !== "all" && credit.status !== activeTab) {
      return false
    }

    // Filtre par client
    if (selectedClient && credit.userId !== selectedClient) {
      return false
    }

    // Filtre par recherche (ID de crédit ou nom de client)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        credit.id.toLowerCase().includes(searchLower) ||
        credit.user.name.toLowerCase().includes(searchLower) ||
        credit.user.email.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const calculateTotalPaid = (payments: Payment[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="EN_ATTENTE">En attente</TabsTrigger>
            <TabsTrigger value="APPROUVE">Approuvés</TabsTrigger>
            <TabsTrigger value="REJETE">Rejetés</TabsTrigger>
            <TabsTrigger value="REMBOURSE">Remboursés</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedClient} onValueChange={handleClientChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrer par client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredCredits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">Aucun crédit trouvé avec les filtres sélectionnés.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Montant</th>
                <th className="text-left py-3 px-4">Date de demande</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-left py-3 px-4">Progression</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.map((credit) => {
                const totalPaid = calculateTotalPaid(credit.payments)
                const progressPercentage = Math.round((totalPaid / credit.amount) * 100)

                return (
                  <tr key={credit.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-sm">{credit.id.substring(0, 8)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{credit.user.name}</span>
                        <span className="text-sm text-muted-foreground">{credit.user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(credit.amount)}
                    </td>
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
                          <span className="text-xs">{progressPercentage}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button asChild variant="ghost" size="icon" title="Voir les détails">
                          <Link href={`/dashboard/admin/credits/${credit.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        {credit.status === "EN_ATTENTE" && (
                          <>
                            <Button asChild variant="ghost" size="icon" className="text-green-600" title="Approuver">
                              <Link href={`/dashboard/admin/credits/${credit.id}/approve`}>
                                <CheckCircle className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="text-red-600" title="Rejeter">
                              <Link href={`/dashboard/admin/credits/${credit.id}/reject`}>
                                <XCircle className="h-4 w-4" />
                              </Link>
                            </Button>
                          </>
                        )}
                        <Button asChild variant="ghost" size="icon" title="Voir le profil client">
                          <Link href={`/dashboard/admin/users/${credit.userId}/edit`}>
                            <UserCircle className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500" title="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce crédit ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Toutes les données associées à ce crédit seront
                                supprimées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCredit(credit.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
