import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };

export const createOrderCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.orderId)) throw new Error("orderId inválido");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { supabase, userId } = context;
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, order_number, total_cents, subtotal_cents, shipping_cents, email, status, user_id")
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

      const stripe = createStripeClient(data.environment);

      const line_items = items.map((i) => ({
        price_data: {
          currency: "brl",
          product_data: { name: i.product_name },
          unit_amount: i.unit_price_cents,
        },
        quantity: i.quantity,
      }));

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
