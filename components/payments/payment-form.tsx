"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PaymentFormProps {
  creditId: string
  remainingAmount: number
  creditAmount: number
}

export function PaymentForm({ creditId, remainingAmount, creditAmount }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const formSchema = z.object({
    amount: z.string().refine(
      (val) => {
        const num = Number.parseFloat(val.replace(/\s/g, "").replace(",", "."))
        return !isNaN(num) && num > 0 && num <= remainingAmount
      },
      {
        message: `Le montant doit être un nombre positif et ne pas dépasser ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(remainingAmount)}`,
      },
    ),
    paymentMethod: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT"], {
      required_error: "Veuillez sélectionner une méthode de paiement",
    }),
    notes: z.string().optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: remainingAmount.toString(),
      paymentMethod: "ESPECES",
      notes: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      // Convertir le montant en nombre
      const amount = Number.parseFloat(values.amount.replace(/\s/g, "").replace(",", "."))

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creditId,
          amount,
          paymentMethod: values.paymentMethod,
          notes: values.notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors du remboursement.")
      }

      setPaymentSuccess(true)

      toast({
        title: "Remboursement effectué",
        description: "Votre paiement a été enregistré avec succès.",
      })

      // Rediriger après un court délai pour montrer le message de succès
      setTimeout(() => {
        router.push(`/dashboard/credits/${creditId}`)
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du remboursement.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount)
  }

  const paidPercentage = ((creditAmount - remainingAmount) / creditAmount) * 100

  if (paymentSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold">Paiement réussi!</h2>
            <p>Votre remboursement a été enregistré avec succès.</p>
            <p>Vous allez être redirigé vers les détails du crédit...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Effectuer un remboursement</CardTitle>
        <CardDescription>
          Crédit total: {formatCurrency(creditAmount)} | Reste à payer: {formatCurrency(remainingAmount)}
        </CardDescription>
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Progression</span>
            <span>{Math.round(paidPercentage)}%</span>
          </div>
          <Progress value={paidPercentage} className="h-2" />
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant à payer (XOF)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 50 000" {...field} />
                  </FormControl>
                  <FormDescription>Entrez le montant que vous souhaitez rembourser.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Méthode de paiement</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="ESPECES">Espèces</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="VIREMENT">Virement bancaire</option>
                    </select>
                  </FormControl>
                  <FormDescription>Sélectionnez votre méthode de paiement préférée.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajoutez des informations supplémentaires sur ce paiement..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Veuillez conserver votre reçu de paiement. En cas de paiement par Mobile Money ou virement, le
                traitement peut prendre jusqu'à 24 heures.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Traitement en cours..." : "Effectuer le paiement"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
