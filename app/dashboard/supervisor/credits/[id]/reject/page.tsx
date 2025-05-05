import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreditApprovalForm } from "@/components/supervisor/credit-approval-form";

export default async function RejectCreditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  if (
    session.user.role !== "SUPERVISEUR" &&
    session.user.role !== "ADMINISTRATEUR"
  ) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const credit = await db.credit.findUnique({
    where: {
      id: id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!credit) {
    notFound();
  }

  // Vérifier si le crédit est en attente
  if (credit.status !== "EN_ATTENTE") {
    redirect(`/dashboard/supervisor/credits/${credit.id}`);
  }

  function isValidMetadata(
    data: any
  ): data is { purpose?: string; duration?: number } {
    return (
      data === null ||
      (typeof data === "object" &&
        (data.purpose === undefined || typeof data.purpose === "string") &&
        (data.duration === undefined || typeof data.duration === "number"))
    );
  }

  const safeCredit = {
    ...credit,
    metadata: isValidMetadata(credit.metadata) ? credit.metadata : null,
  };
  return (
    <div className="container mx-auto py-8 px-20">
      <h1 className="text-2xl font-bold mb-6">Rejeter la demande de crédit</h1>
      <CreditApprovalForm credit={safeCredit} action="reject" />
    </div>
  );
}
