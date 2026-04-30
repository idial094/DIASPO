import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface JwtPayload {
  sub: string;
  email: string;
  role: "diaspora" | "agence" | "admin";
}

// Tell @fastify/jwt which payload shape to expect
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

// Augment FastifyInstance with helper decorators
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function plugin(app: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is required");

  await app.register(fastifyJwt, {
    secret,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? "8h" },
  });

  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({ message: "Token invalide ou expiré" });
      }
    }
  );

  app.decorate(
    "requireAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
        if (request.user.role !== "admin") {
          reply.code(403).send({ message: "Accès refusé" });
        }
      } catch {
        reply.code(401).send({ message: "Token invalide ou expiré" });
      }
    }
  );
}

export const jwtPlugin = fp(plugin);
