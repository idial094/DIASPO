"use client";

import { Badge, Card } from "@diaspo/ui";
import {
  useAdminNotifications,
  useMarkAdminNotificationsRead
} from "@diaspo/api";

export default function AdminNotificationsPage() {
  const { data, isLoading, error } = useAdminNotifications();
  const { markRead, markAllRead, isPending } = useMarkAdminNotificationsRead();

  return (
    <section className="grid gap-5">
      <header>
        <h2>Notifications</h2>
        <p className="mt-1 text-sm text-textMuted">Alertes systeme, paiements et suivi chantier.</p>
      </header>
      <div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={isPending}
          className="rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-2.5 py-2 font-bold text-white disabled:opacity-60"
        >
          Tout marquer lu
        </button>
      </div>
      <Card>
        {isLoading ? <p className="text-sm text-textMid">Chargement des notifications...</p> : null}
        {error ? (
          <p className="mb-2 rounded-xl border border-[#f2d7dc] bg-[#fff7f8] px-3 py-2 text-sm text-[#8c2130]">{error}</p>
        ) : null}
        {!isLoading && !error && data.length === 0 ? <p className="text-textMid">Aucune notification.</p> : null}
        {data.map((item) => (
          <div key={item.id} className="mb-2.5 flex justify-between gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 last:mb-0">
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <div className="grid justify-items-end gap-1.5">
              <Badge tone={item.level === "warning" ? "red" : "blue"}>{item.level === "warning" ? "Alerte" : "Info"}</Badge>
              {item.unread ? <Badge tone="gold">Non lue</Badge> : <Badge tone="green">Lue</Badge>}
              {item.unread ? (
                <button
                  type="button"
                  onClick={() => void markRead(item.id)}
                  disabled={isPending}
                  className="cursor-pointer rounded-lg border border-border bg-white px-2 py-1 font-bold text-textMid disabled:opacity-60"
                >
                  Marquer lue
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
