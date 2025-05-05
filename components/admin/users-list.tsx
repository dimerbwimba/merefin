"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, UserPlus, Edit, Trash2, CreditCard } from "lucide-react"
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
  role: string
  createdAt: Date
  creditsCount: number
}

interface UsersListProps {
  users: User[]
}

export function UsersList({ users }: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const { toast } = useToast()
  const router = useRouter()

  // Filtrer les utilisateurs en fonction des critères
  const filteredUsers = users.filter((user) => {
    // Filtre par terme de recherche
    if (
      searchTerm &&
      !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    // Filtre par rôle
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false
    }

    return true
  })

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "CLIENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "SUPERVISEUR":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "ADMINISTRATEUR":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erreur lors de la suppression de l'utilisateur")
      }

      toast({
        variant: "success",
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      })

      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression de l'utilisateur.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour au tableau de bord
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/admin/users/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="CLIENT">Clients</SelectItem>
            <SelectItem value="SUPERVISEUR">Superviseurs</SelectItem>
            <SelectItem value="ADMINISTRATEUR">Administrateurs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">Aucun utilisateur trouvé avec les critères de recherche.</p>
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
                <th className="text-left py-3 px-4">Rôle</th>
                <th className="text-left py-3 px-4">Date d'inscription</th>
                <th className="text-left py-3 px-4">Crédits</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge className={getRoleBadgeColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                  </td>
                  <td className="py-3 px-4">{format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}</td>
                  <td className="py-3 px-4">{user.creditsCount}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="icon" title="Modifier">
                        <Link href={`/dashboard/admin/users/${user.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      {user.role === "CLIENT" && (
                        <Button asChild variant="ghost" size="icon" title="Voir les crédits">
                          <Link href={`/dashboard/admin/credits?userId=${user.id}`}>
                            <CreditCard className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500" title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Toutes les données associées à cet utilisateur seront
                              supprimées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
