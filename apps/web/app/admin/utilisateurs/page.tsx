"use client";

import { useMemo, useState } from "react";
import { Badge, Card } from "@diaspo/ui";
import { InputField, SelectField } from "@diaspo/ui/src/components/FormField";
import { useAdminUsers, useUpdateAdminUserStatus } from "@diaspo/api";

export default function AdminUtilisateursPage() {
  const { data, isLoading, error } = useAdminUsers();
  const { updateStatus, isPending } = useUpdateAdminUserStatus();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "diaspora" | "agence">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchRole = roleFilter === "all" ? true : item.role === roleFilter;
      const matchStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        q.length === 0 ||
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      return matchRole && matchStatus && matchSearch;
    });
  }, [data, roleFilter, search, statusFilter]);

  return (
    <section className="grid gap-5">
      <header>
        <h2>Utilisateurs</h2>
        <p className="mt-1 text-sm text-textMuted">Gestion des comptes diaspora et agence.</p>
      </header>
      <div className="grid gap-2 min-[901px]:grid-cols-[2fr_1fr_1fr]">
        <InputField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher nom ou localisation..."
        />
        <SelectField
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "diaspora" | "agence")}
          options={[
            { value: "all", label: "Tous roles" },
            { value: "diaspora", label: "Diaspora" },
            { value: "agence", label: "Agence" }
          ]}
        />
        <SelectField
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          options={[
            { value: "all", label: "Tous statuts" },
            { value: "active", label: "Actif" },
            { value: "inactive", label: "Inactif" }
          ]}
        />
      </div>
      <Card>
        {isLoading ? <p className="text-sm text-textMid">Chargement des utilisateurs...</p> : null}
        {error ? (
          <p className="mb-2 rounded-xl border border-[#f2d7dc] bg-[#fff7f8] px-3 py-2 text-sm text-[#8c2130]">{error}</p>
        ) : null}
        {!isLoading && !error && filtered.length === 0 ? <p className="text-textMid">Aucun utilisateur selon les filtres.</p> : null}
        {filtered.map((item) => (
          <div key={item.id} className="mb-2.5 flex justify-between rounded-xl border border-border bg-bg px-3 py-2.5 last:mb-0">
            <div>
              <strong>{item.name}</strong>
              <p>{item.location} · {new Date(item.lastLogin).toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="grid justify-items-end gap-1.5">
              <Badge tone="blue">{item.role === "diaspora" ? "Diaspora" : "Agence"}</Badge>
              <Badge tone={item.status === "active" ? "green" : "red"}>{item.status === "active" ? "Actif" : "Inactif"}</Badge>
              <button
                type="button"
                onClick={() =>
                  void updateStatus({
                    id: item.id,
                    status: item.status === "active" ? "inactive" : "active"
                  })
                }
                disabled={isPending}
                className="cursor-pointer rounded-lg border border-border bg-white px-2 py-1 font-bold text-text"
              >
                {item.status === "active" ? "Desactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
