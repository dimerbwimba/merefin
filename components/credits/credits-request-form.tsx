"use client"

import { useState, useEffect } from "react"
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
import { CalendarIcon, InfoIcon, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

const formSchema = z.object({
  // Informations personnelles
  dateOfBirth: z
    .date({
      required_error: "Veuillez sélectionner votre date de naissance",
    })
    .refine(
      (date) => {
        const today = new Date()
        const birthDate = new Date(date)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        return age >= 18
      },
      { message: "Vous devez avoir au moins 18 ans pour demander un crédit" },
    ),

  idType: z.string({
    required_error: "Veuillez sélectionner un type de pièce d'identité",
  }),
  idNumber: z.string().min(1, "Veuillez entrer le numéro de votre pièce d'identité"),

  // Justificatif de domicile
  addressProofType: z.string({
    required_error: "Veuillez sélectionner un type de justificatif de domicile",
  }),
  address: z.string().min(10, "Veuillez entrer votre adresse complète"),

  // Activité génératrice de revenus
  activityType: z.string({
    required_error: "Veuillez sélectionner votre type d'activité",
  }),
  activityDuration: z.string({
    required_error: "Veuillez indiquer depuis combien de temps vous exercez cette activité",
  }),
  monthlyIncome: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val.replace(/\s/g, "").replace(",", "."))
      return !isNaN(num) && num > 0
    },
    {
      message: "Le revenu mensuel doit être un nombre positif",
    },
  ),

  // Capacité de remboursement
  monthlyExpenses: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val.replace(/\s/g, "").replace(",", "."))
      return !isNaN(num) && num > 0
    },
    {
      message: "Les dépenses mensuelles doivent être un nombre positif",
    },
  ),

  // Garantie
  guaranteeType: z.string({
    required_error: "Veuillez sélectionner un type de garantie",
  }),
  guaranteeDescription: z.string().min(10, "Veuillez décrire votre garantie"),

  // Crédit
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

  // Déclarations
  noDebt: z.boolean().refine((value) => value === true, {
    message: "Vous devez confirmer que vous n'êtes pas en situation de surendettement",
  }),
  acceptFees: z.boolean().refine((value) => value === true, {
    message: "Vous devez accepter les frais de dossier",
  }),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: "Vous devez accepter les conditions générales",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface CreditRequestFormProps {
  userId: string
}

