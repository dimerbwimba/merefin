"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Users, CreditCard, Wallet, UserPlus, Settings, Activity } from "lucide-react"
import type { User } from "next-auth"

interface AdminSummary {
  totalUsers: number
  clientsCount: number
  supervisorsCount: number
  adminsCount: number
  totalCredits: number
  pendingCredits: number
  approvedCredits: number
  rejectedCredits: number
  totalCreditAmount: number
  totalRepaidAmount: number
  recentUsers: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }[]
  recentCredits: {
    id: string
    amount: number
    status: string
    clientName: string
    requestDate: string
  }[]
}

interface DashboardAdminProps {
  user: User
}

export function DashboardAdmin({ user }: DashboardAdminProps) {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/summary")
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données")
        }
        const data = await response.json()
        setSummary(data)
      } catch (error) {
        console.error("Erreur:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données du tableau de bord. Veuillez réessayer.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
        return "text-yellow-600"
      case "APPROUVE":
        return "text-green-600"
      case "REJETE":
        return "text-red-600"
      case "REMBOURSE":
        return "text-blue-600"
      default:
        return "text-gray-600"
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "CLIENT":
        return "Client"
      case "SUPERVISEUR":
        return "Superviseur"
      case "ADMINISTRATEUR":
        return "Administrateur"
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "CLIENT":
        return "text-blue-600"
      case "SUPERVISEUR":
        return "text-green-600"
      case "ADMINISTRATEUR":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bienvenue, {user.name}</h2>
          <p className="text-muted-foreground">Voici un aperçu de l'activité de votre plateforme de microfinance.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/admin/users/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalUsers || 0}</div>
            )}
            {!loading && summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {summary.clientsCount} clients, {summary.supervisorsCount} superviseurs, {summary.adminsCount} admins
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crédits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalCredits || 0}</div>
            )}
            {!loading && summary && (
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pendingCredits} en attente, {summary.approvedCredits} approuvés, {summary.rejectedCredits}{" "}
                rejetés
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total des crédits</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalCreditAmount || 0)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant remboursé</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalRepaidAmount || 0)}</div>
            )}
            {!loading && summary && summary.totalCreditAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((summary.totalRepaidAmount / summary.totalCreditAmount) * 100)}% du total
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Utilisateurs récents</CardTitle>
            <CardDescription>Les derniers utilisateurs inscrits sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : summary?.recentUsers && summary.recentUsers.length > 0 ? (
              <div className="space-y-4">
                {summary.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun utilisateur récent.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Gérer les utilisateurs
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Crédits récents</CardTitle>
            <CardDescription>Les dernières demandes de crédit</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : summary?.recentCredits && summary.recentCredits.length > 0 ? (
              <div className="space-y-4">
                {summary.recentCredits.map((credit) => (
                  <div key={credit.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{credit.clientName}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(credit.amount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getStatusColor(credit.status)}`}>
                        {getStatusLabel(credit.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(credit.requestDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun crédit récent.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/credits">
                <CreditCard className="h-4 w-4 mr-2" />
                Gérer les crédits
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Statistiques globales</CardTitle>
            <CardDescription>Aperçu des performances de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Les graphiques détaillés seront disponibles dans la prochaine mise à jour.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard/admin/analytics">Voir les statistiques détaillées</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
