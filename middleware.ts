import { getToken } from "next-auth/jwt"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Définir les chemins publics (accessibles sans authentification)
  const publicPaths = ["/", "/auth/login", "/auth/register"]
  const isPublicPath = publicPaths.includes(path)

  // Vérifier si l'utilisateur est authentifié
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié et tente d'accéder à une page protégée
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  // Rediriger vers le tableau de bord si l'utilisateur est déjà authentifié et tente d'accéder à une page publique
  if (token && isPublicPath && path !== "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

// Configurer les chemins sur lesquels le middleware doit s'exécuter
export const config = {
  matcher: ["/", "/auth/:path*", "/dashboard/:path*"],
}
