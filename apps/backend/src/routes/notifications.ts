import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { pushTokens } from "../db/schema.js";

const registerTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["expo", "apns", "fcm"]).default("expo"),
});

export async function notificationsRoutes(app: FastifyInstance) {
  const authHook = { preHandler: app.authenticate };

  // Register or update a push token for the authenticated user
  app.post("/api/notifications/register", authHook, async (request, reply) => {
    const payload = registerTokenSchema.parse(request.body);
    const userId = request.user.sub;

    // Upsert: if same token exists for this user, update; otherwise insert
    const existing = await db
      .select()
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, payload.token)));

    if (existing.length > 0) {
      await db
        .update(pushTokens)
        .set({ updatedAt: new Date() })
        .where(eq(pushTokens.id, existing[0]!.id));
    } else {
      await db.insert(pushTokens).values({
        userId,
        token: payload.token,
        platform: payload.platform,
      });
    }

    return reply.code(204).send();
  });

  // Unregister a token (on logout)
  app.delete("/api/notifications/register", authHook, async (request, reply) => {
    const { token } = z.object({ token: z.string() }).parse(request.body);
    await db
      .delete(pushTokens)
      .where(and(eq(pushTokens.userId, request.user.sub), eq(pushTokens.token, token)));
    return reply.code(204).send();
  });
}
