"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@diaspo/ui/src/components/Card";
import { InputField } from "@diaspo/ui/src/components/FormField";
import { fr, loginSchema, type LoginFormData } from "@diaspo/shared";
import { useAuthStore } from "@diaspo/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function PublicLoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "mariam@example.com",
      password: "motdepasse123",
      role: "diaspora"
    }
  });
  const selectedRole = watch("role");

  const submit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, role: data.role }),
      });

      if (!res.ok) {
        const body = await res.json() as { message?: string };
        setServerError(body.message ?? "Erreur de connexion");
        return;
      }

      const body = await res.json() as {
        token: string;
        expiresIn: number;
        user: { id: string; email: string; role: "diaspora" | "agence"; name: string; location?: string };
      };

      // Persist token in cookies for SSR middleware + store for client-side use
      const expiresAt = Date.now() + body.expiresIn * 1000;
      document.cookie = `auth_token=${body.token}; Path=/; Max-Age=${body.expiresIn}; SameSite=Lax`;
      document.cookie = `auth_role=${body.user.role}; Path=/; Max-Age=${body.expiresIn}; SameSite=Lax`;
      document.cookie = `auth_session_expires_at=${expiresAt}; Path=/; Max-Age=${body.expiresIn}; SameSite=Lax`;

      login(body.user, body.token);
      router.push(body.user.role === "diaspora" ? "/diaspora/dashboard" : "/agence/projets");
    } catch {
      setServerError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-dark via-[#1c3a6e] to-blue p-6">
      <div className="absolute -left-[30px] -top-10 h-[180px] w-[180px] animate-[floatCircle_8s_ease-in-out_infinite] rounded-full bg-white/15" />
      <div className="absolute right-[-70px] top-[22%] h-[220px] w-[220px] animate-[floatCircle_8s_ease-in-out_infinite_1s] rounded-full bg-white/15" />
      <div className="absolute bottom-[-30px] left-[20%] h-[160px] w-[160px] animate-[floatCircle_8s_ease-in-out_infinite_2s] rounded-full bg-white/15" />

      <div className="z-[2] w-full max-w-[480px] animate-[slideInCard_0.6s_cubic-bezier(0.22,1,0.36,1)]">
        <Card>
          <div className="mb-4 flex h-1 overflow-hidden rounded-sm">
            <span className="flex-1 bg-red" />
            <span className="flex-1 bg-gold" />
            <span className="flex-1 bg-green" />
          </div>
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-gradient-to-br from-blue to-blue-mid text-2xl text-white shadow-[0_8px_24px_rgba(26,111,196,0.3)]">
              🌍
            </div>
            <div>
              <h1>{fr["app.name"]}</h1>
              <p className="text-xs text-textMid">Construire en Guinee, a distance</p>
            </div>
          </div>
          <div className="mb-4">
            <h2 className="font-sans text-[1.4rem] font-bold text-dark">Connexion</h2>
            <p>{fr["auth.login.subtitle"]}</p>
          </div>
          <form className="mb-2.5 grid gap-2.5" onSubmit={handleSubmit(submit)}>
            <InputField type="email" placeholder="Email" error={errors.email?.message} {...register("email")} />
            <InputField type="password" placeholder="Mot de passe" error={errors.password?.message} {...register("password")} />
            <input type="hidden" {...register("role")} />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue("role", "diaspora")}
                className={`rounded-xl border px-2 py-2 text-sm font-semibold ${selectedRole === "diaspora" ? "border-blue bg-[#EAF4FF] text-blue" : "border-border bg-bg text-textMid"}`}
              >
                🌍 Diaspora
              </button>
              <button
                type="button"
                onClick={() => setValue("role", "agence")}
                className={`rounded-xl border px-2 py-2 text-sm font-semibold ${selectedRole === "agence" ? "border-blue bg-[#EAF4FF] text-blue" : "border-border bg-bg text-textMid"}`}
              >
                🏢 Agence
              </button>
            </div>
            {serverError ? (
              <p className="text-sm font-semibold text-red-600">{serverError}</p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-btn bg-gradient-to-br from-blue to-blue-mid px-4 py-2.5 font-bold text-white"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <small>🔒 Connexion sécurisée</small>
        </Card>
      </div>
    </main>
  );
}
