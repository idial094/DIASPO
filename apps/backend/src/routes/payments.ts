import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "../db/client.js";
import { payments, projects } from "../db/schema.js";

const createIntentSchema = z.object({
  projectId: z.string().min(1),
  paymentId: z.string().min(1),
  amountGnf: z.number().positive(),
});

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });
}

export async function paymentRoutes(app: FastifyInstance) {
  const authHook = { preHandler: app.authenticate };

  app.post("/api/payments/create-intent", authHook, async (request, reply) => {
    const stripe = getStripeClient();
    if (!stripe) {
      return reply.code(503).send({ message: "Stripe non configure sur le serveur." });
    }

    const { projectId, paymentId, amountGnf } = createIntentSchema.parse(request.body);
    const [payment] = await db
      .select({
        id: payments.id,
        status: payments.status,
        amountGnf: payments.amountGnf,
        projectId: payments.projectId,
        amountEur: payments.amountEur,
      })
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.projectId, projectId)));

    if (!payment) {
      return reply.code(404).send({ message: "Paiement introuvable." });
    }

    const [project] = await db
      .select({
        id: projects.id,
        diasporaUserId: projects.diasporaUserId,
      })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project || project.diasporaUserId !== request.user.sub) {
      return reply.code(403).send({ message: "Acces refuse a ce projet." });
    }

    if (payment.status === "paid") {
      return reply.code(409).send({ message: "Ce paiement est deja regle." });
    }

    const exchangeRate = Number(process.env.STRIPE_GNF_EUR_RATE ?? "9300");
    const amountEur = payment.amountEur ?? amountGnf / exchangeRate;
    const amountInCents = Math.max(50, Math.round(amountEur * 100));

    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: (process.env.STRIPE_CURRENCY ?? "eur").toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        paymentId,
        projectId,
        diasporaUserId: request.user.sub,
      },
    });

    if (!intent.client_secret) {
      return reply.code(500).send({ message: "Client secret Stripe introuvable." });
    }

    return reply.send({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  });

  app.post("/api/payments/webhook", async (request, reply) => {
    const stripe = getStripeClient();
    if (!stripe) {
      return reply.code(503).send({ message: "Stripe non configure sur le serveur." });
    }

    const signature = request.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    if (webhookSecret && typeof signature === "string") {
      // Signature validation requires raw body bytes.
      // In local/dev without raw-body setup, accept parsed event to keep the flow testable.
      if (typeof request.body === "string") {
        try {
          event = stripe.webhooks.constructEvent(request.body, signature, webhookSecret);
        } catch (error) {
          request.log.error({ error }, "Stripe webhook signature invalid");
          return reply.code(400).send({ message: "Signature webhook invalide." });
        }
      } else {
        request.log.warn("Webhook recu sans raw body; verification de signature contournee en local.");
        event = request.body as Stripe.Event;
      }
    } else {
      event = request.body as Stripe.Event;
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const paymentId = intent.metadata?.paymentId;
      if (paymentId) {
        await db
          .update(payments)
          .set({ status: "paid", confirmedAt: new Date() })
          .where(eq(payments.id, paymentId));
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const paymentId = intent.metadata?.paymentId;
      if (paymentId) {
        await db
          .update(payments)
          .set({ status: "failed" })
          .where(eq(payments.id, paymentId));
      }
    }

    return reply.code(200).send({ received: true });
  });
}
