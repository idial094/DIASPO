"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { StatCard, Card, Badge, AlertBanner } from "@diaspo/ui";
import {
  useConfirmProjectPayment,
  useCreateStripePaymentIntent,
  useProjectPayments,
  useMyProjects,
} from "@diaspo/api";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function StripeCheckoutForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setIsSubmitting(true);
    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? "Paiement Stripe refusé.");
      return;
    }
    if (result.paymentIntent?.status === "succeeded") {
      await onSuccess();
      return;
    }
    setError("Paiement non confirmé. Réessayez.");
  };

  return (
    <form onSubmit={onSubmit} className="mt-2 grid gap-3">
      <PaymentElement />
      {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
      <div className="mt-1 flex gap-2.5">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-[10px] border border-border bg-white px-3 py-2.5 font-bold text-textMid">
          Annuler
        </button>
        <button type="submit" disabled={!stripe || isSubmitting}
          className="flex-1 rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-60">
          {isSubmitting ? "Paiement..." : "Payer maintenant"}
        </button>
      </div>
    </form>
  );
}

// ─── Payments content (requires a real project ID) ────────────────────────────

function PaymentsContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useProjectPayments(projectId);
  const { confirmPayment, isPending } = useConfirmProjectPayment(projectId);
  const { createIntent, isPending: isCreatingIntent, error: createIntentError } = useCreateStripePaymentIntent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const pendingPayment = useMemo(() => data.find((p) => p.status === "pending") ?? null, [data]);
  const paidPayments = useMemo(() => data.filter((p) => p.status === "paid"), [data]);
  const total = useMemo(() => data.reduce((sum, p) => sum + p.amountGnf, 0), [data]);
  const pendingTotal = useMemo(() => data.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amountGnf, 0), [data]);
  const eurEstimate = Math.round(total / 9300);

  const openPaymentSuccess = async () => {
    if (pendingPayment) await confirmPayment(pendingPayment.id);
    setIsModalOpen(false);
    setStripeClientSecret(null);
    setPaymentError(null);
    setIsSuccessOpen(true);
  };

  const startStripeCheckout = async () => {
    if (!pendingPayment) return;
    setPaymentError(null);
    try {
      const intent = await createIntent({
        projectId,
        paymentId: pendingPayment.id,
        amountGnf: pendingPayment.amountGnf,
      });
      if (intent.clientSecret.startsWith("mock_client_secret_")) {
        await openPaymentSuccess();
        return;
      }
      setStripeClientSecret(intent.clientSecret);
    } catch {
      setPaymentError("Impossible d'initialiser le paiement pour le moment.");
    }
  };

  const onCloseModal = () => {
    if (isPending || isCreatingIntent) return;
    setIsModalOpen(false);
    setStripeClientSecret(null);
    setPaymentError(null);
  };

  return (
    <section className="relative grid gap-5">
      <button type="button" onClick={() => router.push("/diaspora/dashboard")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid">
        ← Tableau de bord
      </button>
      <header>
        <h2>Mes paiements</h2>
        <p className="mt-1 text-sm text-textMuted">Historique et paiements en attente</p>
      </header>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <StatCard label="Total versé" value={`${total.toLocaleString("fr-FR")} GNF`} trend={`${paidPayments.length} paiement(s)`} />
        <StatCard label="En attente" value={`${pendingTotal.toLocaleString("fr-FR")} GNF`} trend={pendingPayment ? "Action requise" : "Aucun"} tone="gold" />
        <StatCard label="Équivalent EUR" value={`~ ${eurEstimate.toLocaleString("fr-FR")} €`} trend="Estimation" tone="blue" />
      </div>

      {pendingPayment ? (
        <>
          <AlertBanner
            title="Demande de paiement en attente"
            description={`${pendingPayment.stage ?? "Étape en cours"} — ${pendingPayment.amountGnf.toLocaleString("fr-FR")} GNF`}
            actionLabel="Payer maintenant"
          />
          <Card>
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C8922A]" />
                <h3>Demande en cours</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(true)}
                className="rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white">
                Payer maintenant
              </button>
            </div>
            <p className="mt-2 text-textMid">
              {pendingPayment.stage ?? "Étape en cours"} — {pendingPayment.amountGnf.toLocaleString("fr-FR")} GNF
            </p>
          </Card>
        </>
      ) : null}

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          <h3>Historique des paiements</h3>
        </div>
        {isLoading ? <p className="text-sm text-textMid">Chargement des paiements...</p> : null}
        {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
        {!isLoading && !error && data.length === 0 ? (
          <p className="text-sm text-textMid">Aucun paiement enregistré pour ce projet.</p>
        ) : null}
        {data.map((item) => (
          <div key={item.id} className="mt-2.5 flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold">{item.amountGnf.toLocaleString("fr-FR")} GNF</span>
              {item.stage ? <span className="ml-2 text-xs text-textMid">{item.stage}</span> : null}
            </div>
            <Badge tone={item.status === "pending" ? "gold" : item.status === "failed" ? "red" : "green"}>
              {item.status === "pending" ? "En attente" : item.status === "failed" ? "Échec" : "Payé"}
            </Badge>
          </div>
        ))}
      </Card>

      {isModalOpen && pendingPayment ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(14,27,46,0.45)] p-4">
          <div className="w-full max-w-[460px] rounded-[20px] border border-border bg-white p-[22px]">
            <h3>Confirmer le paiement</h3>
            <p className="mt-1 text-sm text-textMid">
              {pendingPayment.stage ?? "Étape en cours"} — {pendingPayment.amountGnf.toLocaleString("fr-FR")} GNF (paiement sécurisé Stripe)
            </p>
            {createIntentError ? <p className="mt-2 text-sm text-[#8c2130]">{createIntentError}</p> : null}
            {paymentError ? <p className="mt-2 text-sm text-[#8c2130]">{paymentError}</p> : null}
            {!stripeClientSecret ? (
              <div className="mt-3.5 flex gap-2.5">
                <button type="button" onClick={onCloseModal}
                  className="flex-1 rounded-[10px] border border-border bg-white px-3 py-2.5 font-bold text-textMid">
                  Annuler
                </button>
                <button type="button" onClick={() => void startStripeCheckout()}
                  disabled={isCreatingIntent || isPending || !stripePromise}
                  className="flex-1 rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-60">
                  {isCreatingIntent ? "Initialisation..." : "Continuer"}
                </button>
              </div>
            ) : stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                <StripeCheckoutForm onSuccess={openPaymentSuccess} onCancel={onCloseModal} />
              </Elements>
            ) : (
              <p className="mt-2 text-sm text-[#8c2130]">Clé Stripe publique manquante.</p>
            )}
          </div>
        </div>
      ) : null}

      {isSuccessOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(14,27,46,0.45)] p-4">
          <div className="w-full max-w-[380px] rounded-[20px] border border-border bg-white p-[22px] text-center">
            <div style={{ fontSize: 42 }}>✅</div>
            <h3>Paiement confirmé</h3>
            <p className="text-textMid">La transaction a bien été enregistrée.</p>
            <button type="button" onClick={() => setIsSuccessOpen(false)}
              className="mt-2 w-full rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white">
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export default function DiasporaPaiementsPage() {
  const router = useRouter();
  const { data: myProjects, isLoading } = useMyProjects();

  if (isLoading) {
    return (
      <section className="grid gap-5">
        <header><h2>Mes paiements</h2></header>
        <p className="text-sm text-textMid">Chargement...</p>
      </section>
    );
  }

  if (myProjects.length === 0) {
    return (
      <section className="grid gap-5">
        <button type="button" onClick={() => router.push("/diaspora/dashboard")}
          className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid">
          ← Tableau de bord
        </button>
        <header>
          <h2>Mes paiements</h2>
          <p className="mt-1 text-sm text-textMuted">Aucun projet trouvé</p>
        </header>
        <p className="text-sm text-textMid">
          Créez d&apos;abord un projet depuis le tableau de bord pour accéder aux paiements.
        </p>
      </section>
    );
  }

  const firstProject = myProjects[0];
  if (!firstProject) return null;
  return <PaymentsContent projectId={firstProject.id} />;
}
