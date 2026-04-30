"use client";

import { useState } from "react";
import { Badge, Card } from "@diaspo/ui";
import { useAdminExports, useRunAdminExport } from "@diaspo/api";

export default function AdminExportsPage() {
  const { data, isLoading, error } = useAdminExports();
  const { runExport, isPending } = useRunAdminExport();
  const [lastExport, setLastExport] = useState<string | null>(null);

  return (
    <section className="grid gap-5">
      <header>
        <h2>Exports CSV/PDF</h2>
        <p className="mt-1 text-sm text-textMuted">Generation des rapports administratifs.</p>
      </header>
      {lastExport ? <p>Dernier export: {lastExport}</p> : null}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {isLoading ? <p>Chargement...</p> : null}
        {error ? <p>{error}</p> : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucun export disponible.</p> : null}
        {data.map((item) => (
          <Card key={item.id}>
            <h3>{item.name}</h3>
            <div className="my-2">
              <Badge tone={item.format === "PDF" ? "red" : "blue"}>{item.format}</Badge>
            </div>
            <button
              type="button"
              onClick={() =>
                void runExport(item.id).then(() =>
                  setLastExport(`${item.name} (${item.format})`)
                )
              }
              disabled={isPending}
              className="rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-2.5 py-2 font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Generation..." : "Generer export"}
            </button>
          </Card>
        ))}
      </div>
    </section>
  );
}
