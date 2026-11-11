// Cliente mínimo da API Mercado Pago (Checkout Pro). Env: MERCADOPAGO_ACCESS_TOKEN (TEST-… ou APP_USR-…), MERCADOPAGO_WEBHOOK_SECRET.
import { markOrderPaid } from "@/lib/payments.server";
import { env } from "@/lib/settings.server";

export const mercadoPagoEnabled = () => !!env("MERCADOPAGO_ACCESS_TOKEN");

async function mp<T>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${env("MERCADOPAGO_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mercado Pago ${path}: ${json?.message ?? res.status}`);
  return json as T;
}

export async function createPreference(input: {
  orderId: string; orderNumber: string; email: string; origin: string;
  items: { title: string; quantity: number; unitCents: number }[]; shippingCents: number;
}) {
  const https = input.origin.startsWith("https://");
  const back = `${input.origin}/checkout/retorno?order_id=${input.orderId}`;
  const pref = await mp<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: {
      items: [
        ...input.items.map((i) => ({ title: i.title, quantity: i.quantity, unit_price: i.unitCents / 100, currency_id: "BRL" })),
        ...(input.shippingCents > 0 ? [{ title: "Frete", quantity: 1, unit_price: input.shippingCents / 100, currency_id: "BRL" }] : []),
      ],
      payer: { email: input.email },
      external_reference: input.orderId,
      statement_descriptor: "MONPARFUM",
      back_urls: { success: back, pending: back, failure: back },
      // MP recusa auto_return e notification_url sem HTTPS (ex.: localhost); local confirma na volta do cliente
      ...(https ? { auto_return: "approved", notification_url: `${input.origin}/api/public/payments/mercadopago` } : {}),
    },
  });
  return pref.init_point;
}

type Payment = { id: number; status: string; transaction_amount: number; currency_id: string; external_reference: string | null };

// Busca o pagamento na API (fonte da verdade) e marca o pedido se aprovado
export async function syncPayment(paymentId: string, expectedOrderId?: string) {
  const p = await mp<Payment>(`/v1/payments/${encodeURIComponent(paymentId)}`);
  if (!p.external_reference || (expectedOrderId && p.external_reference !== expectedOrderId)) return false;
  if (p.status !== "approved") return false;
  return markOrderPaid(p.external_reference, "mercadopago", String(p.id), Math.round(p.transaction_amount * 100), p.currency_id);
}

// Conferência manual (webhook perdido): procura pagamento aprovado do pedido e aplica
export async function syncOrderPayment(orderId: string) {
  const r = await mp<{ results: Payment[] }>(`/v1/payments/search?external_reference=${encodeURIComponent(orderId)}&status=approved&limit=1`);
  const p = r.results?.[0];
  return p ? syncPayment(String(p.id), orderId) : false;
}

export async function refund(paymentId: string) {
  await mp(`/v1/payments/${encodeURIComponent(paymentId)}/refunds`, { method: "POST", body: {}, idempotencyKey: `refund-${paymentId}` });
}

// Assinatura do webhook (x-signature: ts=…,v1=…); manifest conforme doc do MP
export async function verifySignature(req: Request, dataId: string) {
  const secret = env("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) return true; // sem segredo, a segurança vem de syncPayment consultar a API
  const sig = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  return Buffer.from(new Uint8Array(mac)).toString("hex") === parts.v1;
}
