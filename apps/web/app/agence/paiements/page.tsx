"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Badge, Card } from "@diaspo/ui";
import { InputField, SelectField } from "@diaspo/ui/src/components/FormField";
import { paiementRequestSchema, type PaiementRequestData } from "@diaspo/shared";
import {
  useAgenceProjects,
  useAgencePaymentRequests,
  useCreateAgencePaymentRequest
} from "@diaspo/api";

export default function AgencePaiementsPage() {
  const router = useRouter();
  const { data: projects } = useAgenceProjects();
  const { data, isLoading, error } = useAgencePaymentRequests();
  const { createRequest, isPending } = useCreateAgencePaymentRequest();
  const { register, handleSubmit, formState: { errors } } = useForm<PaiementRequestData>({
    resolver: zodResolver(paiementRequestSchema),
    defaultValues: {
      clientId: "p-001",
      etape: "Etape 4 - Murs",
      montantGNF: 4200000
    }
  });
  const pending = useMemo(() => data.filter((item) => item.status === "pending").length, [data]);

  const submit = (payload: PaiementRequestData) => {
    void createRequest({
      projectId: payload.clientId,
      clientName: "Client " + payload.clientId.toUpperCase(),
      stage: payload.etape,
      amountGnf: payload.montantGNF
    });
  };

  return (
    <section className="grid gap-5">
      <button
        type="button"
        onClick={() => router.push("/agence/projets")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid"
      >
        ← Retour aux projets
      </button>
      <header>
        <h2>Demandes de paiement</h2>
        <p className="mt-1 text-sm text-textMuted">Gérer et envoyer des demandes aux clients</p>
      </header>
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#C8922A]" />
          <h3>Créer une demande de paiement</h3>
        </div>
        <form className="mt-2 grid gap-2.5 min-[1020px]:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={handleSubmit(submit)}>
          <SelectField
            {...register("clientId")}
            options={projects.map((item) => ({ value: item.id, label: item.clientName }))}
            error={errors.clientId?.message}
          />
          <InputField {...register("etape")} placeholder="Étape" error={errors.etape?.message} />
          <InputField type="number" {...register("montantGNF", { valueAsNumber: true })} placeholder="Montant (GNF)" error={errors.montantGNF?.message} />
          <button type="submit" disabled={isPending} className="h-fit rounded-xl bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 text-sm font-bold text-white">
            {isPending ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </Card>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue" />
          <h3>Demandes récentes ({pending} en attente)</h3>
        </div>
        {isLoading ? <p className="text-sm text-textMid">Chargement des demandes...</p> : null}
        {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucune demande récente.</p> : null}
        {data.map((item) => (
          <div key={item.id} className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 last:mb-0">
            <div>
              <strong>{item.clientName} - {item.stage}</strong>
              <p>
                {item.status === "pending" ? "Envoyée récemment" : "Payée"} - {item.amountGnf.toLocaleString("fr-FR")} GNF
              </p>
            </div>
            <Badge tone={item.status === "pending" ? "gold" : "green"}>{item.status === "pending" ? "En attente" : "Payée"}</Badge>
          </div>
        ))}
      </Card>
    </section>
  );
}
