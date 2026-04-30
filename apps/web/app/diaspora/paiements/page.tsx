"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { StatCard, Card, Badge, AlertBanner } from "@diaspo/ui";
import {
  useConfirmProjectPayment,
  useCreateStripePaymentIntent,
  useProjectPayments
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
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Paiement Stripe refuse.");
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      await onSuccess();
      return;
    }

    setError("Paiement non confirme. Reessayez.");
  };

  return (
    <form onSubmit={onSubmit} className="mt-2 grid gap-3">
      <PaymentElement />
      {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-[10px] border border-border bg-white px-3 py-2.5 font-bold text-textMid"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="flex-1 rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Paiement..." : "Payer maintenant"}
        </button>
      </div>
    </form>
  );
}

export default function DiasporaPaiementsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useProjectPayments("p-001");
  const { confirmPayment, isPending } = useConfirmProjectPayment("p-001");
  const { createIntent, isPending: isCreatingIntent, error: createIntentError } = useCreateStripePaymentIntent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const total = data.reduce((sum, item) => sum + item.amountGnf, 0);
  const pendingAmount = useMemo(
    () => data.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amountGnf, 0),
    [data]
  );
  const budgetGnf = 27000000;
  const consumedPct = budgetGnf > 0 ? Math.round((total / budgetGnf) * 100) : 0;
  const eurEstimate = Math.round(total / 9300);

  const openPaymentSuccess = async () => {
    await confirmPayment("pay-001");
    setIsModalOpen(false);
    setStripeClientSecret(null);
    setPaymentError(null);
    setIsSuccessOpen(true);
  };

  const startStripeCheckout = async () => {
    setPaymentError(null);
    try {
      const intent = await createIntent({
        projectId: "p-001",
        paymentId: "pay-001",
        amountGnf: 4200000,
      });

      if (intent.clientSecret.startsWith("mock_client_secret_")) {
        await openPaymentSuccess();
        return;
      }

      setStripeClientSecret(intent.clientSecret);
    } catch {
      setPaymentError("Impossible d'initialiser Stripe pour le moment.");
    }
  };

  const onCloseModal = () => {
    if (isPending || isCreatingIntent) return;
    setIsModalOpen(false);
    setStripeClientSecret(null);
    setPaymentError(null);
  };

  const onOpenModal = () => {
    setIsModalOpen(true);
    setStripeClientSecret(null);
    setPaymentError(null);
  };

  const onCloseSuccess = () => {
    setIsSuccessOpen(false);
  };

  return (
    <section className="relative grid gap-5">
      <button
        type="button"
        onClick={() => router.push("/diaspora/dashboard")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid"
      >
        ← Tableau de bord
      </button>
      <header>
        <h2>Mes paiements</h2>
        <p className="mt-1 text-sm text-textMuted">Historique et paiements en attente</p>
      </header>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <StatCard label="GNF verses" value={`${total.toLocaleString("fr-FR")} GNF`} trend="3 paiements" />
        <StatCard
          label="En attente"
          value={`${pendingAmount.toLocaleString("fr-FR")} GNF`}
          trend="Action requise"
          tone="gold"
        />
        <StatCard label="Budget consomme" value={`${consumedPct}%`} trend={`${budgetGnf.toLocaleString("fr-FR")} GNF`} />
        <StatCard label="Equivalent EUR" value={`~ ${eurEstimate.toLocaleString("fr-FR")} €`} trend="Estimation" tone="blue" />
      </div>

      <AlertBanner title="Demande en attente" description="Etape 3 - Elevation des murs - 4 200 000 GNF" actionLabel="Payer maintenant" />

      <Card>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C8922A]" />
            <h3>Demande en cours</h3>
          </div>
          <button
            type="button"
            onClick={onOpenModal}
            className="rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white"
          >
            Payer maintenant
          </button>
        </div>
        <p className="mt-2 text-textMid">
          Etape 4 - Elevation des murs (facture ouverte)
        </p>
      </Card>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          <h3>Historique des paiements</h3>
        </div>
        {isLoading ? <p className="text-sm text-textMid">Chargement des paiements...</p> : null}
        {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucun paiement enregistre.</p> : null}
        {data.map((item) => (
          <div key={item.id} className="mt-2.5 flex justify-between">
            <span>{item.amountGnf.toLocaleString("fr-FR")} GNF</span>
            <Badge tone={item.status === "pending" ? "gold" : "green"}>
              {item.status === "pending" ? "En attente" : "Paye"}
            </Badge>
          </div>
        ))}
      </Card>

      {isModalOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(14,27,46,0.45)] p-4">
          <div className="w-full max-w-[460px] rounded-[20px] border border-border bg-white p-[22px]">
            <h3>Confirmer le paiement</h3>
            <p className="mt-1 text-sm text-textMid">Etape 4 - 4 200 000 GNF (paiement securise Stripe)</p>
            {createIntentError ? <p className="mt-2 text-sm text-[#8c2130]">{createIntentError}</p> : null}
            {paymentError ? <p className="mt-2 text-sm text-[#8c2130]">{paymentError}</p> : null}

            {!stripeClientSecret ? (
              <div className="mt-3.5 flex gap-2.5">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="flex-1 rounded-[10px] border border-border bg-white px-3 py-2.5 font-bold text-textMid"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void startStripeCheckout()}
                  disabled={isCreatingIntent || isPending || !stripePromise}
                  className="flex-1 rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-60"
                >
                  {isCreatingIntent ? "Initialisation..." : "Continuer"}
                </button>
              </div>
            ) : stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                <StripeCheckoutForm onSuccess={openPaymentSuccess} onCancel={onCloseModal} />
              </Elements>
            ) : (
              <p className="mt-2 text-sm text-[#8c2130]">Cle Stripe publique manquante.</p>
            )}
          </div>
        </div>
      ) : null}

      {isSuccessOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(14,27,46,0.45)] p-4">
          <div className="w-full max-w-[380px] rounded-[20px] border border-border bg-white p-[22px] text-center">
            <div style={{ fontSize: 42 }}>✅</div>
            <h3>Paiement confirme</h3>
            <p className="text-textMid">La transaction a bien ete enregistree.</p>
            <button
              type="button"
              onClick={onCloseSuccess}
              className="mt-2 w-full rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
