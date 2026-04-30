"use client";

import { useState } from "react";
import { AlertBanner, Badge, Card, ProgressBar, StatCard, TrackingCard } from "@diaspo/ui";
import { useProjectMessages, useProjectSummary } from "@diaspo/api";

export default function DiasporaDashboardPage() {
  const { data, isLoading, error } = useProjectSummary("p-001");
  const { data: messages } = useProjectMessages("p-001");
  const preview = messages.slice(-3);
  const [galleryTab, setGalleryTab] = useState<"photos" | "details">("photos");

  return (
    <section className="grid gap-[18px]">
      <header>
        <h2>Tableau de bord</h2>
        <p className="mt-1 text-sm text-textMuted">Vue globale de votre chantier - Mars 2025</p>
      </header>

      <div className="animate-[pulseAlert_3s_ease-in-out_infinite]">
        <AlertBanner
          title="Paiement en attente"
          description="Une demande de 4 200 000 GNF est en attente de validation."
          actionLabel="Payer maintenant"
        />
      </div>

      <div className="grid items-start gap-4 min-[1041px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <StatCard label="Avancement global" value="47%" trend="+8% ce mois" tone="blue" />
            <StatCard label="Etapes validees" value="3/8" trend="Murs en cours" tone="green" />
            <StatCard label="GNF verses" value="12.6M" trend="3 paiements" tone="gold" />
            <StatCard label="Delai estime" value="4 mois" trend="Juillet 2025" tone="blue" />
          </div>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue" />
              <h3>Projet en cours</h3>
            </div>
            {isLoading ? <p>Chargement du projet...</p> : null}
            {error ? <p>{error}</p> : null}
            {data ? (
              <>
                <h3>{data.title}</h3>
                <p>Client: {data.client}</p>
                <p>Statut: <Badge tone="blue">{data.status}</Badge></p>
                <div className="mt-2">
                  <ProgressBar value={data.progress} />
                </div>
              </>
            ) : null}
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
              <h3>Timeline du chantier</h3>
            </div>
            <ul className="mt-2.5 grid list-none gap-3.5 p-0">
              <li className="relative grid grid-cols-[28px_1fr] items-start gap-2.5 after:absolute after:left-[11px] after:top-6 after:h-[calc(100%+6px)] after:w-[2px] after:bg-border last:after:hidden">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e9f8ef] text-xs font-bold text-[#1b7a45]">✓</span>
                <div>
                  <strong>Preparation du terrain</strong>
                  <p className="mt-0.5 text-sm text-textMid">Termine - 10 Jan 2025</p>
                </div>
              </li>
              <li className="relative grid grid-cols-[28px_1fr] items-start gap-2.5 after:absolute after:left-[11px] after:top-6 after:h-[calc(100%+6px)] after:w-[2px] after:bg-border last:after:hidden">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e9f8ef] text-xs font-bold text-[#1b7a45]">✓</span>
                <div>
                  <strong>Fondations</strong>
                  <p className="mt-0.5 text-sm text-textMid">Termine - 5 Fev 2025</p>
                </div>
              </li>
              <li className="relative grid grid-cols-[28px_1fr] items-start gap-2.5 after:absolute after:left-[11px] after:top-6 after:h-[calc(100%+6px)] after:w-[2px] after:bg-border last:after:hidden">
                <span className="grid h-6 w-6 animate-pulse place-items-center rounded-full bg-[#eaf4ff] text-xs font-bold text-blue">●</span>
                <div>
                  <strong>Elevation des murs</strong>
                  <p className="mt-0.5 text-sm text-textMid">En cours - 60%</p>
                  <div className="mt-2">
                    <ProgressBar value={60} />
                  </div>
                </div>
              </li>
              <li className="relative grid grid-cols-[28px_1fr] items-start gap-2.5 after:absolute after:left-[11px] after:top-6 after:h-[calc(100%+6px)] after:w-[2px] after:bg-border last:after:hidden">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ebf1f9] text-xs font-bold text-textMid">⏳</span>
                <div>
                  <strong>Toiture</strong>
                  <p className="mt-0.5 text-sm text-textMid">En attente</p>
                </div>
              </li>
              <li className="relative grid grid-cols-[28px_1fr] items-start gap-2.5 after:absolute after:left-[11px] after:top-6 after:h-[calc(100%+6px)] after:w-[2px] after:bg-border last:after:hidden">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ebf1f9] text-xs font-bold text-textMid">⏳</span>
                <div>
                  <strong>Finitions interieures & exterieures</strong>
                  <p className="mt-0.5 text-sm text-textMid">En attente</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C8922A]" />
              <h3>Galerie chantier</h3>
            </div>
            <div className="mt-2 inline-flex gap-1 rounded-[10px] border border-border bg-bgAlt p-[3px]">
              <button
                type="button"
                className={`rounded-lg px-2.5 py-1.5 font-bold ${galleryTab === "photos" ? "bg-white text-blue shadow-[0_2px_10px_rgba(26,111,196,0.12)]" : "text-textMid"}`}
                onClick={() => setGalleryTab("photos")}
              >
                Photos
              </button>
              <button
                type="button"
                className={`rounded-lg px-2.5 py-1.5 font-bold ${galleryTab === "details" ? "bg-white text-blue shadow-[0_2px_10px_rgba(26,111,196,0.12)]" : "text-textMid"}`}
                onClick={() => setGalleryTab("details")}
              >
                Details
              </button>
            </div>
            {galleryTab === "photos" ? (
              <div className="mt-2.5 grid gap-2.5 [grid-template-columns:repeat(3,minmax(0,1fr))]">
                <div className="grid min-h-[90px] animate-[slideInCard_0.5s_ease_both] place-items-center rounded-xl border border-border bg-gradient-to-br from-[#b0bec5] to-[#90a4ae] text-[28px]">🏗️</div>
                <div className="grid min-h-[90px] animate-[slideInCard_0.5s_ease_both] place-items-center rounded-xl border border-border bg-gradient-to-br from-[#a5d6a7] to-[#81c784] text-[28px]">🧱</div>
                <div className="grid min-h-[90px] animate-[slideInCard_0.5s_ease_both] place-items-center rounded-xl border border-border bg-gradient-to-br from-[#ffe082] to-[#ffd54f] text-[28px]">🚧</div>
                <div className="grid min-h-[90px] animate-[slideInCard_0.5s_ease_both] place-items-center rounded-xl border border-border bg-gradient-to-br from-[#ef9a9a] to-[#e57373] text-[28px]">🏠</div>
                <div className="grid min-h-[90px] animate-[slideInCard_0.5s_ease_both] place-items-center rounded-xl border border-border bg-gradient-to-br from-[#ce93d8] to-[#ba68c8] text-[28px]">🛠️</div>
                <div className="grid min-h-[90px] animate-[slideInCard_0.5s_ease_both] place-items-center rounded-xl border border-border bg-gradient-to-br from-[#80deea] to-[#4dd0e1] text-[28px]">📸</div>
              </div>
            ) : (
              <div className="mt-3 grid gap-2 rounded-xl border border-border bg-bgAlt p-3 text-text">
                <div><strong>Chef de chantier:</strong> Alpha Kouyate</div>
                <div><strong>Derniere maj:</strong> Aujourd'hui 09:32</div>
                <div><strong>Equipe active:</strong> 8 ouvriers</div>
                <div><strong>Prochaine etape:</strong> Toiture (prevue sous 10 jours)</div>
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue" />
              <h3>Notifications recentes</h3>
            </div>
            <div className="flex items-center gap-2 border-b border-[#ebf1f9] py-2.5 text-text"><Badge tone="gold">Paiement</Badge> Nouvelle demande de paiement: 4 200 000 GNF</div>
            <div className="flex items-center gap-2 border-b border-[#ebf1f9] py-2.5 text-text"><Badge tone="blue">Photos</Badge> 3 nouvelles photos televersees aujourd'hui</div>
            <div className="flex items-center gap-2 py-2.5 text-text"><Badge tone="green">Etape</Badge> Etape Fondations validee</div>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
              <h3>Apercu messagerie chantier</h3>
            </div>
            {preview.map((item) => (
              <div key={item.id} className="flex items-center gap-2 border-b border-[#ebf1f9] py-2.5 text-text last:border-b-0">
                <Badge tone={item.author === "me" ? "blue" : "green"}>
                  {item.author === "me" ? "Moi" : "Agence"}
                </Badge>
                {item.text}
              </div>
            ))}
          </Card>

          <TrackingCard trackingNumber="BL-2025-0047" currentStep="Vol" />
        </div>
      </div>
    </section>
  );
}
