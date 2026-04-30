import "../global.css";
import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { setTokenProvider } from "@diaspo/api";
import { useAuthStore, getToken } from "@diaspo/store";
import { AppProviders } from "./providers";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// Register token provider once at module load time
setTokenProvider(getToken);

function AuthGuard() {
  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  // Rehydrate auth state from SecureStore on first mount
  useEffect(() => {
    async function hydrate() {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const user = await res.json() as {
              id: string; email: string; role: "diaspora" | "agence"; name: string; location?: string;
            };
            login(user, token);
          } else {
            // Token expired or invalid — clear it
            await SecureStore.deleteItemAsync("auth_token");
          }
        }
      } catch {
        // Network unavailable — stay unauthenticated
      } finally {
        setIsReady(true);
      }
    }
    void hydrate();
  }, [login]);

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isReady) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuth) {
      const role = useAuthStore.getState().user?.role;
      router.replace(role === "agence" ? "/(agence)/projets" : "/(diaspora)/");
    }
  }, [isReady, isAuthenticated, segments, router]);

  if (!isReady) return null;
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGuard />
    </AppProviders>
  );
}
