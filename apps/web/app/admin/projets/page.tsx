"use client";

import { useMemo, useState } from "react";
import { Badge, Card, ProgressBar } from "@diaspo/ui";
import { InputField, SelectField } from "@diaspo/ui/src/components/FormField";
import { useAdminProjects, useUpdateAdminProjectStatus } from "@diaspo/api";

export default function AdminProjetsPage() {
  const { data, isLoading, error } = useAdminProjects();
  const { updateStatus, isPending } = useUpdateAdminProjectStatus();
  const [filter, setFilter] = useState<"all" | "en_cours" | "retard" | "paiement_attendu">("all");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState<"all" | string>("all");

  const owners = useMemo(
    () => ["all", ...Array.from(new Set(data.map((item) => item.owner)))],
    [data]
  );

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchStatus = filter === "all" ? true : item.status === filter;
      const matchOwner = owner === "all" ? true : item.owner === owner;
      const q = search.trim().toLowerCase();
      const matchSearch =
        q.length === 0 ||
        item.clientName.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      return matchStatus && matchOwner && matchSearch;
    });
  }, [data, filter, owner, search]);

  return (
    <section className="grid gap-5">
      <header>
        <h2>Tous les projets</h2>
        <p className="mt-1 text-sm text-textMuted">Suivi des chantiers, statuts et responsables.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter("all")} className={filterBtnClass(filter === "all")}>
          Tous ({data.length})
        </button>
        <button type="button" onClick={() => setFilter("en_cours")} className={filterBtnClass(filter === "en_cours")}>
          En cours ({data.filter((item) => item.status === "en_cours").length})
        </button>
        <button type="button" onClick={() => setFilter("retard")} className={filterBtnClass(filter === "retard")}>
          Retard ({data.filter((item) => item.status === "retard").length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("paiement_attendu")}
          className={filterBtnClass(filter === "paiement_attendu")}
        >
          Paiement attendu ({data.filter((item) => item.status === "paiement_attendu").length})
        </button>
      </div>
      <div className="grid gap-2 min-[861px]:grid-cols-[2fr_1fr]">
        <InputField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher client/projet/localisation..."
        />
        <SelectField
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          options={owners.map((item) => ({
            value: item,
            label: item === "all" ? "Tous responsables" : item
          }))}
        />
      </div>
      <Card>
        {isLoading ? <p className="text-sm text-textMid">Chargement des projets...</p> : null}
        {error ? (
          <p className="mb-2 rounded-xl border border-[#f2d7dc] bg-[#fff7f8] px-3 py-2 text-sm text-[#8c2130]">{error}</p>
        ) : null}
        {!isLoading && !error && filtered.length === 0 ? <p className="text-textMid">Aucun projet selon les filtres.</p> : null}
        {filtered.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-bg px-3 py-3 last:mb-0 mb-2.5">
            <div className="flex justify-between gap-2">
              <strong>{item.clientName} - {item.title}</strong>
              <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
            </div>
            <p>{item.location} · Responsable: {item.owner}</p>
            <ProgressBar value={item.progress} />
            <div className="mt-2">
              <button
                type="button"
                onClick={() =>
                  void updateStatus({
                    id: item.id,
                    status: nextStatus(item.status)
                  })
                }
                disabled={isPending}
                className="cursor-pointer rounded-lg border border-border bg-white px-2 py-1.5 font-bold text-text"
              >
                Avancer statut
              </button>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}

function filterBtnClass(active: boolean): string {
  return `cursor-pointer rounded-full border border-border px-3 py-1.5 font-bold ${active ? "bg-[#eaf4ff] text-blue" : "bg-white text-text"}`;
}

function nextStatus(status: string): string {
  if (status === "retard") return "en_cours";
  if (status === "en_cours") return "livraison_proche";
  if (status === "livraison_proche") return "termine";
  return "en_cours";
}

function statusLabel(status: string): string {
  if (status === "en_cours") return "En cours";
  if (status === "retard") return "Retard";
  if (status === "paiement_attendu") return "Paiement attendu";
  if (status === "livraison_proche") return "Livraison proche";
  if (status === "termine") return "Termine";
  return status;
}

function statusTone(status: string): "blue" | "green" | "gold" | "red" {
  if (status === "retard") return "red";
  if (status === "paiement_attendu") return "gold";
  if (status === "livraison_proche" || status === "termine") return "green";
  return "blue";
}
