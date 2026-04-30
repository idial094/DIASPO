"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/agence/projets", label: "Projets", icon: "🏗️" },
  { href: "/agence/chantier", label: "Chantier", icon: "🧱" },
  { href: "/agence/paiements", label: "Paiements", icon: "💰" },
  { href: "/agence/colis", label: "Colis", icon: "📦" },
  { href: "/agence/messages", label: "Messages", icon: "💬" },
];

export default function AgenceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "auth_session_expires_at=; Path=/; Max-Age=0; SameSite=Lax";
    router.push("/login");
  };

  return (
    <>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue to-blue-mid text-white">🏗️</div>
            <strong className="text-[18px]">Diaspo App</strong>
          </div>
          <nav className="hidden items-center gap-1 rounded-xl border border-border bg-bgAlt p-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold no-underline transition-colors ${
                    isActive ? "bg-blue text-white" : "text-textMid hover:bg-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E9F8EF] text-[11px] font-bold text-green">AK</span>
            <span className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-text">Alpha K.</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-textMid"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1320px] px-4 py-5 pb-24 md:pb-5">
        <section className="grid gap-5">{children}</section>
      </div>

      {/* Bottom nav (mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-border bg-white md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 no-underline transition-colors ${
                isActive ? "text-green" : "text-textMuted"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
