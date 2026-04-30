"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@diaspo/ui/src/components/Card";
import { InputField } from "@diaspo/ui/src/components/FormField";
import { fr, loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@diaspo/shared";
import { useAuthStore } from "@diaspo/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function PublicLoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "diaspora"
    }
  });
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "diaspora",
      name: "",
      location: ""
    }
  });
  const selectedLoginRole = loginForm.watch("role");
  const selectedRegisterRole = registerForm.watch("role");

  const persistSession = (body: {
    token: string;
    expiresIn: number;
    user: { id: string; email: string; role: "diaspora" | "agence"; name: string; location?: string };
  }) => {
    const expiresAt = Date.now() + body.expiresIn * 1000;
    document.cookie = `auth_token=${body.token}; Path=/; Max-Age=${body.expiresIn}; SameSite=Lax`;
    document.cookie = `auth_role=${body.user.role}; Path=/; Max-Age=${body.expiresIn}; SameSite=Lax`;
    document.cookie = `auth_session_expires_at=${expiresAt}; Path=/; Max-Age=${body.expiresIn}; SameSite=Lax`;
    login(body.user, body.token);
    router.push(body.user.role === "diaspora" ? "/diaspora/dashboard" : "/agence/projets");
  };

  const submitLogin = async (data: LoginFormData) => {
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

      persistSession(body);
    } catch {
      setServerError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
  };

  const submitRegister = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: data.role,
          name: data.name,
          location: data.location
        }),
      });

      if (!res.ok) {
        const body = await res.json() as { message?: string };
        setServerError(body.message ?? "Erreur de creation de compte");
        return;
      }

      const body = await res.json() as {
        token: string;
        expiresIn: number;
        user: { id: string; email: string; role: "diaspora" | "agence"; name: string; location?: string };
      };
      persistSession(body);
    } catch {
      setServerError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#355f9a_0,#1f3f73_28%,#1a3768_52%,#17325f_100%)] px-4 py-8 sm:p-6">
      <div className="absolute -left-[40px] -top-12 h-[220px] w-[220px] animate-[floatCircle_8s_ease-in-out_infinite] rounded-full bg-white/15 blur-[1px]" />
      <div className="absolute right-[-90px] top-[20%] h-[260px] w-[260px] animate-[floatCircle_8s_ease-in-out_infinite_1s] rounded-full bg-white/15 blur-[1px]" />
      <div className="absolute bottom-[-40px] left-[18%] h-[180px] w-[180px] animate-[floatCircle_8s_ease-in-out_infinite_2s] rounded-full bg-white/15 blur-[1px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

      <div className="z-[2] w-full max-w-[520px] animate-[slideInCard_0.6s_cubic-bezier(0.22,1,0.36,1)]">
        <div className="rounded-[28px] border border-white/35 bg-white/95 p-1 shadow-[0_24px_70px_rgba(8,22,49,0.45)] backdrop-blur-sm">
          <Card>
          <div className="mb-5 flex h-1.5 overflow-hidden rounded-full">
            <span className="flex-1 bg-red" />
            <span className="flex-1 bg-gold" />
            <span className="flex-1 bg-green" />
          </div>
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-[56px] w-[56px] place-items-center rounded-[18px] bg-gradient-to-br from-blue to-blue-mid text-2xl text-white shadow-[0_14px_30px_rgba(26,111,196,0.35)]">
              🌍
            </div>
            <div>
              <h1>{fr["app.name"]}</h1>
              <p className="text-xs text-textMid">Construire en Guinee, a distance</p>
            </div>
          </div>
          <div className="mb-4">
            <h2 className="font-sans text-[1.4rem] font-bold text-dark">
              {authMode === "login" ? "Connexion" : "Creer un compte"}
            </h2>
            <p className="text-[13px] text-textMid">{fr["auth.login.subtitle"]}</p>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-[14px] bg-[#f4f7fb] p-1">
            <button
              type="button"
              onClick={() => {
                setServerError(null);
                setAuthMode("login");
              }}
              className={`rounded-[10px] px-2 py-2 text-sm font-semibold transition-colors ${authMode === "login" ? "bg-white text-blue shadow-[0_4px_12px_rgba(15,23,42,0.08)]" : "text-textMid"}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setServerError(null);
                setAuthMode("register");
              }}
              className={`rounded-[10px] px-2 py-2 text-sm font-semibold transition-colors ${authMode === "register" ? "bg-white text-blue shadow-[0_4px_12px_rgba(15,23,42,0.08)]" : "text-textMid"}`}
            >
              Creer un compte
            </button>
          </div>
          <form
            className="mb-2.5 grid gap-2.5"
            onSubmit={
              authMode === "login"
                ? loginForm.handleSubmit(submitLogin)
                : registerForm.handleSubmit(submitRegister)
            }
          >
            {authMode === "login" ? (
              <>
                <InputField
                  type="email"
                  placeholder="Email"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register("email")}
                />
                <InputField
                  type="password"
                  placeholder="Mot de passe"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register("password")}
                />
                <input type="hidden" {...loginForm.register("role")} />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loginForm.setValue("role", "diaspora")}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${selectedLoginRole === "diaspora" ? "border-blue bg-[#EAF4FF] text-blue" : "border-border bg-bg text-textMid"}`}
                  >
                    🌍 Diaspora
                  </button>
                  <button
                    type="button"
                    onClick={() => loginForm.setValue("role", "agence")}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${selectedLoginRole === "agence" ? "border-blue bg-[#EAF4FF] text-blue" : "border-border bg-bg text-textMid"}`}
                  >
                    🏢 Agence
                  </button>
                </div>
              </>
            ) : (
              <>
                <InputField
                  type="text"
                  placeholder="Nom complet"
                  error={registerForm.formState.errors.name?.message}
                  {...registerForm.register("name")}
                />
                <InputField
                  type="email"
                  placeholder="Email"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register("email")}
                />
                <InputField
                  type="password"
                  placeholder="Mot de passe"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register("password")}
                />
                <InputField
                  type="text"
                  placeholder="Ville / Pays (optionnel)"
                  error={registerForm.formState.errors.location?.message}
                  {...registerForm.register("location")}
                />
                <input type="hidden" {...registerForm.register("role")} />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => registerForm.setValue("role", "diaspora")}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${selectedRegisterRole === "diaspora" ? "border-blue bg-[#EAF4FF] text-blue" : "border-border bg-bg text-textMid"}`}
                  >
                    🌍 Diaspora
                  </button>
                  <button
                    type="button"
                    onClick={() => registerForm.setValue("role", "agence")}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${selectedRegisterRole === "agence" ? "border-blue bg-[#EAF4FF] text-blue" : "border-border bg-bg text-textMid"}`}
                  >
                    🏢 Agence
                  </button>
                </div>
              </>
            )}
            {serverError ? (
              <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{serverError}</p>
            ) : null}
            <button
              type="submit"
              disabled={authMode === "login" ? loginForm.formState.isSubmitting : registerForm.formState.isSubmitting}
              className="mt-1 rounded-[12px] bg-gradient-to-br from-blue to-blue-mid px-4 py-2.5 font-bold text-white shadow-[0_14px_26px_rgba(26,111,196,0.35)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_30px_rgba(26,111,196,0.4)] disabled:opacity-70"
            >
              {(authMode === "login" ? loginForm.formState.isSubmitting : registerForm.formState.isSubmitting)
                ? authMode === "login" ? "Connexion..." : "Creation..."
                : authMode === "login" ? "Se connecter" : "Creer mon compte"}
            </button>
          </form>
          <small className="text-[12px] text-textMid">🔒 Connexion securisee</small>
          </Card>
        </div>
      </div>
    </main>
  );
}
