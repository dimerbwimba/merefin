"use client";

import type { JsonValue } from "@prisma/client/runtime/library";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, CreditCard, ArrowLeft } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Credit = {
  id: string;
  amount: number;
  user: {
    name: string;
  };
};

type Payment = {
  id: string;
  amount: number;
  date: Date;
  creditId: string;
  metadata?: JsonValue | null;
  credit: {
    id: string;
    amount: number;
    status: string;
    user: User;
  };
};

interface PaymentsListProps {
  payments: Payment[];
  clients: User[];
  credits: Credit[];
  currentFilters: {
    userId?: string;
    creditId?: string;
  };
}

export function PaymentsList({
  payments,
  clients,
  credits,
  currentFilters,
}: PaymentsListProps) {
  const [selectedClient, setSelectedClient] = useState(
    currentFilters.userId || ""
  );
  const [selectedCredit, setSelectedCredit] = useState(
    currentFilters.creditId || ""
  );
  const [searchTerm, setSearchTerm] = useState("");

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return "Non spécifié";

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

  const handleClientChange = (value: string) => {
    setSelectedClient(value);
    // Mettre à jour l'URL avec le nouveau filtre
    const url = new URL(window.location.href);
    if (value === "") {
      url.searchParams.delete("userId");
    } else {
      url.searchParams.set("userId", value);
    }
    window.history.pushState({}, "", url.toString());
  };

  const handleCreditChange = (value: string) => {
    setSelectedCredit(value);
    // Mettre à jour l'URL avec le nouveau filtre
    const url = new URL(window.location.href);
    if (value === "") {
      url.searchParams.delete("creditId");
    } else {
      url.searchParams.set("creditId", value);
    }
    window.history.pushState({}, "", url.toString());
  };

  // Filtrer les paiements en fonction des filtres actifs
  const filteredPayments = payments.filter((payment) => {
    // Filtre par client
    if (
      selectedClient &&
      selectedClient !== "all" &&
      payment.credit.user.id !== selectedClient
    ) {
      return false;
    }

    // Filtre par crédit
    if (
      selectedCredit &&
      selectedCredit !== "all" &&
      payment.creditId !== selectedCredit
    ) {
      return false;
    }

    // Filtre par recherche (ID de paiement ou montant)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.id.toLowerCase().includes(searchLower) ||
        payment.credit.user.name.toLowerCase().includes(searchLower) ||
        payment.credit.user.email.toLowerCase().includes(searchLower) ||
        payment.amount.toString().includes(searchLower)
      );
    }

    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculer le montant total des paiements filtrés
  const totalAmount = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour au tableau de bord
          </Link>
        </Button>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            Total des remboursements
          </p>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedClient} onValueChange={handleClientChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrer par client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCredit} onValueChange={handleCreditChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrer par crédit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les crédits</SelectItem>
              {credits.map((credit) => (
                <SelectItem key={credit.id} value={credit.id}>
                  {formatCurrency(credit.amount)} - {credit.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Aucun paiement trouvé avec les filtres sélectionnés.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-left py-3 px-4">Montant</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Méthode</th>
                <th className="text-left py-3 px-4">Crédit</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-mono text-sm">
                    {payment.id.substring(0, 8)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {payment.credit.user.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {payment.credit.user.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4">
                    {format(new Date(payment.date), "dd MMM yyyy", {
                      locale: fr,
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">
                      {getPaymentMethodLabel(
                        typeof payment.metadata === "object" &&
                          payment.metadata !== null &&
                          !Array.isArray(payment.metadata) &&
                          "paymentMethod" in payment.metadata
                          ? (payment.metadata as { paymentMethod?: string })
                              .paymentMethod
                          : undefined
                      )}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatCurrency(payment.credit.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID: {payment.credit.id.substring(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        title="Voir le crédit"
                      >
                        <Link
                          href={`/dashboard/supervisor/credits/${payment.creditId}`}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        title="Voir le client"
                      >
                        <Link
                          href={`/dashboard/supervisor/clients/${payment.credit.user.id}`}
                        >
                          <UserCircle className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
