"use client";

import { Badge, Card } from "@diaspo/ui";
import { useAgenceColis } from "@diaspo/api";
import { useMemo } from "react";

export default function AdminColisPage() {
  const { data, isLoading, error } = useAgenceColis();
  const stats = useMemo(() => {
    const transit = data.filter((item) => item.status === "en_transit").length;
    const delivered = data.filter((item) => item.status === "livre").length;
    const blocked = data.filter((item) => item.status === "douane").length;
    const totalWeight = data.reduce((sum, item) => sum + item.weightKg, 0);
    return { transit, delivered, blocked, totalWeight };
  }, [data]);

  return (
    <section className="grid gap-5">
      <header>
        <h2>Colis & transferts</h2>
        <p className="mt-1 text-sm text-textMuted">Gestion globale des envois et statuts douaniers.</p>
      </header>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="rounded-[18px] border border-border bg-white p-4 shadow-[0_2px_16px_rgba(26,111,196,0.09)]">En transit: <strong>{stats.transit}</strong></div>
        <div className="rounded-[18px] border border-border bg-white p-4 shadow-[0_2px_16px_rgba(26,111,196,0.09)]">Livres: <strong>{stats.delivered}</strong></div>
        <div className="rounded-[18px] border border-border bg-white p-4 shadow-[0_2px_16px_rgba(26,111,196,0.09)]">Problemes douane: <strong>{stats.blocked}</strong></div>
        <div className="rounded-[18px] border border-border bg-white p-4 shadow-[0_2px_16px_rgba(26,111,196,0.09)]">Poids total: <strong>{stats.totalWeight} kg</strong></div>
      </div>
      <Card>
        {isLoading ? <p className="text-sm text-textMid">Chargement des colis...</p> : null}
        {error ? (
          <p className="mb-2 rounded-xl border border-[#f2d7dc] bg-[#fff7f8] px-3 py-2 text-sm text-[#8c2130]">{error}</p>
        ) : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucun colis trouve.</p> : null}
        {data.map((item) => (
          <div key={item.id} className="mb-2.5 flex justify-between rounded-xl border border-border bg-bg px-3 py-2.5 last:mb-0">
            <div>
              <strong>{item.id.toUpperCase()} - {item.clientName}</strong>
              <p>{item.label} · {item.weightKg}kg</p>
            </div>
            <Badge tone={item.status === "douane" ? "red" : item.status === "livre" ? "green" : "gold"}>
              {item.status === "douane" ? "Douane" : item.status === "livre" ? "Livre" : "En transit"}
            </Badge>
          </div>
        ))}
      </Card>
    </section>
  );
}
