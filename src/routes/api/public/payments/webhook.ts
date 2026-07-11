import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) {
    _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _sb;
}

async function markOrderPaid(orderId: string, paymentRef: string) {
  await sb()
    .from("orders")
    .update({
      status: "paid",
      payment_method: "stripe",
      payment_reference: paymentRef,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending_payment");
}

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed":
    case "transaction.completed": {
      const orderId = obj?.metadata?.orderId;
      const ref = obj?.payment_intent ?? obj?.id;
      if (orderId) await markOrderPaid(orderId, String(ref ?? ""));
      break;
    }
    case "payment_intent.succeeded": {
      const orderId = obj?.metadata?.orderId;
      if (orderId) await markOrderPaid(orderId, String(obj?.id ?? ""));
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
