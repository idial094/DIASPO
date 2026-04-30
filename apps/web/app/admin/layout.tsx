"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AdminNavItem {
  href: string;
  icon: string;
  label: string;
  badge?: string;
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const navGroups: AdminNavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/admin/dashboard", icon: "📊", label: "Tableau de bord" },
      { href: "/admin/projets", icon: "🏗️", label: "Tous les projets" },
      { href: "/admin/finances", icon: "💰", label: "Finances" },
      { href: "/admin/colis", icon: "📦", label: "Colis & Transferts" }
    ]
  },
  {
    label: "Destination",
    items: [
      { href: "/admin/utilisateurs", icon: "👥", label: "Utilisateurs", badge: "24" },
      { href: "/admin/notifications", icon: "🔔", label: "Notifications", badge: "2" }
    ]
  },
  {
    label: "Systeme",
    items: [
      { href: "/admin/exports", icon: "📤", label: "Exports CSV/PDF" },
      { href: "/admin/securite", icon: "🔒", label: "Securite & 2FA" }
    ]
  }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    document.cookie = "admin_token=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "admin_session_expires_at=; Path=/; Max-Age=0; SameSite=Lax";
    router.push("/admin/login");
  };

  return (
    <main className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-5 p-5 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-border bg-white p-3.5 shadow-card lg:sticky lg:top-4">
        <h1 className="mb-2 text-[25px]">Back-office Admin</h1>
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2.5">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-textMuted">{group.label}</p>
            <nav className="grid gap-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold no-underline transition-colors ${
                      isActive ? "bg-blue-pale text-blue" : "text-textMid hover:bg-bg"
                    }`}
                  >
                    <span className="text-[15px]">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-red px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 w-full cursor-pointer rounded-[10px] border border-[#f0ccd2] bg-[#fff7f8] px-2.5 py-2 text-sm font-bold text-[#7e1422]"
          onClick={logout}
        >
          Deconnexion
        </button>
      </aside>
      <section className="grid gap-5">{children}</section>
    </main>
  );
}
