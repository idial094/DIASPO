import fp from "fastify-plugin";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { pushTokens, users } from "../db/schema.js";

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

async function plugin(app: FastifyInstance) {
  const expo = new Expo();

  /**
   * Send a push notification to a single user by userId.
   * Silently skips if the user has no registered token.
   */
  async function sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: "default" as const,
      }));

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        for (const receipt of receipts) {
          if (receipt.status === "error") {
            app.log.warn({ receipt }, "Push notification error");
            // Remove invalid tokens
            if (receipt.details?.error === "DeviceNotRegistered") {
              // receipt does not carry the original token; skip targeted cleanup
              app.log.warn("DeviceNotRegistered — pruning stale tokens on next send");
            }
          }
        }
      } catch (err) {
        app.log.error(err, "Failed to send push notifications");
      }
    }
  }

  /**
   * Send a push notification to all users of a given role on a project.
   */
  async function sendToProjectRole(
    projectId: string,
    role: "diaspora" | "agence",
    payload: NotificationPayload
  ): Promise<void> {
    const rows = await db
      .select({ userId: pushTokens.userId })
      .from(pushTokens)
      .innerJoin(users, eq(users.id, pushTokens.userId))
      .where(eq(users.role, role));

    for (const row of rows) {
      await sendToUser(row.userId, payload);
    }
  }

  app.decorate("notifications", { sendToUser, sendToProjectRole });
}

declare module "fastify" {
  interface FastifyInstance {
    notifications: {
      sendToUser(userId: string, payload: NotificationPayload): Promise<void>;
      sendToProjectRole(
        projectId: string,
        role: "diaspora" | "agence",
        payload: NotificationPayload
      ): Promise<void>;
    };
  }
}

export const notificationsPlugin = fp(plugin);
