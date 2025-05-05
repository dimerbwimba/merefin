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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const formSchema = z.object({
  amount: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val.replace(/\s/g, "").replace(",", "."))
      return !isNaN(num) && num > 0
    },
    {
      message: "Le montant doit être un nombre positif",
    },
  ),
  purpose: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères",
  }),
  duration: z.string().refine(
    (val) => {
      const num = Number.parseInt(val)
      return !isNaN(num) && num > 0 && num <= 36
    },
    {
      message: "La durée doit être entre 1 et 36 mois",
    },
  ),
  expectedRepaymentDate: z.date({
    required_error: "Veuillez sélectionner une date de remboursement prévue",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface CreditRequestFormProps {
  userId: string
}

export function CreditRequestForm({ userId }: CreditRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      purpose: "",
      duration: "12",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      // Convertir le montant en nombre
      const amount = Number.parseFloat(values.amount.replace(/\s/g, "").replace(",", "."))

      const response = await fetch("/api/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          purpose: values.purpose,
          duration: Number.parseInt(values.duration),
          expectedRepaymentDate: values.expectedRepaymentDate,
        }),
      })

      const data = await response.json()

    
      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors de la demande de crédit.")
      }

      toast({
        title: "Demande envoyée",
        description: "Votre demande de crédit a été soumise avec succès et est en attente d'approbation.",
      })

      router.push("/dashboard/credits")
      router.refresh()
      
    } catch (error) {
      console.error("Credit request error:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la demande de crédit.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Demande de crédit</CardTitle>
        <CardDescription>
          Remplissez ce formulaire pour soumettre une demande de crédit. Votre demande sera examinée par un superviseur.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant demandé (USD)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 100 000" {...field} />
                  </FormControl>
                  <FormDescription>Entrez le montant que vous souhaitez emprunter.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objet du crédit</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez l'objet de votre demande de crédit..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Expliquez pourquoi vous avez besoin de ce crédit.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée (en mois)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une durée" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3">3 mois</SelectItem>
                        <SelectItem value="6">6 mois</SelectItem>
                        <SelectItem value="12">12 mois</SelectItem>
                        <SelectItem value="18">18 mois</SelectItem>
                        <SelectItem value="24">24 mois</SelectItem>
                        <SelectItem value="36">36 mois</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Durée souhaitée pour le remboursement.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedRepaymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de remboursement prévue</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(field.value, "dd MMMM yyyy", { locale: fr })
                            ) : (
                              <span>Sélectionnez une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Date à laquelle vous prévoyez de rembourser le crédit.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Soumission en cours..." : "Soumettre la demande"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
