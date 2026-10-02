import { createFileRoute } from "@tanstack/react-router";
import { syncPayment, verifySignature } from "@/lib/mercadopago.server";

// Webhook Mercado Pago: só usa o id do aviso e consulta o pagamento na API antes de marcar pago
export const Route = createFileRoute("/api/public/payments/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const body = await request.clone().json().catch(() => ({}));
        const type = body?.type ?? url.searchParams.get("type");
        const dataId = String(body?.data?.id ?? url.searchParams.get("data.id") ?? "");
        if (type !== "payment" || !/^\d+$/.test(dataId)) return Response.json({ received: true, ignored: true });
        if (!(await verifySignature(request, dataId))) return new Response("Invalid signature", { status: 401 });
        try {
          await syncPayment(dataId);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[mercadopago webhook] error:", e);
          return new Response("Webhook error", { status: 500 });
        }
      },
    },
  },
});
