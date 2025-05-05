import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-4xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Bienvenue sur votre Plateforme de Microfinance
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Gérez efficacement l'octroi et le remboursement des crédits
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild size="lg" className="text-lg">
            <Link href="/auth/login">Connexion</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg">
            <Link href="/auth/register">Inscription</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
