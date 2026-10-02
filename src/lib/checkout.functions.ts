import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, currentStripeEnv, getStripeErrorMessage, stripePublishableKey } from "@/lib/stripe.server";
import { env } from "@/lib/settings.server";

import * as mercadoPago from "@/lib/mercadopago.server";

type CheckoutResult = { clientSecret: string } | { error: string };

const UUID = /^[0-9a-f-]{36}$/i;

// Com cupom, o gateway recebe o valor já descontado numa linha só (não aceita item negativo)
function chargeLines(o: { order_number: string; subtotal_cents: number; shipping_cents: number; total_cents: number; coupon_code: string | null },
  items: { name: string; quantity: number; unitCents: number }[]) {
  const productsCents = o.total_cents - o.shipping_cents;
  if (productsCents === o.subtotal_cents) return items;
  const n = items.reduce((s, i) => s + i.quantity, 0);
  return [{ name: `Pedido ${o.order_number} · ${n} ${n === 1 ? "item" : "itens"} (cupom ${o.coupon_code ?? ""})`.trim(), quantity: 1, unitCents: productsCents }];
}

// Quais gateways o servidor tem configurados (Stripe também depende da pk no cliente)
export const getPaymentOptions = createServerFn({ method: "GET" }).handler(async () => {
  const pk = stripePublishableKey();
  const stripeReady = !!pk && !!env(pk.startsWith("pk_live_") ? "STRIPE_LIVE_API_KEY" : "STRIPE_SANDBOX_API_KEY");
  return {
    mercadoPago: mercadoPago.mercadoPagoEnabled(),
    stripePk: stripeReady ? pk : null,
    testMode: env("MERCADOPAGO_ACCESS_TOKEN").startsWith("TEST-") || pk.startsWith("pk_test_"),
  };
});

// Mercado Pago Checkout Pro: cria preferência com valores do banco e devolve a URL de pagamento
export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; origin: string }) => {
    if (!UUID.test(d.orderId)) throw new Error("orderId inválido");
    const origin = new URL(d.origin).origin;
    return { orderId: d.orderId, origin };
  })
  .handler(async ({ data, context }) => {
    if (!mercadoPago.mercadoPagoEnabled()) throw new Error("Mercado Pago não configurado");
    const { data: order } = await context.supabase
      .from("orders")
      .select("id, order_number, email, status, user_id, subtotal_cents, shipping_cents, total_cents, coupon_code, order_items(product_name, quantity, unit_price_cents)")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Pedido não encontrado");
    if (order.status !== "pending_payment") throw new Error("Pedido já processado");
    const url = await mercadoPago.createPreference({
      orderId: order.id, orderNumber: order.order_number, email: order.email, origin: data.origin,
      items: chargeLines(order, order.order_items.map((i) => ({ name: i.product_name, quantity: i.quantity, unitCents: i.unit_price_cents })))
        .map((i) => ({ title: i.name, quantity: i.quantity, unitCents: i.unitCents })),
      shippingCents: order.shipping_cents,
    });
    return { url };
  });

// Retorno do cliente: confirma direto na API do MP (necessário quando o webhook não alcança o site, ex.: local)
export const confirmMercadoPagoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; paymentId: string }) => {
    if (!UUID.test(d.orderId) || !/^\d+$/.test(d.paymentId)) throw new Error("Parâmetros inválidos");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase.from("orders").select("user_id").eq("id", data.orderId).maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Pedido não encontrado");
    return { paid: await mercadoPago.syncPayment(data.paymentId, data.orderId) };
  });

export const createOrderCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; returnUrl: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.orderId)) throw new Error("orderId inválido");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { supabase, userId } = context;
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, order_number, total_cents, subtotal_cents, shipping_cents, coupon_code, email, status, user_id")
        .eq("id", data.orderId)
        .maybeSingle();
      if (error || !order) throw new Error("Pedido não encontrado");
      if (order.user_id !== userId) throw new Error("Sem permissão para este pedido");
      if (order.status !== "pending_payment") throw new Error("Pedido já processado");

      const { data: items, error: itemsErr } = await supabase
        .from("order_items")
        .select("product_name, unit_price_cents, quantity, line_total_cents")
        .eq("order_id", order.id);
      if (itemsErr || !items?.length) throw new Error("Pedido sem itens");

      const stripe = createStripeClient(currentStripeEnv());

      const line_items = chargeLines(order, items.map((i) => ({ name: i.product_name, quantity: i.quantity, unitCents: i.unit_price_cents })))
        .map((i) => ({ price_data: { currency: "brl", product_data: { name: i.name }, unit_amount: i.unitCents }, quantity: i.quantity }));

      if ((order.shipping_cents ?? 0) > 0) {
        line_items.push({
          price_data: {
            currency: "brl",
            product_data: { name: "Frete" },
            unit_amount: order.shipping_cents,
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: `${data.returnUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        line_items,
        customer_email: order.email,
        payment_intent_data: {
          description: `Pedido ${order.order_number}`,
          metadata: { orderId: order.id, orderNumber: order.order_number ?? "", userId },
        },
        metadata: { orderId: order.id, orderNumber: order.order_number ?? "", userId },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
