"use client";

import { Badge, Card, ProgressBar, StatCard } from "@diaspo/ui";
import { useAgenceProjects } from "@diaspo/api";

export default function AgenceProjetsPage() {
  const { data, isLoading, error } = useAgenceProjects();
  const activeCount = data.filter((item) => item.status === "en_cours").length;
  const pendingPayments = data.filter((item) => item.status === "paiement_attendu").length;
  const delayed = data.filter((item) => item.status === "retard").length;
  const deliverySoon = data.filter((item) => item.status === "livraison_proche").length;

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Gestion des projets</h2>
          <p className="mt-1 text-sm text-textMuted">4 projets actifs - Mars 2025</p>
        </div>
        <button
          type="button"
          className="rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2 text-sm font-bold text-white"
        >
          + Nouveau projet
        </button>
      </header>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <StatCard label="Projets actifs" value={String(activeCount)} trend="Suivi journalier" />
        <StatCard label="Paiements en attente" value={String(pendingPayments)} trend="A relancer" tone="gold" />
        <StatCard label="Livraison ce mois" value={String(deliverySoon)} trend="Ce mois" tone="green" />
        <StatCard label="Retard signale" value={String(delayed)} trend="Intervention requise" tone="red" />
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue" />
          <h3>Liste des projets</h3>
        </div>
        {isLoading ? <p className="text-sm text-textMid">Chargement des projets...</p> : null}
        {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucun projet pour le moment.</p> : null}
        {!isLoading && !error && data.length > 0 ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-[0.06em] text-textMuted">
                  <th className="px-2 py-2.5">Client</th>
                  <th className="px-2 py-2.5">Projet</th>
                  <th className="px-2 py-2.5">Etape</th>
                  <th className="px-2 py-2.5">Avancement</th>
                  <th className="px-2 py-2.5">Statut</th>
                  <th className="px-2 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-[#ebf1f9] last:border-b-0">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#EAF4FF] text-[10px] font-bold text-blue">
                          {initials(item.clientName)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-text">{item.clientName}</p>
                          <p className="text-[11px] text-textMuted">{item.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-sm font-semibold text-text">{item.title}</td>
                    <td className="px-2 py-2.5 text-sm text-textMid">{item.stage}</td>
                    <td className="px-2 py-2.5">
                      <div className="min-w-[110px]">
                        <p className={`mb-1 text-xs font-bold ${progressTextClass(item.status)}`}>{item.progress}%</p>
                        <ProgressBar value={item.progress} />
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        type="button"
                        className="rounded-[10px] border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-blue"
                      >
                        {actionLabel(item.status)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </section>
  );
}

function statusLabel(status: string): string {
  if (status === "en_cours") return "En cours";
  if (status === "livraison_proche") return "Livraison proche";
  if (status === "retard") return "Retard 12j";
  if (status === "paiement_attendu") return "Paiement attendu";
  return status;
}

function statusTone(status: string): "blue" | "green" | "gold" | "red" {
  if (status === "retard") return "red";
  if (status === "paiement_attendu") return "gold";
  if (status === "livraison_proche") return "green";
  return "blue";
}

function actionLabel(status: string): string {
  if (status === "retard") return "Contacter";
  if (status === "paiement_attendu") return "Relancer";
  return "Mettre a jour";
}

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function progressTextClass(status: string): string {
  if (status === "retard") return "text-red";
  if (status === "paiement_attendu") return "text-[#C8922A]";
  if (status === "livraison_proche") return "text-green";
  return "text-blue";
}
