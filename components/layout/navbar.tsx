"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Ne pas afficher la barre de navigation sur les pages d'authentification
  if (pathname.startsWith("/auth/")) {
    return null
  }

  return (
    <header className="border-b md:px-20 px-4">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            MicroFinance
          </Link>
          {session && (
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Tableau de bord
              </Link>
              {session.user?.role === "ADMINISTRATEUR" && (
                <Link
                  href="/dashboard/admin/fund-pool"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Fund Pool
                </Link>
              )}
              {/* Ajouter d'autres liens de navigation ici */}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm">
                <span className="text-muted-foreground mr-1">Connecté en tant que:</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="flex items-center gap-2">
              <Link href="/auth/login">
                <User className="h-4 w-4" />
                <span>Connexion</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
