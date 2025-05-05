"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const formSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  password: z.string().min(1, {
    message: "Le mot de passe est requis.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Identifiants invalides. Veuillez réessayer.")
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la connexion.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vous n'avez pas de compte?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </form>
    </Form>
  )
}
