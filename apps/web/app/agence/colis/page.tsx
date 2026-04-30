"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, StatCard } from "@diaspo/ui";
import { useAgenceColis, useUpdateAgenceColisStatus } from "@diaspo/api";

export default function AgenceColisPage() {
  const router = useRouter();
  const { data, isLoading, error } = useAgenceColis();
  const { updateStatus, isPending } = useUpdateAgenceColisStatus();

  const stats = useMemo(() => {
    const enTransit = data.filter((item) => item.status === "en_transit").length;
    const douane = data.filter((item) => item.status === "douane").length;
    const livre = data.filter((item) => item.status === "livre").length;
    const totalWeight = data.reduce((sum, item) => sum + item.weightKg, 0);
    return { enTransit, douane, livre, totalWeight };
  }, [data]);

  const actionFor = (status: string) => {
    if (status === "en_transit") return "a_recuperer";
    if (status === "a_recuperer") return "en_livraison";
    if (status === "en_livraison") return "livre";
    return "livre";
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
        <h2>Gestion des colis</h2>
        <p className="mt-1 text-sm text-textMuted">Réception et livraison à Conakry</p>
      </header>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <StatCard label="En transit" value={String(stats.enTransit)} trend="Suivi actif" tone="gold" />
        <StatCard label="À récupérer" value={String(data.filter((item) => item.status === "a_recuperer").length)} trend="Aéroport" />
        <StatCard label="En livraison" value={String(data.filter((item) => item.status === "en_livraison").length)} trend="Chantier" tone="green" />
        <StatCard label="Problème douane" value={String(stats.douane)} trend="À traiter" tone="red" />
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue" />
          <h3>Colis en cours</h3>
        </div>
        {isLoading ? <p className="text-sm text-textMid">Chargement des colis...</p> : null}
        {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucun colis trouvé.</p> : null}
        {data.map((item) => (
          <div key={item.id} className="mb-2.5 flex justify-between gap-2.5 rounded-xl border border-border bg-bg px-3 py-2.5 last:mb-0">
            <div>
              <strong>{item.id.toUpperCase()} - {item.clientName}</strong>
              <p>{item.label} {item.weightKg}kg</p>
              {item.issue ? <p className="text-red">⚠ {item.issue}</p> : null}
            </div>
            <div className="grid justify-items-end gap-2">
              <Badge tone={statusTone(item.status)}>
                {statusLabel(item.status)}
              </Badge>
              {item.status !== "livre" ? (
                <button
                  type="button"
                  onClick={() => void updateStatus({ id: item.id, status: actionFor(item.status) })}
                  disabled={isPending}
                  className="rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-2.5 py-2 font-bold text-white disabled:opacity-60"
                >
                  Avancer statut
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}

function statusLabel(status: string): string {
  if (status === "en_transit") return "En vol";
  if (status === "a_recuperer") return "À récupérer";
  if (status === "en_livraison") return "En livraison";
  if (status === "douane") return "Bloqué";
  if (status === "livre") return "Livre";
  return status;
}

function statusTone(status: string): "blue" | "green" | "gold" | "red" {
  if (status === "douane") return "red";
  if (status === "livre" || status === "en_livraison") return "green";
  if (status === "a_recuperer") return "blue";
  return "gold";
}
