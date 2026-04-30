import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useAuthStore } from "@diaspo/store";

const queryClient = new QueryClient();

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken(authToken: string) {
  if (Platform.OS === "web") return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const expoPushToken = tokenData.data;

  try {
    await fetch(`${API_BASE}/api/notifications/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: expoPushToken, platform: "expo" }),
    });
  } catch {
    // Non-blocking: notifications are best-effort
  }
}

function PushNotificationSetup() {
  const token = useAuthStore((state) => state.token);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (token) {
      void registerPushToken(token);
    }
  }, [token]);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification received in foreground — no-op (alert shown by handler above)
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // TODO: navigate to relevant screen based on _response.notification.request.content.data
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider publishableKey={publishableKey}>
        <>
          <PushNotificationSetup />
          {children}
        </>
      </StripeProvider>
    </QueryClientProvider>
  );
}
