import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXTAUTH_URL))
  }

  return NextResponse.redirect(new URL("/api/auth/signout", process.env.NEXTAUTH_URL))
}
