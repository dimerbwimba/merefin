import type React from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  User,
  Home,
  Briefcase,
  Shield,
  Calendar,
} from "lucide-react"
import Link from "next/link"

async function getCreditDetails(id: string) {
  const credit = await db.credit.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        orderBy: {
          date: "desc",
        },
      },
    },
  })

  return credit
}

export default async function CreditDetailsPage({ params }: { params: Promise<{ id: string }>}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "SUPERVISEUR") {
    return notFound()
  }

  const {id} = await params
  // Vérifier si l'utilisateur a accès à la page

  const credit = await getCreditDetails(id)

  if (!credit) {
    return notFound()
  }

  // Calculer le montant total remboursé
  const totalRepaid = credit.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const repaymentPercentage = (totalRepaid / credit.amount) * 100

  // Formater les statuts
  const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    EN_ATTENTE: {
      label: "En attente",
      color: "bg-yellow-500",
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
    },
    APPROUVE: {
      label: "Approuvé",
      color: "bg-green-500",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    },
    REJETE: {
      label: "Rejeté",
      color: "bg-red-500",
      icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
    REMBOURSE: {
      label: "Remboursé",
      color: "bg-blue-500",
      icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
    },
  }

  const status = statusMap[credit.status] || {
    label: credit.status,
    color: "bg-gray-500",
    icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
  }

  // Extraire les métadonnées
  const metadata = (credit.metadata as any) || {}

  return (
    <div className="container mx-auto py-6 md:px-20 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/supervisor/credits">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Détails de la demande de crédit</h1>
        </div>
        <div className="flex items-center space-x-2">
          {credit.status === "EN_ATTENTE" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/supervisor/credits/${credit.id}/reject`}>Rejeter</Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/supervisor/credits/${credit.id}/approve`}>Approuver</Link>
              </Button>
            </>
          )}
          {credit.status === "APPROUVE" && (
            <Button asChild>
              <Link href={`/dashboard/supervisor/credits/${credit.id}/payment`}>Enregistrer un paiement</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Demande #{credit.id.substring(0, 8)}</CardTitle>
                <CardDescription>
                  Créée le {format(new Date(credit.requestDate), "dd MMMM yyyy", { locale: fr })}
                </CardDescription>
              </div>
              <Badge className={`${status.color} text-white`}>{status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Détails du crédit</TabsTrigger>
                <TabsTrigger value="client">Informations client</TabsTrigger>
                <TabsTrigger value="documents">Documents requis</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Montant</h3>
                    <p className="text-lg font-semibold">{credit.amount.toLocaleString("fr-FR")} USD</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Durée</h3>
                    <p className="text-lg font-semibold">{metadata.duration || "N/A"} mois</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Date de demande</h3>
                    <p className="text-lg font-semibold">
                      {format(new Date(credit.requestDate), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Date d'échéance</h3>
                    <p className="text-lg font-semibold">
                      {credit.dueDate
                        ? format(new Date(credit.dueDate), "dd MMMM yyyy", { locale: fr })
                        : "Non définie"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Objet du crédit</h3>
                  <p className="text-sm border rounded-md p-3 bg-muted">{metadata.purpose || "Non spécifié"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Garantie</h3>
                  <div className="border rounded-md p-3 space-y-2">
                    <p className="text-sm font-medium">
                      Type: {metadata.guaranteeType ? getGuaranteeTypeName(metadata.guaranteeType) : "Non spécifié"}
                    </p>
                    <p className="text-sm">{metadata.guaranteeDescription || "Aucune description fournie"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Progression du remboursement</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total remboursé: {totalRepaid.toLocaleString("fr-FR")} USD</span>
                      <span>{repaymentPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={repaymentPercentage} className="h-2" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="client" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Informations personnelles</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Nom</h3>
                        <p className="text-sm font-semibold">{credit.user.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                        <p className="text-sm font-semibold">{credit.user.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Date de naissance</h3>
                        <p className="text-sm font-semibold">
                          {metadata.dateOfBirth
                            ? format(new Date(metadata.dateOfBirth), "dd MMMM yyyy", { locale: fr })
                            : "Non spécifiée"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Pièce d'identité</h3>
                        <p className="text-sm font-semibold">
                          {metadata.idType ? getIdTypeName(metadata.idType) : "Non spécifiée"} -{" "}
                          {metadata.idNumber || "N/A"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Domicile</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
                        <p className="text-sm font-semibold">{metadata.address || "Non spécifiée"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Justificatif</h3>
                        <p className="text-sm font-semibold">
                          {metadata.addressProofType
                            ? getAddressProofTypeName(metadata.addressProofType)
                            : "Non spécifié"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Activité et revenus</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Type d'activité</h3>
                        <p className="text-sm font-semibold">
                          {metadata.activityType ? getActivityTypeName(metadata.activityType) : "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Ancienneté</h3>
                        <p className="text-sm font-semibold">
                          {metadata.activityDuration
                            ? getActivityDurationName(metadata.activityDuration)
                            : "Non spécifiée"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Revenu mensuel</h3>
                        <p className="text-sm font-semibold">
                          {metadata.monthlyIncome
                            ? `${metadata.monthlyIncome.toLocaleString("fr-FR")} USD`
                            : "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Dépenses mensuelles</h3>
                        <p className="text-sm font-semibold">
                          {metadata.monthlyExpenses
                            ? `${metadata.monthlyExpenses.toLocaleString("fr-FR")} USD`
                            : "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Capacité de remboursement</h3>
                        <p className="text-sm font-semibold">
                          {metadata.monthlyIncome && metadata.monthlyExpenses
                            ? `${(metadata.monthlyIncome - metadata.monthlyExpenses).toLocaleString("fr-FR")} USD`
                            : "Non calculable"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Déclarations</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Situation d'endettement</h3>
                        <p className="text-sm font-semibold">
                          {metadata.noDebt === true
                            ? "Déclare ne pas être en situation de surendettement"
                            : "Non déclaré"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Frais de dossier</h3>
                        <p className="text-sm font-semibold">
                          {metadata.acceptFees === true ? "Accepte de payer les frais de dossier" : "Non accepté"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">Documents requis pour l'approbation</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Pièce d'identité: {metadata.idType ? getIdTypeName(metadata.idType) : "Non fournie"}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>
                        Justificatif de domicile:{" "}
                        {metadata.addressProofType ? getAddressProofTypeName(metadata.addressProofType) : "Non fourni"}
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span>Preuve de revenus: À vérifier lors de la visite</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span>
                        Garantie:{" "}
                        {metadata.guaranteeType ? getGuaranteeTypeName(metadata.guaranteeType) : "Non fournie"} - À
                        vérifier
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Actions recommandées avant approbation</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Planifier une visite pour vérifier l'activité génératrice de revenus</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Vérifier la garantie proposée: {metadata.guaranteeDescription || "Non spécifiée"}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Vérifier l'historique de crédit du client</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>{credit.payments.length} paiement(s) enregistré(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {credit.payments.length > 0 ? (
                <ul className="space-y-4">
                  {credit.payments.map((payment) => (
                    <li key={payment.id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{payment.amount.toLocaleString("fr-FR")} USD</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.date), "dd MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <Badge variant="outline">Reçu #{payment.id.substring(0, 6)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Aucun paiement enregistré</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="actions">
              <AccordionTrigger>Actions disponibles</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {credit.status === "EN_ATTENTE" && (
                    <>
                      <Button className="w-full" asChild>
                        <Link href={`/dashboard/supervisor/credits/${credit.id}/approve`}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver la demande
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/dashboard/supervisor/credits/${credit.id}/reject`}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter la demande
                        </Link>
                      </Button>
                    </>
                  )}
                  {credit.status === "APPROUVE" && (
                    <Button className="w-full" asChild>
                      <Link href={`/dashboard/supervisor/credits/${credit.id}/payment`}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Enregistrer un paiement
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/supervisor/clients/${credit.userId}`}>
                      <User className="h-4 w-4 mr-2" />
                      Voir le profil client
                    </Link>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}

// Fonctions utilitaires pour obtenir les noms lisibles
function getIdTypeName(type: string): string {
  const types: Record<string, string> = {
    cni: "Carte Nationale d'Identité",
    passport: "Passeport",
    permis: "Permis de conduire",
    electeur: "Carte d'électeur",
  }
  return types[type] || type
}

function getAddressProofTypeName(type: string): string {
  const types: Record<string, string> = {
    facture_eau: "Facture d'eau",
    facture_electricite: "Facture d'électricité",
    attestation: "Attestation de résidence",
    contrat_bail: "Contrat de bail",
    autre: "Autre",
  }
  return types[type] || type
}

function getActivityTypeName(type: string): string {
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

function getActivityDurationName(duration: string): string {
  const durations: Record<string, string> = {
    moins_6mois: "Moins de 6 mois",
    "6mois_1an": "Entre 6 mois et 1 an",
    "1an_3ans": "Entre 1 et 3 ans",
    plus_3ans: "Plus de 3 ans",
  }
  return durations[duration] || duration
}

function getGuaranteeTypeName(type: string): string {
  const types: Record<string, string> = {
    bien_materiel: "Bien matériel",
    caution_solidaire: "Caution solidaire",
    epargne: "Épargne bloquée",
    autre_garantie: "Autre",
  }
  return types[type] || type
}
