"use client";

import { Card, ProgressBar, StatCard } from "@diaspo/ui";
import { useAdminFinances } from "@diaspo/api";

export default function AdminFinancesPage() {
  const { data, isLoading, error } = useAdminFinances();
  const financesData = data ?? {
    receivedGnf: 48_400_000,
    pendingGnf: 9_000_000,
    eurEquivalent: 5_180,
    commissionPct: 7.2,
    byProject: [
      { projectId: "p-001", label: "Mariam Kouyate", consumedPct: 70 },
      { projectId: "p-002", label: "Ibrahima Diallo", consumedPct: 90 },
      { projectId: "p-003", label: "Mamadou Bah", consumedPct: 55 },
      { projectId: "p-004", label: "Aissatou Barry", consumedPct: 40 }
    ]
  };

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Finances</h2>
          <p className="mt-1 text-sm text-textMuted">Recapitulatif comptable - Mars 2025</p>
        </div>
      </header>
      {isLoading ? <p className="text-sm text-textMid">Chargement des finances...</p> : null}
      {error ? (
        <p className="rounded-xl border border-[#f2d7dc] bg-[#fff7f8] px-3 py-2 text-sm text-[#8c2130]">
          {error} Affichage des donnees de demonstration.
        </p>
      ) : null}
      <>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <StatCard label="GNF recus (total)" value={financesData.receivedGnf.toLocaleString("fr-FR")} tone="green" />
            <StatCard label="GNF en attente" value={financesData.pendingGnf.toLocaleString("fr-FR")} tone="gold" />
            <StatCard label="Equivalent EUR" value={`≈ ${financesData.eurEquivalent.toLocaleString("fr-FR")}€`} />
            <StatCard label="Commission agence" value={`${financesData.commissionPct}%`} />
          </div>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C8922A]" />
              <h3>Repartition par projet</h3>
            </div>
            {financesData.byProject.map((item) => (
              <div key={item.projectId} className="border-b border-[#ebf1f9] py-2.5 last:border-b-0">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <strong>{item.label}</strong>
                  <span className="text-xs font-semibold text-textMid">{item.consumedPct}%</span>
                </div>
                <ProgressBar value={item.consumedPct} />
              </div>
            ))}
          </Card>
      </>
    </section>
  );
}
