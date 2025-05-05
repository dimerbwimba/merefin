"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, CreditCard, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Client = {
  id: string
  name: string
  email: string
  createdAt: Date
  totalCredits: number
  activeCredits: number
  totalCreditAmount: number
}

interface ClientsListProps {
  clients: Client[]
}

export function ClientsList({ clients }: ClientsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrer les clients en fonction du terme de recherche
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return client.name.toLowerCase().includes(searchLower) || client.email.toLowerCase().includes(searchLower)
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour au tableau de bord
          </Link>
        </Button>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">Aucun client trouvé avec les critères de recherche.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Nom</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Date d'inscription</th>
                <th className="text-left py-3 px-4">Crédits</th>
                <th className="text-left py-3 px-4">Montant total</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{client.name}</td>
                  <td className="py-3 px-4">{client.email}</td>
                  <td className="py-3 px-4">{format(new Date(client.createdAt), "dd MMM yyyy", { locale: fr })}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span>{client.totalCredits} au total</span>
                      {client.activeCredits > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        >
                          {client.activeCredits} actif(s)
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{formatCurrency(client.totalCreditAmount)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="icon" title="Voir le profil">
                        <Link href={`/dashboard/supervisor/clients/${client.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" title="Voir les crédits">
                        <Link href={`/dashboard/supervisor/credits?userId=${client.id}`}>
                          <CreditCard className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