export function CreditRequestForm({ userId }: CreditRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("personal")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formProgress, setFormProgress] = useState(25)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      purpose: "",
      duration: "12",
      monthlyIncome: "",
      monthlyExpenses: "",
      guaranteeDescription: "",
      address: "",
      idNumber: "",
      noDebt: false,
      acceptFees: false,
      termsAccepted: false,
    },
    mode: "onChange",
  })

  // Mettre à jour la progression du formulaire en fonction des champs remplis
  useEffect(() => {
    const formValues = form.getValues()
    const personalFields = ["dateOfBirth", "idType", "idNumber", "addressProofType", "address"]
    const activityFields = ["activityType", "activityDuration", "monthlyIncome", "monthlyExpenses"]
    const creditFields = [
      "guaranteeType",
      "guaranteeDescription",
      "amount",
      "purpose",
      "duration",
      "expectedRepaymentDate",
    ]
    const termsFields = ["noDebt", "acceptFees", "termsAccepted"]

    const allFields = [...personalFields, ...activityFields, ...creditFields, ...termsFields]
    const filledFields = allFields.filter((field) => {
      const value = formValues[field as keyof FormValues]
      return value !== undefined && value !== "" && value !== false
    })

    const progress = Math.round((filledFields.length / allFields.length) * 100)
    setFormProgress(progress)
  }, [form.watch()])

  // Gérer le changement d'onglet
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab)

    // Mettre à jour la progression en fonction de l'onglet actif
    switch (tab) {
      case "personal":
        setFormProgress(Math.max(formProgress, 25))
        break
      case "activity":
        setFormProgress(Math.max(formProgress, 50))
        break
      case "credit":
        setFormProgress(Math.max(formProgress, 75))
        break
      case "terms":
        setFormProgress(Math.max(formProgress, 90))
        break
      case "review":
        setFormProgress(100)
        break
    }
  }

  // Vérifier si l'onglet actuel est valide avant de passer au suivant
  const validateCurrentTab = () => {
    const formValues = form.getValues()

    if (currentTab === "personal") {
      const personalFields = ["dateOfBirth", "idType", "idNumber", "addressProofType", "address"]
      for (const field of personalFields) {
        if (!formValues[field as keyof FormValues]) {
          form.setError(field as any, {
            type: "manual",
            message: "Ce champ est requis",
          })
          return false
        }
      }
      return true
    }

    if (currentTab === "activity") {
      const activityFields = ["activityType", "activityDuration", "monthlyIncome", "monthlyExpenses"]
      for (const field of activityFields) {
        if (!formValues[field as keyof FormValues]) {
          form.setError(field as any, {
            type: "manual",
            message: "Ce champ est requis",
          })
          return false
        }
      }
      return true
    }

    if (currentTab === "credit") {
      const creditFields = [
        "guaranteeType",
        "guaranteeDescription",
        "amount",
        "purpose",
        "duration",
        "expectedRepaymentDate",
      ]
      for (const field of creditFields) {
        if (!formValues[field as keyof FormValues]) {
          form.setError(field as any, {
            type: "manual",
            message: "Ce champ est requis",
          })
          return false
        }
      }
      return true
    }

    if (currentTab === "terms") {
      const termsFields = ["noDebt", "acceptFees", "termsAccepted"]
      for (const field of termsFields) {
        if (!formValues[field as keyof FormValues]) {
          form.setError(field as any, {
            type: "manual",
            message: "Ce champ est requis",
          })
          return false
        }
      }
      return true
    }

    return true
  }

  // Naviguer vers l'onglet suivant
  const goToNextTab = () => {
    if (!validateCurrentTab()) return

    if (currentTab === "personal") handleTabChange("activity")
    else if (currentTab === "activity") handleTabChange("credit")
    else if (currentTab === "credit") handleTabChange("terms")
    else if (currentTab === "terms") handleTabChange("review")
  }

  // Naviguer vers l'onglet précédent
  const goToPreviousTab = () => {
    if (currentTab === "activity") handleTabChange("personal")
    else if (currentTab === "credit") handleTabChange("activity")
    else if (currentTab === "terms") handleTabChange("credit")
    else if (currentTab === "review") handleTabChange("terms")
  }

  // Ouvrir la boîte de dialogue de confirmation
  const openConfirmationDialog = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      setShowConfirmation(true)
    }
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      // Convertir le montant en nombre
      const amount = Number.parseFloat(values.amount.replace(/\s/g, "").replace(",", "."))
      const monthlyIncome = Number.parseFloat(values.monthlyIncome.replace(/\s/g, "").replace(",", "."))
      const monthlyExpenses = Number.parseFloat(values.monthlyExpenses.replace(/\s/g, "").replace(",", "."))

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
          metadata: {
            // Informations personnelles
            dateOfBirth: values.dateOfBirth,
            idType: values.idType,
            idNumber: values.idNumber,

            // Justificatif de domicile
            addressProofType: values.addressProofType,
            address: values.address,

            // Activité génératrice de revenus
            activityType: values.activityType,
            activityDuration: values.activityDuration,
            monthlyIncome,

            // Capacité de remboursement
            monthlyExpenses,

            // Garantie
            guaranteeType: values.guaranteeType,
            guaranteeDescription: values.guaranteeDescription,

            // Déclarations
            noDebt: values.noDebt,
            acceptFees: values.acceptFees,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors de la demande de crédit.")
      }

      toast({
        title: "Demande envoyée",
        description: "Votre demande de crédit a été soumise avec succès et est en attente d'approbation.",
        variant: "success",
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
      setShowConfirmation(false)
    }
  }

  // Fonctions utilitaires pour obtenir les noms lisibles
  const getIdTypeName = (type: string): string => {
    const types: Record<string, string> = {
      cni: "Carte Nationale d'Identité",
      passport: "Passeport",
      permis: "Permis de conduire",
      electeur: "Carte d'électeur",
    }
    return types[type] || type
  }

  const getAddressProofTypeName = (type: string): string => {
    const types: Record<string, string> = {
      facture_eau: "Facture d'eau",
      facture_electricite: "Facture d'électricité",
      attestation: "Attestation de résidence",
      contrat_bail: "Contrat de bail",
      autre: "Autre",
    }
    return types[type] || type
  }

  const getActivityTypeName = (type: string): string => {
    const types: Record<string, string> = {
      commerce: "Commerce",
      agriculture: "Agriculture",
      artisanat: "Artisanat",
      service: "Prestation de services",
      salarie: "Salarié",
      autre: "Autre",
    }
    return types[type] || type
  }

  const getActivityDurationName = (duration: string): string => {
    const durations: Record<string, string> = {
      moins_6mois: "Moins de 6 mois",
      "6mois_1an": "Entre 6 mois et 1 an",
      "1an_3ans": "Entre 1 et 3 ans",
      plus_3ans: "Plus de 3 ans",
    }
    return durations[duration] || duration
  }

  const getGuaranteeTypeName = (type: string): string => {
    const types: Record<string, string> = {
      bien_materiel: "Bien matériel",
      caution_solidaire: "Caution solidaire",
      epargne: "Épargne bloquée",
      autre_garantie: "Autre",
    }
    return types[type] || type
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Demande de crédit</CardTitle>
          <CardDescription>
            Remplissez ce formulaire pour soumettre une demande de crédit. Votre demande sera examinée par un
            superviseur.
          </CardDescription>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progression du formulaire</span>
              <span>{formProgress}%</span>
            </div>
            <Progress value={formProgress} className="h-2" />
          </div>
        </CardHeader>

        <Alert className="mx-6 mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Informations importantes</AlertTitle>
          <AlertDescription>
            Pour que votre demande soit traitée rapidement, assurez-vous de fournir des informations exactes et
            complètes. Tous les champs marqués d'un astérisque (*) sont obligatoires.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(openConfirmationDialog)}>
            <Tabs value={currentTab} onValueChange={handleTabChange} className="mx-6">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="personal">1. Identité</TabsTrigger>
                <TabsTrigger value="activity">2. Activité</TabsTrigger>
                <TabsTrigger value="credit">3. Crédit</TabsTrigger>
                <TabsTrigger value="terms">4. Déclarations</TabsTrigger>
                <TabsTrigger value="review">5. Vérification</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">1. Identification</h3>

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de naissance*</FormLabel>
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
                                    <span>Sélectionnez votre date de naissance</span>
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
                                disabled={(date) => date > new Date()}
                                initialFocus
                                captionLayout="dropdown-buttons"
                                fromYear={1940}
                                toYear={2006}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>Vous devez avoir au moins 18 ans pour demander un crédit.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="idType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de pièce d'identité*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un type de pièce d'identité" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cni">Carte Nationale d'Identité</SelectItem>
                                <SelectItem value="passport">Passeport</SelectItem>
                                <SelectItem value="permis">Permis de conduire</SelectItem>
                                <SelectItem value="electeur">Carte d'électeur</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>Pièce d'identité valide requise.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de pièce d'identité*</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 123456789" {...field} />
                            </FormControl>
                            <FormDescription>Entrez le numéro de votre pièce d'identité.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">2. Justificatif de domicile</h3>

                    <FormField
                      control={form.control}
                      name="addressProofType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de justificatif de domicile*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un type de justificatif" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="facture_eau">Facture d'eau</SelectItem>
                              <SelectItem value="facture_electricite">Facture d'électricité</SelectItem>
                              <SelectItem value="attestation">Attestation de résidence</SelectItem>
                              <SelectItem value="contrat_bail">Contrat de bail</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Document prouvant votre lieu de résidence.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse complète*</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Entrez votre adresse complète..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Votre adresse actuelle de résidence.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="button" onClick={goToNextTab}>
                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">3. Activité génératrice de revenus</h3>

                    <FormField
                      control={form.control}
                      name="activityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type d'activité*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez votre type d'activité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="commerce">Commerce</SelectItem>
                              <SelectItem value="agriculture">Agriculture</SelectItem>
                              <SelectItem value="artisanat">Artisanat</SelectItem>
                              <SelectItem value="service">Prestation de services</SelectItem>
                              <SelectItem value="salarie">Salarié</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Votre principale source de revenus.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activityDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ancienneté de l'activité*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Depuis combien de temps exercez-vous cette activité?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="moins_6mois">Moins de 6 mois</SelectItem>
                              <SelectItem value="6mois_1an">Entre 6 mois et 1 an</SelectItem>
                              <SelectItem value="1an_3ans">Entre 1 et 3 ans</SelectItem>
                              <SelectItem value="plus_3ans">Plus de 3 ans</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Une activité stable d'au moins 6 mois est généralement requise.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revenu mensuel (USD)*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 150 000" {...field} />
                          </FormControl>
                          <FormDescription>Estimation de vos revenus mensuels moyens.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">4. Capacité de remboursement</h3>

                    <FormField
                      control={form.control}
                      name="monthlyExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dépenses mensuelles (USD)*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 80 000" {...field} />
                          </FormControl>
                          <FormDescription>Estimation de vos dépenses mensuelles moyennes.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm font-medium mb-2">Capacité de remboursement estimée:</p>
                      <p className="text-sm">
                        {form.watch("monthlyIncome") && form.watch("monthlyExpenses") ? (
                          <>
                            {(() => {
                              try {
                                const income = Number.parseFloat(
                                  form.watch("monthlyIncome").replace(/\s/g, "").replace(",", "."),
                                )
                                const expenses = Number.parseFloat(
                                  form.watch("monthlyExpenses").replace(/\s/g, "").replace(",", "."),
                                )
                                if (!isNaN(income) && !isNaN(expenses)) {
                                  const capacity = income - expenses
                                  return `${capacity.toLocaleString("fr-FR")} USD par mois`
                                }
                                return "Calcul impossible"
                              } catch (e) {
                                return "Calcul impossible"
                              }
                            })()}
                          </>
                        ) : (
                          "Veuillez remplir les champs de revenus et dépenses"
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </TabsContent>

              <TabsContent value="credit" className="space-y-6">
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">5. Garantie ou caution</h3>

                    <FormField
                      control={form.control}
                      name="guaranteeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de garantie*</FormLabel>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bien_materiel" id="bien_materiel" />
                                <label
                                  htmlFor="bien_materiel"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Bien matériel (moto, téléphone, marchandises, etc.)
                                </label>
                              </div>
                            </FormControl>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="caution_solidaire" id="caution_solidaire" />
                                <label
                                  htmlFor="caution_solidaire"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Caution solidaire (membre de la famille, groupe)
                                </label>
                              </div>
                            </FormControl>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="epargne" id="epargne" />
                                <label
                                  htmlFor="epargne"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Épargne bloquée
                                </label>
                              </div>
                            </FormControl>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="autre_garantie" id="autre_garantie" />
                                <label
                                  htmlFor="autre_garantie"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Autre
                                </label>
                              </div>
                            </FormControl>
                          </RadioGroup>
                          <FormDescription>Une garantie est nécessaire pour sécuriser le crédit.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guaranteeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description de la garantie*</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez en détail la garantie que vous proposez..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Précisez la nature, la valeur et les caractéristiques de votre garantie. Si c'est une
                            caution solidaire, indiquez les coordonnées du garant.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informations sur le crédit</h3>

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant demandé (USD)*</FormLabel>
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
                          <FormLabel>Objet du crédit*</FormLabel>
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
                            <FormLabel>Durée (en mois)*</FormLabel>
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
                            <FormLabel>Date de remboursement prévue*</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}
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
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </TabsContent>

              <TabsContent value="terms" className="space-y-6">
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">6. Dossier de crédit</h3>

                    <FormField
                      control={form.control}
                      name="noDebt"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Je déclare ne pas être en situation de surendettement*</FormLabel>
                            <FormDescription>
                              Je confirme que je n'ai pas d'autres crédits en cours qui pourraient compromettre ma
                              capacité de remboursement.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="acceptFees"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>J'accepte de payer les frais de dossier*</FormLabel>
                            <FormDescription>
                              Je comprends que des frais de dossier de 2% du montant du crédit seront appliqués.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">7. Conditions générales</h3>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="terms">
                        <AccordionTrigger>Conditions générales d'octroi de crédit</AccordionTrigger>
                        <AccordionContent>
                          <div className="text-sm space-y-2">
                            <p>
                              1. <strong>Éligibilité</strong> : Pour être éligible à un crédit, vous devez être âgé d'au
                              moins 18 ans, avoir une pièce d'identité valide, un justificatif de domicile et une
                              activité génératrice de revenus stable.
                            </p>
                            <p>
                              2. <strong>Garantie</strong> : Une garantie est exigée pour tout crédit accordé. Cette
                              garantie peut être un bien matériel, une caution solidaire ou une épargne bloquée.
                            </p>
                            <p>
                              3. <strong>Taux d'intérêt</strong> : Le taux d'intérêt applicable est de 12% par an,
                              calculé sur le capital restant dû.
                            </p>
                            <p>
                              4. <strong>Frais de dossier</strong> : Des frais de dossier de 2% du montant du crédit
                              sont appliqués et payables à l'approbation du crédit.
                            </p>
                            <p>
                              5. <strong>Remboursement</strong> : Les remboursements s'effectuent selon l'échéancier
                              établi. Tout retard de paiement entraîne des pénalités.
                            </p>
                            <p>
                              6. <strong>Pénalités de retard</strong> : En cas de retard de paiement, une pénalité de 1%
                              par mois de retard sera appliquée sur le montant impayé.
                            </p>
                            <p>
                              7. <strong>Résiliation</strong> : En cas de non-paiement pendant trois mois consécutifs,
                              l'institution se réserve le droit de saisir la garantie et d'entamer des procédures de
                              recouvrement.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>J'accepte les conditions générales*</FormLabel>
                            <FormDescription>
                              Je déclare avoir lu et accepté les conditions générales d'octroi de crédit.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Vérifier ma demande <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <CardContent className="space-y-6 pt-0">
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-400">Vérification finale</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-500">
                      Veuillez vérifier attentivement toutes les informations avant de soumettre votre demande. Une fois
                      soumise, vous ne pourrez plus la modifier.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Récapitulatif de votre demande</h3>

                      <div className="space-y-4">
                        <div className="bg-muted rounded-md p-4">
                          <h4 className="font-medium mb-2">Informations personnelles</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Date de naissance:</span>{" "}
                              {form.getValues("dateOfBirth")
                                ? format(form.getValues("dateOfBirth"), "dd MMMM yyyy", { locale: fr })
                                : "Non spécifiée"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pièce d'identité:</span>{" "}
                              {form.getValues("idType") ? getIdTypeName(form.getValues("idType")) : "Non spécifiée"} -{" "}
                              {form.getValues("idNumber") || "N/A"}
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Adresse:</span>{" "}
                              {form.getValues("address") || "Non spécifiée"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Justificatif de domicile:</span>{" "}
                              {form.getValues("addressProofType")
                                ? getAddressProofTypeName(form.getValues("addressProofType"))
                                : "Non spécifié"}
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted rounded-md p-4">
                          <h4 className="font-medium mb-2">Activité et revenus</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Type d'activité:</span>{" "}
                              {form.getValues("activityType")
                                ? getActivityTypeName(form.getValues("activityType"))
                                : "Non spécifié"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ancienneté:</span>{" "}
                              {form.getValues("activityDuration")
                                ? getActivityDurationName(form.getValues("activityDuration"))
                                : "Non spécifiée"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Revenu mensuel:</span>{" "}
                              {form.getValues("monthlyIncome")
                                ? Number.parseFloat(
                                    form.getValues("monthlyIncome").replace(/\s/g, "").replace(",", "."),
                                  ).toLocaleString("fr-FR") + " USD"
                                : "Non spécifié"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Dépenses mensuelles:</span>{" "}
                              {form.getValues("monthlyExpenses")
                                ? Number.parseFloat(
                                    form.getValues("monthlyExpenses").replace(/\s/g, "").replace(",", "."),
                                  ).toLocaleString("fr-FR") + " USD"
                                : "Non spécifié"}
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted rounded-md p-4">
                          <h4 className="font-medium mb-2">Crédit et garantie</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Montant demandé:</span>{" "}
                              {form.getValues("amount")
                                ? Number.parseFloat(
                                    form.getValues("amount").replace(/\s/g, "").replace(",", "."),
                                  ).toLocaleString("fr-FR") + " USD"
                                : "Non spécifié"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Durée:</span>{" "}
                              {form.getValues("duration") ? form.getValues("duration") + " mois" : "Non spécifiée"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date de remboursement prévue:</span>{" "}
                              {form.getValues("expectedRepaymentDate")
                                ? format(form.getValues("expectedRepaymentDate"), "dd MMMM yyyy", { locale: fr })
                                : "Non spécifiée"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type de garantie:</span>{" "}
                              {form.getValues("guaranteeType")
                                ? getGuaranteeTypeName(form.getValues("guaranteeType"))
                                : "Non spécifié"}
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Description de la garantie:</span>{" "}
                              {form.getValues("guaranteeDescription") || "Non spécifiée"}
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted rounded-md p-4">
                          <h4 className="font-medium mb-2">Objet du crédit</h4>
                          <p className="text-sm">{form.getValues("purpose") || "Non spécifié"}</p>
                        </div>

                        <div className="bg-muted rounded-md p-4">
                          <h4 className="font-medium mb-2">Déclarations</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li
                              className={
                                form.getValues("noDebt")
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {form.getValues("noDebt")
                                ? "Vous avez déclaré ne pas être en situation de surendettement"
                                : "Vous n'avez pas confirmé ne pas être en situation de surendettement"}
                            </li>
                            <li
                              className={
                                form.getValues("acceptFees")
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {form.getValues("acceptFees")
                                ? "Vous avez accepté de payer les frais de dossier"
                                : "Vous n'avez pas accepté de payer les frais de dossier"}
                            </li>
                            <li
                              className={
                                form.getValues("termsAccepted")
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {form.getValues("termsAccepted")
                                ? "Vous avez accepté les conditions générales"
                                : "Vous n'avez pas accepté les conditions générales"}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Modifier
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Soumission en cours..." : "Confirmer et soumettre"}
                  </Button>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </Card>

      {/* Boîte de dialogue de confirmation finale */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmation de la demande</DialogTitle>
            <DialogDescription>
              Veuillez confirmer que toutes les informations fournies sont exactes et complètes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert
              variant="default"
              className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">Important</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-500">
                En soumettant cette demande, vous certifiez que toutes les informations fournies sont exactes. Toute
                fausse déclaration peut entraîner le rejet de votre demande.
              </AlertDescription>
            </Alert>
            <div className="text-sm space-y-2">
              <p>
                <strong>Montant demandé:</strong>{" "}
                {form.getValues("amount")
                  ? Number.parseFloat(form.getValues("amount").replace(/\s/g, "").replace(",", ".")).toLocaleString(
                      "fr-FR",
                    ) + " USD"
                  : "Non spécifié"}
              </p>
              <p>
                <strong>Durée:</strong>{" "}
                {form.getValues("duration") ? form.getValues("duration") + " mois" : "Non spécifiée"}
              </p>
              <p>
                <strong>Garantie:</strong>{" "}
                {form.getValues("guaranteeType")
                  ? getGuaranteeTypeName(form.getValues("guaranteeType"))
                  : "Non spécifiée"}
              </p>
              <Separator className="my-2" />
              <p>
                <strong>Frais de dossier (2%):</strong>{" "}
                {form.getValues("amount")
                  ? (
                      Number.parseFloat(form.getValues("amount").replace(/\s/g, "").replace(",", ".")) * 0.02
                    ).toLocaleString("fr-FR") + " USD"
                  : "Non calculable"}
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setShowConfirmation(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? "Soumission en cours..." : "Je confirme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
