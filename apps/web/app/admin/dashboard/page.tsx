"use client";

import { Card, StatCard } from "@diaspo/ui";
import { useAdminDashboard } from "@diaspo/api";

const recentUsers = [
  {
    initials: "MK",
    name: "Mariam Kouyate",
    meta: "Diaspora - Paris, France - Projet actif",
    badge: "Actif",
    badgeClass: "bg-[#E9F8EF] text-green border border-green/20",
    avatarClass: "bg-[linear-gradient(135deg,#1A6FC4,#4CA3FF)] text-white"
  },
  {
    initials: "ID",
    name: "Ibrahima Diallo",
    meta: "Diaspora - Lyon, France - Livraison imminente",
    badge: "Actif",
    badgeClass: "bg-[#E9F8EF] text-green border border-green/20",
    avatarClass: "bg-[linear-gradient(135deg,#0891B2,#22D3EE)] text-white"
  },
  {
    initials: "AB",
    name: "Aissatou Barry",
    meta: "Diaspora - Montreal, Canada - Retard signale",
    badge: "Alerte",
    badgeClass: "bg-[#FFF1F3] text-red border border-red/20",
    avatarClass: "bg-[linear-gradient(135deg,#D97706,#FCD34D)] text-[#2E2500]"
  },
  {
    initials: "AK",
    name: "Alpha Kouyate",
    meta: "Chef de chantier - Agence Conakry",
    badge: "Agent",
    badgeClass: "bg-[#EAF4FF] text-blue border border-blue/20",
    avatarClass: "bg-[linear-gradient(135deg,#1B7A45,#4BAF72)] text-white"
  }
];

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();
  const dashboardData = data ?? {
    kpis: { activeProjects: 7, clients: 24, satisfaction: 89, alerts: 2 },
    monthlyPaymentsM: [5.2, 7.1, 5.8, 9.4, 8.1, 12.6],
    alerts: ["Retard - Aissatou Barry", "Paiement en suspens", "Document manquant"]
  };
  const months = ["Oct", "Nov", "Dec", "Jan", "Fev", "Mars"];

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Dashboard admin</h2>
          <p className="mt-1 text-sm text-textMuted">Vue globale - Mars 2025</p>
        </div>
      </header>
      {isLoading ? <p className="text-sm text-textMid">Chargement du tableau de bord...</p> : null}
      {error ? (
        <p className="rounded-xl border border-[#f2d7dc] bg-[#fff7f8] px-3 py-2 text-sm text-[#8c2130]">
          {error} Affichage des donnees de demonstration.
        </p>
      ) : null}
      <>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <StatCard label="Projets actifs" value={String(dashboardData.kpis.activeProjects)} />
            <StatCard label="Clients inscrits" value={String(dashboardData.kpis.clients)} />
            <StatCard label="Satisfaction" value={`${dashboardData.kpis.satisfaction}%`} tone="green" />
            <StatCard label="Alertes retard" value={String(dashboardData.kpis.alerts)} tone="red" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue" />
                <h3>Paiements recus (GNF M)</h3>
              </div>
              <div className="mt-1 flex min-h-[136px] items-end gap-2">
                {dashboardData.monthlyPaymentsM.map((value, idx) => (
                  <div key={`${value}-${idx}`} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="relative w-full max-w-[38px] rounded-t-md bg-[linear-gradient(180deg,#1A6FC4,#EAF4FF)]"
                      style={{ height: `${value * 10}px` }}
                      title={`${value}M`}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue">
                        {value}M
                      </span>
                    </div>
                    <span className="text-[11px] text-textMuted">{months[idx] ?? `M${idx + 1}`}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red" />
                <h3>Alertes actives</h3>
              </div>
              <div className="grid gap-2.5">
                {dashboardData.alerts.map((alert, idx) => (
                  <article
                    key={alert}
                    className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5 transition-colors hover:bg-[#e7f2ff]"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff1f3] text-sm">
                      {idx === 0 ? "🚨" : "⚠️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">{alert}</p>
                      <p className="text-xs text-textMuted">
                        {idx === 0 ? "Suivi chantier requis" : "Relance paiement conseillee"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-[10px] border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-textMid"
                    >
                      {idx === 0 ? "Contacter" : idx === 1 ? "Relancer" : "Resoudre"}
                    </button>
                  </article>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
              <h3>Utilisateurs recents</h3>
            </div>
            <div className="grid gap-2.5">
              {recentUsers.map((user) => (
                <article
                  key={user.name}
                  className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5 transition-colors hover:bg-[#e7f2ff]"
                >
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${user.avatarClass}`}>
                    {user.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{user.name}</p>
                    <p className="truncate text-xs text-textMuted">{user.meta}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${user.badgeClass}`}>{user.badge}</span>
                </article>
              ))}
            </div>
          </Card>
      </>
    </section>
  );
}
