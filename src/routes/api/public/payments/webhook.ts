import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { markOrderPaid } from "@/lib/payments.server";

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed":
    case "transaction.completed": {
      const orderId = obj?.metadata?.orderId;
      const ref = obj?.payment_intent ?? obj?.id;
      if (orderId) await markOrderPaid(orderId, "stripe", String(ref ?? ""), obj?.amount_total, obj?.currency);
      break;
    }
    case "payment_intent.succeeded": {
      const orderId = obj?.metadata?.orderId;
      if (orderId) await markOrderPaid(orderId, "stripe", String(obj?.id ?? ""), obj?.amount_received, obj?.currency);
      break;
    }
    default:
      console.log("[stripe webhook] unhandled:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handle(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[stripe webhook] error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
