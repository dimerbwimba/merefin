import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  CalendarIcon,
  ArrowLeft,
  CheckCircle,
  XCircle,
  UserCircle,
  BanknoteIcon,
} from "lucide-react";
import { isCreditMetadata, isPaymentMetadata } from "@/utils/type-guards";

export default async function AdminCreditDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMINISTRATEUR") {
    redirect("/dashboard");
  }

  const credit = await db.credit.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      payments: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!credit) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "APPROUVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "REJETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "REMBOURSE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
        return "En attente";
      case "APPROUVE":
        return "Approuvé";
      case "REJETE":
        return "Rejeté";
      case "REMBOURSE":
        return "Remboursé";
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "ESPECES":
        return "Espèces";
      case "MOBILE_MONEY":
        return "Mobile Money";
      case "VIREMENT":
        return "Virement bancaire";
      default:
        return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalPaid = credit.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const remainingAmount = credit.amount - totalPaid;
  const isFullyPaid = totalPaid >= credit.amount;
  const progressPercentage = (totalPaid / credit.amount) * 100;

  return (
    <div className="container mx-auto py-8 md:px-20 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/admin/credits">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Détails du crédit</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle>Crédit de {formatCurrency(credit.amount)}</CardTitle>
                <Badge className={getStatusColor(credit.status)}>
                  {getStatusLabel(credit.status)}
                </Badge>
              </div>
              <CardDescription className="flex items-center mt-1">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Demandé le{" "}
                {format(new Date(credit.requestDate), "dd MMMM yyyy", {
                  locale: fr,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <UserCircle className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{credit.user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {credit.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Client depuis{" "}
                    {format(new Date(credit.user.createdAt), "MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="ml-auto">
                  <Link href={`/dashboard/admin/users/${credit.user.id}/edit`}>
                    <UserCircle className="h-4 w-4 mr-1" />
                    Voir le profil
                  </Link>
                </Button>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression du remboursement</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="font-medium">{formatCurrency(credit.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant payé</p>
                  <p className="font-medium">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="font-medium">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>
                {credit.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Date d'échéance
                    </p>
                    <p className="font-medium">
                      {format(new Date(credit.dueDate), "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                )}
                {credit.approvalDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Date d'approbation
                    </p>
                    <p className="font-medium">
                      {format(new Date(credit.approvalDate), "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {isCreditMetadata(credit.metadata) && credit.metadata.purpose && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm font-medium mb-1">Objet du crédit:</p>
                  <p className="text-sm">{credit.metadata.purpose}</p>
                </div>
              )}

              {credit.status === "REJETE" &&
                isCreditMetadata(credit.metadata) &&
                credit.metadata.rejectionReason && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Motif du rejet:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {credit.metadata.rejectionReason}
                    </p>
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-4">
              {credit.status === "EN_ATTENTE" && (
                <>
                  <Button asChild variant="default" className="w-full">
                    <Link
                      href={`/dashboard/admin/credits/${credit.id}/approve`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Link>
                  </Button>
                  <Button asChild variant="destructive" className="w-full">
                    <Link href={`/dashboard/admin/credits/${credit.id}/reject`}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Link>
                  </Button>
                </>
              )}
              {credit.status === "APPROUVE" && !isFullyPaid && (
                <Button asChild className="w-full">
                  <Link href={`/dashboard/admin/credits/${credit.id}/payment`}>
                    <BanknoteIcon className="h-4 w-4 mr-2" />
                    Enregistrer un paiement
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                {credit.payments.length} paiement(s) effectué(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {credit.payments.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <p>Aucun paiement effectué pour ce crédit.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {credit.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="border-b pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.date), "dd MMMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                          {isPaymentMetadata(payment.metadata) &&
                            payment.metadata.paymentMethod && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Méthode:{" "}
                                {getPaymentMethodLabel(
                                  payment.metadata.paymentMethod
                                )}
                              </p>
                            )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          #{payment.id.substring(0, 8)}
                        </Badge>
                      </div>
                      {isPaymentMetadata(payment.metadata) &&
                        payment.metadata.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          "{payment.metadata.notes}"
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
