"use client";

import { Card, Badge } from "@diaspo/ui";
import { useRouter } from "next/navigation";
import { useProjectDocuments } from "@diaspo/api";

export default function DiasporaDocumentsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useProjectDocuments("p-001");

  return (
    <section className="grid gap-5">
      <button
        type="button"
        onClick={() => router.push("/diaspora/dashboard")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid"
      >
        ← Tableau de bord
      </button>
      <header>
        <h2>Mes documents</h2>
        <p className="mt-1 text-sm text-textMuted">Tous les fichiers de votre projet</p>
      </header>
      <Card>
        <div className="mb-1 flex items-center justify-between gap-2.5 border-b border-[#ebf1f9] pb-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue" />
              <h3>Documents administratifs</h3>
            </div>
            <p>Permis, contrat, devis, recus et rapports projet.</p>
          </div>
          <div className="whitespace-nowrap rounded-full bg-[#eaf4ff] px-2.5 py-1.5 text-xs font-bold text-blue">
            {data.length} fichiers
          </div>
        </div>
        {isLoading ? <p className="text-sm text-textMid">Chargement des documents...</p> : null}
        {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucun document disponible.</p> : null}
        {data.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5 border-b border-[#ebf1f9] py-3 last:border-b-0">
            <div>
              <strong>📄 {item.name}</strong>
              <div className="mt-0.5 text-[13px] text-textMid">{item.date} - {item.size}</div>
            </div>
            <Badge tone="blue">{item.type.toUpperCase()}</Badge>
            <button
              type="button"
              className="cursor-pointer rounded-[10px] border border-border bg-white px-2.5 py-2 font-bold text-textMid"
            >
              Télécharger
            </button>
          </div>
        ))}
      </Card>
    </section>
  );
}
