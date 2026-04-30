"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@diaspo/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@diaspo.app");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, totp: totp.trim() }),
      });

      if (!res.ok) {
        const body = await res.json() as { message?: string };
        setError(body.message ?? "Identifiants admin invalides.");
        setIsSubmitting(false);
        return;
      }

      const body = await res.json() as { token: string; expiresIn?: number };
      const maxAge = body.expiresIn ?? ADMIN_SESSION_MAX_AGE_SECONDS;
      const expiresAt = Date.now() + maxAge * 1000;

      document.cookie = `admin_token=${body.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `admin_session_expires_at=${expiresAt}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

      router.push("/admin/dashboard");
    } catch {
      setError("Impossible de contacter le serveur.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-dark via-[#1c3a6e] to-blue p-6">
      <div className="w-full max-w-[460px]">
        <Card>
          <h1>Connexion Admin</h1>
          <p>Accès réservé au back-office administrateur.</p>

          <div className="mt-3.5 grid gap-2">
            <input
              className="rounded-[10px] border border-border px-3 py-2.5 outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email admin"
            />
            <input
              className="rounded-[10px] border border-border px-3 py-2.5 outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
            />
            <input
              className="rounded-[10px] border border-border px-3 py-2.5 outline-none"
              type="text"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              placeholder="Code de vérification 2FA"
              maxLength={6}
              inputMode="numeric"
            />
            <button
              className="cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-60"
              type="button"
              onClick={submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </div>

          {error ? <p className="mt-2 text-sm font-semibold text-red">{error}</p> : null}
          <small className="mt-2 block text-textMuted">Entrez le code de vérification reçu dans votre application d'authentification.</small>
        </Card>
      </div>
    </main>
  );
}
