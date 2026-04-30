"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { setTokenProvider } from "@diaspo/api";
import { useAuthStore, getToken } from "@diaspo/store";
import { getQueryClient } from "../lib/queryClient";

// Register the token provider once, at module load time.
// getToken() reads from the Zustand store without subscribing.
setTokenProvider(getToken);

function parseCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

async function enableMocking() {
  const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === "true";
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled" || useRealApi) {
    return;
  }

  const { setupWorker } = await import("msw/browser");
  const { handlers } = await import("@diaspo/api");
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledRequest: "bypass" });
}

/** Rehydrate auth store from the cookie set at login. */
function useHydrateAuth() {
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) return;
    const token = parseCookie("auth_token");
    const role = parseCookie("auth_role") as "diaspora" | "agence" | null;
    if (!token || !role) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (user) {
          login(user as Parameters<typeof login>[0], token);
        }
      })
      .catch(() => { /* silently ignore — user will be prompted to log in */ });
  }, [isAuthenticated, login]);
}

function AuthHydrator() {
  useHydrateAuth();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  useEffect(() => {
    void enableMocking();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
    </QueryClientProvider>
  );
}
