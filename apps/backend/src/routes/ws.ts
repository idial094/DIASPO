import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import { z } from "zod";
import { db } from "../db/client.js";
import { messages } from "../db/schema.js";

// projectId → Set of WebSocket connections
const rooms = new Map<string, Set<WebSocket>>();

function broadcast(projectId: string, payload: unknown, exclude?: WebSocket) {
  const room = rooms.get(projectId);
  if (!room) return;
  const data = JSON.stringify(payload);
  for (const ws of room) {
    if (ws !== exclude && ws.readyState === 1 /* OPEN */) {
      ws.send(data);
    }
  }
}

export async function wsRoutes(app: FastifyInstance) {
  /**
   * WS /ws/messages/:projectId
   * Clients send: { text: string }
   * Server broadcasts: { id, projectId, author, text, timestamp }
   */
  app.get(
    "/ws/messages/:projectId",
    { websocket: true },
    async (socket, request) => {
      // Authenticate via token in query string: ?token=<jwt>
      const query = z.object({ token: z.string().optional() }).parse(request.query);
      let userId: string;
      let userRole: string;

      try {
        const decoded = app.jwt.verify<{ sub: string; role: string }>(query.token ?? "");
        userId = decoded.sub;
        userRole = decoded.role;
      } catch {
        socket.close(4001, "Unauthorized");
        return;
      }

      const { projectId } = z.object({ projectId: z.string() }).parse(request.params);

      if (!rooms.has(projectId)) rooms.set(projectId, new Set());
      rooms.get(projectId)!.add(socket);

      socket.on("message", async (raw: Buffer | string) => {
        let parsed: { text?: string };
        try {
          parsed = JSON.parse(raw.toString()) as { text?: string };
        } catch {
          return;
        }

        const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
        if (!text) return;

        const rows = await db
          .insert(messages)
          .values({
            projectId,
            authorId: userId,
            authorRole: userRole as "diaspora" | "agence",
            text,
          })
          .returning();

        const inserted = rows[0];
        if (!inserted) return;

        const outgoing = {
          id: String(inserted.id),
          projectId,
          author: userRole === "agence" ? "agency" : "me",
          text: inserted.text,
          timestamp: new Intl.DateTimeFormat("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(inserted.createdAt),
        };

        // Send back to sender (with author = "me") then broadcast as "agency"/"client"
        socket.send(JSON.stringify(outgoing));
        broadcast(projectId, { ...outgoing, author: userRole === "agence" ? "agency" : "client" }, socket);
      });

      socket.on("close", () => {
        rooms.get(projectId)?.delete(socket);
        if (rooms.get(projectId)?.size === 0) rooms.delete(projectId);
      });
    }
  );
}
