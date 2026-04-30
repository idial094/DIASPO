"use client";

import { type FormEvent, useState } from "react";
import { AlertBanner, Badge, Card, ProgressBar, StatCard, TrackingCard } from "@diaspo/ui";
import { useProjectMessages, useProjectSummary, useMyProjects, useCreateProject } from "@diaspo/api";

// ─── Empty state — no project yet ────────────────────────────────────────────

function NoProjectState() {
  const { createProject, isPending, error } = useCreateProject();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !location.trim()) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }
    try {
      await createProject({ title: title.trim(), location: location.trim() });
      setIsOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la création.");
    }
  };

  return (
    <section className="grid gap-5">
      <header>
        <h2>Tableau de bord</h2>
        <p className="mt-1 text-sm text-textMuted">Bienvenue sur Diaspo App</p>
      </header>

      <Card>
        <div className="grid place-items-center gap-4 py-10 text-center">
          <div className="text-5xl">🏗️</div>
          <div>
            <h3 className="text-xl font-bold text-dark">Aucun projet pour le moment</h3>
            <p className="mt-1 text-sm text-textMid">
              Créez votre premier projet de construction pour commencer le suivi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-[12px] bg-gradient-to-br from-blue to-blue-mid px-5 py-2.5 font-bold text-white shadow-[0_8px_20px_rgba(26,111,196,0.3)]"
          >
            + Créer mon premier projet
          </button>
        </div>
      </Card>

      {isOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(14,27,46,0.45)] p-4">
          <div className="w-full max-w-[460px] rounded-[20px] border border-border bg-white p-[22px]">
            <h3 className="mb-1 font-bold">Nouveau projet</h3>
            <p className="mb-4 text-sm text-textMid">Renseignez les informations de base. L&apos;agence sera assignée ultérieurement.</p>
            <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-textMid">Nom du projet *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Villa Ratoma, Maison Dixinn..."
                  className="rounded-[10px] border border-border px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-textMid">Localisation (Guinée) *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Ratoma, Conakry"
                  className="rounded-[10px] border border-border px-3 py-2.5 text-sm outline-none focus:border-blue"
                />
              </div>
              {(error ?? formError) ? (
                <p className="text-sm text-[#8c2130]">{error ?? formError}</p>
              ) : null}
              <div className="mt-1 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setFormError(null); }}
                  disabled={isPending}
                  className="flex-1 rounded-[10px] border border-border bg-white px-3 py-2.5 font-bold text-textMid"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-[10px] bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-60"
                >
                  {isPending ? "Création..." : "Créer le projet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ─── Dashboard with real project data ────────────────────────────────────────

function ProjectDashboard({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useProjectSummary(projectId);
  const { data: messages } = useProjectMessages(projectId);
  const preview = messages.slice(-3);
  const [galleryTab, setGalleryTab] = useState<"photos" | "details">("photos");

  return (
    <section className="grid gap-[18px]">
      <header>
        <h2>Tableau de bord</h2>
        <p className="mt-1 text-sm text-textMuted">Vue globale de votre chantier</p>
      </header>

      <div className="animate-[pulseAlert_3s_ease-in-out_infinite]">
        <AlertBanner
          title="Paiement en attente"
          description="Une demande de paiement est en attente de validation."
          actionLabel="Voir les paiements"
        />
      </div>

      <div className="grid items-start gap-4 min-[1041px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <StatCard label="Avancement global" value={data ? `${data.progress}%` : "—"} trend="Chantier en cours" tone="blue" />
            <StatCard label="Statut" value={data?.status ?? "—"} trend={data?.stage ?? ""} tone="green" />
          </div>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue" />
              <h3>Projet en cours</h3>
            </div>
            {isLoading ? <p className="text-sm text-textMid">Chargement du projet...</p> : null}
            {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
            {data ? (
              <>
                <p className="font-semibold text-dark">{data.title}</p>
                <p className="mt-0.5 text-sm text-textMid">Client : {data.client}</p>
                <p className="mt-0.5 text-sm text-textMid">
                  Statut : <Badge tone="blue">{data.status}</Badge>
                </p>
                <div className="mt-3">
                  <ProgressBar value={data.progress} />
                </div>
              </>
            ) : null}
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
              <h3>Aperçu messagerie chantier</h3>
            </div>
            {preview.length === 0 ? (
              <p className="text-sm text-textMid">Aucun message pour le moment.</p>
            ) : null}
            {preview.map((item) => (
              <div key={item.id} className="flex items-center gap-2 border-b border-[#ebf1f9] py-2.5 text-text last:border-b-0">
                <Badge tone={item.author === "me" ? "blue" : "green"}>
                  {item.author === "me" ? "Moi" : "Agence"}
                </Badge>
                {item.text}
              </div>
            ))}
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
                Détails
              </button>
            </div>
            {galleryTab === "photos" ? (
              <div className="mt-2.5 grid gap-2.5 [grid-template-columns:repeat(3,minmax(0,1fr))]">
                {(["🏗️","🧱","🚧","🏠","🛠️","📸"] as const).map((icon) => (
                  <div key={icon} className="grid min-h-[90px] place-items-center rounded-xl border border-border bg-bgAlt text-[28px]">{icon}</div>
                ))}
              </div>
            ) : (
              <div className="mt-3 grid gap-2 rounded-xl border border-border bg-bgAlt p-3 text-text">
                <div><strong>Dernière mise à jour :</strong> Aujourd&apos;hui</div>
                <div><strong>Étape actuelle :</strong> {data?.stage ?? "—"}</div>
              </div>
            )}
          </Card>

          <TrackingCard trackingNumber="—" currentStep="Aucun colis" />
        </div>
      </div>
    </section>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export default function DiasporaDashboardPage() {
  const { data: myProjects, isLoading } = useMyProjects();

  if (isLoading) {
    return (
      <section className="grid gap-5">
        <header>
          <h2>Tableau de bord</h2>
        </header>
        <p className="text-sm text-textMid">Chargement...</p>
      </section>
    );
  }

  if (myProjects.length === 0) {
    return <NoProjectState />;
  }

  const firstProject = myProjects[0];
  if (!firstProject) return <NoProjectState />;
  return <ProjectDashboard projectId={firstProject.id} />;
}
