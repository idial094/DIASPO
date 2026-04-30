import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { ZodError } from "zod";
import { jwtPlugin } from "./plugins/jwt.js";
import { cloudinaryPlugin } from "./plugins/cloudinary.js";
import { notificationsPlugin } from "./plugins/notifications.js";
import { agenceRoutes } from "./routes/agence.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { diasporaRoutes } from "./routes/diaspora.js";
import { healthRoutes } from "./routes/health.js";
import { notificationsRoutes } from "./routes/notifications.js";
import { paymentRoutes } from "./routes/payments.js";
import { uploadsRoutes } from "./routes/uploads.js";
import { wsRoutes } from "./routes/ws.js";

const app = Fastify({ logger: true });

// CORS — restrict to configured origin in production
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  credentials: true,
});

// Multipart (file uploads) — must be before upload routes
await app.register(multipart, { attachFieldsToBody: false });

// WebSocket support
await app.register(websocket);

// JWT plugin (must be registered before routes that use authenticate)
await app.register(jwtPlugin);

// Feature plugins
await app.register(cloudinaryPlugin);
await app.register(notificationsPlugin);

// Routes
await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(paymentRoutes);
await app.register(diasporaRoutes);
await app.register(agenceRoutes);
await app.register(adminRoutes);
await app.register(uploadsRoutes);
await app.register(notificationsRoutes);
await app.register(wsRoutes);

// Global error handler
app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    reply.code(400).send({
      message: "Validation error",
      issues: error.issues,
    });
    return;
  }

  app.log.error(error);
  reply.code(500).send({ message: "Internal server error" });
});

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const host = process.env.HOST ?? "0.0.0.0";

app.listen({ port, host }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
