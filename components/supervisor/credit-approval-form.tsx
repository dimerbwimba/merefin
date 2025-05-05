"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// --- Types ---
type User = {
  id: string
  name: string
  email: string
}

type Credit = {
  id: string
  amount: number
  status: string
  requestDate: Date
  user: User
  metadata?: {
    purpose?: string
    duration?: number
  } | null
}

interface CreditApprovalFormProps {
  credit: Credit
  action: "approve" | "reject"
}

// --- Schemas ---
const approveSchema = z.object({
  dueDate: z.date({
    required_error: "La date d'échéance est requise",
  }),
  interestRate: z
    .string()
    .refine(
      (val) => {
        const num = Number.parseFloat(val.replace(/\s/g, "").replace(",", "."))
        return !isNaN(num) && num >= 0 && num <= 100
      },
      {
        message: "Le taux d'intérêt doit être un nombre entre 0 et 100",
      },
    ),
  notes: z.string().optional(),
})

const rejectSchema = z.object({
  rejectionReason: z.string().min(10, {
    message: "Veuillez fournir une raison de rejet d'au moins 10 caractères",
  }),
})

type ApproveFormValues = z.infer<typeof approveSchema>
type RejectFormValues = z.infer<typeof rejectSchema>

export function CreditApprovalForm({ credit, action }: CreditApprovalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const formSchema = action === "approve" ? approveSchema : rejectSchema
  type FormValues = typeof formSchema extends z.ZodTypeAny ? z.infer<typeof formSchema> : never

  const defaultValues: Partial<FormValues> =
    action === "approve"
      ? {
          interestRate: "5",
          notes: "",
        }
      : {
          rejectionReason: "",
        }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as z.ZodType<FormValues>),
    defaultValues,
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const endpoint = `/api/credits/${credit.id}/${action}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data: { message?: string } = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Une erreur est survenue lors de l'${action === "approve" ? "approbation" : "rejet"} de la demande.`,
        )
      }

      toast({
        title: action === "approve" ? "Crédit approuvé" : "Crédit rejeté",
        description:
          action === "approve"
            ? "La demande de crédit a été approuvée avec succès."
            : "La demande de crédit a été rejetée.",
      })

      router.push("/dashboard/supervisor/credits")
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : `Une erreur est survenue lors de l'${action === "approve" ? "approbation" : "rejet"} de la demande.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {action === "approve" ? "Approuver la demande de crédit" : "Rejeter la demande de crédit"}
        </CardTitle>
        <CardDescription>
          {action === "approve"
            ? "Veuillez définir les conditions d'approbation du crédit."
            : "Veuillez fournir une raison pour le rejet de cette demande de crédit."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Client:</span>
                <span className="text-sm">{credit.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Montant demandé:</span>
                <span className="text-sm">{formatCurrency(credit.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Date de demande:</span>
                <span className="text-sm">
                  {format(new Date(credit.requestDate), "dd MMMM yyyy", { locale: fr })}
                </span>
              </div>
              {credit.metadata?.purpose && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Objet du crédit:</span>
                  <span className="text-sm">{credit.metadata.purpose}</span>
                </div>
              )}
              {credit.metadata?.duration && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Durée demandée:</span>
                  <span className="text-sm">{credit.metadata.duration} mois</span>
                </div>
              )}
            </div>

            {action === "approve" ? (
              <>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date d'échéance</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value
                                ? format(field.value, "dd MMMM yyyy", { locale: fr })
                                : "Sélectionnez une date"}
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
                      <FormDescription>Date à laquelle le crédit doit être entièrement remboursé.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux d'intérêt (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 5" {...field} />
                      </FormControl>
                      <FormDescription>Taux d'intérêt annuel appliqué au crédit.</FormDescription>
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
                          placeholder="Ajoutez des notes ou commentaires sur cette approbation..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif du rejet</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Veuillez expliquer pourquoi cette demande est rejetée..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Cette explication sera visible par le client.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} variant={action === "approve" ? "default" : "destructive"}>
              {isLoading
                ? action === "approve"
                  ? "Approbation en cours..."
                  : "Rejet en cours..."
                : action === "approve"
                  ? "Approuver le crédit"
                  : "Rejeter le crédit"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
