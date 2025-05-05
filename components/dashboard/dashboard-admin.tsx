"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "next-auth"

interface DashboardAdminProps {
  user: User
}

export function DashboardAdmin({ user }: DashboardAdminProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue, {user.name}</CardTitle>
          <CardDescription>Tableau de bord administrateur</CardDescription>
        </CardHeader>
        <CardContent>
          <p>En tant qu'administrateur, vous pouvez:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Gérer tous les utilisateurs</li>
            <li>Configurer les paramètres du système</li>
            <li>Voir les statistiques globales</li>
            <li>Gérer les superviseurs</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>Gérer les utilisateurs du système</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Cette fonctionnalité sera disponible prochainement.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
          <CardDescription>Aperçu des statistiques du système</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Aucune donnée disponible pour le moment.</p>
        </CardContent>
      </Card>
    </div>
  )
}
