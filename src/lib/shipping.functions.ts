import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import * as melhorEnvio from "@/lib/melhor-envio.server";
import * as mercadoPago from "@/lib/mercadopago.server";
import { sendEmail, emails } from "@/lib/email.server";
import { afterOrderPaid, afterOrderCancelled } from "@/lib/payments.server";
import { createStripeClient, currentStripeEnv, getStripeErrorMessage } from "@/lib/stripe.server";

const UUID = /^[0-9a-f-]{36}$/i;
const onlyDigits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");


async function assertAdmin(supabase: Pick<typeof supabaseAdmin, "rpc">, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Apenas administradores");
}

async function loadCompany() {
  const { data } = await supabaseAdmin.from("company_settings").select("*").eq("singleton", true).maybeSingle();
  return data;
}

// ---------- Cotação (cliente, no checkout) ----------

export type ShippingOption = { id: string; name: string; priceCents: number; days: number | null };

export const quoteShipping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { postalCode: string; items: { product_id: string; quantity: number }[] }) => {
    const postalCode = onlyDigits(d.postalCode);
    if (!/^\d{8}$/.test(postalCode)) throw new Error("CEP inválido");
    if (!Array.isArray(d.items) || !d.items.length || d.items.length > 50) throw new Error("Carrinho inválido");
    const items = d.items.map((i) => {
      if (!UUID.test(i.product_id) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99) throw new Error("Item inválido");
      return { product_id: i.product_id, quantity: i.quantity };
    });
    return { postalCode, items };
  })
  .handler(async ({ data, context }): Promise<ShippingOption[]> => {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, price_cents, weight_g, length_cm, width_cm, height_cm, delivery_type")
      .in("id", data.items.map((i) => i.product_id))
      .eq("active", true);
    if (error) throw error;
    const byId = new Map(products.map((p) => [p.id, p]));
    const lines = data.items.map((i) => {
      const p = byId.get(i.product_id);
      if (!p) throw new Error("Produto indisponível");
      return { p, quantity: i.quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.p.price_cents * l.quantity, 0);
    // Só físico/híbrido vai na caixa
    const parcels = lines
      .filter((l) => l.p.delivery_type !== "digital")
      .map(({ p, quantity }) => ({ weightG: p.weight_g, lengthCm: p.length_cm, widthCm: p.width_cm, heightCm: p.height_cm, quantity, unitCents: p.price_cents }));
    if (!parcels.length) throw new Error("Carrinho só com produtos digitais não precisa de frete");

    let options: { serviceId: number | null; name: string; priceCents: number; days: number | null }[];
    // Frete padrão (sem Melhor Envio) e frete grátis: E-commerce › Configurações
    const company = await loadCompany();
    if (melhorEnvio.melhorEnvioEnabled()) {
      const from = onlyDigits(company?.address_postal_code);
      if (!/^\d{8}$/.test(from)) throw new Error("CEP de origem não configurado (Administração › Empresa)");
      options = await melhorEnvio.calculate(from, data.postalCode, parcels);
      if (!options.length) throw new Error("Nenhuma transportadora atende este CEP");
    } else {
      options = [{ serviceId: null, name: "Frete padrão", priceCents: company?.flat_shipping_cents ?? 2500, days: null }];
    }
    options.sort((a, b) => a.priceCents - b.priceCents);
    const freeMin = company?.free_shipping_min_cents;
    if (freeMin != null && subtotal >= freeMin) options[0] = { ...options[0], priceCents: 0 };

    const { data: rows, error: insErr } = await supabaseAdmin
      .from("shipping_quotes")
      .insert(options.map((o) => ({
        user_id: context.userId, postal_code: data.postalCode, items: data.items,
        service_id: o.serviceId, service_name: o.name, price_cents: o.priceCents, delivery_days: o.days,
      })))
      .select("id, service_name, price_cents, delivery_days");
    if (insErr) throw insErr;
    return rows.map((r) => ({ id: r.id, name: r.service_name, priceCents: r.price_cents, days: r.delivery_days }));
  });

// ---------- Expedição (admin) ----------

export const buyShippingLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => {
    if (!UUID.test(d.orderId)) throw new Error("orderId inválido");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!melhorEnvio.melhorEnvioEnabled()) throw new Error("Melhor Envio não configurado (MELHOR_ENVIO_TOKEN)");

    const { data: o } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(product_name, quantity, unit_price_cents, products(weight_g, length_cm, width_cm, height_cm, delivery_type))")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!o) throw new Error("Pedido não encontrado");
    if (!o.requires_shipping) throw new Error("Pedido só com produtos digitais não tem envio");
    if (!["paid", "processing"].includes(o.status)) throw new Error("Pedido precisa estar pago");
    const physical = o.order_items.filter((i) => i.products?.delivery_type !== "digital");
    if (o.shipping_label_id) throw new Error("Etiqueta já gerada");
    if (!o.shipping_service_id) throw new Error("Pedido sem serviço de frete do Melhor Envio");

    const c = await loadCompany();
    if (!c?.address_postal_code || !c.address_line1 || !c.address_number || !c.address_district || !c.address_city || !c.address_state || !c.cnpj) {
      throw new Error("Complete o endereço e CNPJ em Administração › Empresa");
    }

    const { labelId, labelUrl } = await melhorEnvio.buyLabel({
      serviceId: o.shipping_service_id,
      orderNumber: o.order_number,
      from: {
        name: c.legal_name || c.name, phone: onlyDigits(c.phone), email: c.email,
        company_document: onlyDigits(c.cnpj),
        address: c.address_line1, number: c.address_number, complement: c.address_complement,
        district: c.address_district, city: c.address_city, state_abbr: c.address_state, postal_code: onlyDigits(c.address_postal_code),
      },
      to: {
        name: o.shipping_recipient, phone: onlyDigits(o.shipping_phone), email: o.email,
        document: o.shipping_document ?? "",
        address: o.shipping_line1, number: o.shipping_number ?? "s/n", complement: o.shipping_line2,
        district: o.shipping_district ?? "", city: o.shipping_city, state_abbr: o.shipping_state, postal_code: o.shipping_postal_code,
      },
      items: physical.map((i) => ({ name: i.product_name, quantity: i.quantity, unitCents: i.unit_price_cents })),
      parcels: physical.map((i) => ({
        weightG: i.products?.weight_g ?? 300, lengthCm: i.products?.length_cm ?? 16, widthCm: i.products?.width_cm ?? 11,
        heightCm: i.products?.height_cm ?? 6, quantity: i.quantity, unitCents: i.unit_price_cents,
      })),
    });

    const code = await melhorEnvio.tracking(labelId).catch(() => null);
    await supabaseAdmin
      .from("orders")
      .update({ shipping_label_id: labelId, shipping_label_url: labelUrl, status: "processing", ...(code ? { tracking_code: code } : {}) })
      .eq("id", o.id);
    return { labelUrl, trackingCode: code };
  });

// Registra envio (código manual ou do Melhor Envio) e avisa o cliente
export const markShipped = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; trackingCode?: string }) => {
    if (!UUID.test(d.orderId)) throw new Error("orderId inválido");
    const trackingCode = d.trackingCode?.trim().slice(0, 60);
    return { orderId: d.orderId, trackingCode };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: o } = await supabaseAdmin.from("orders").select("id, order_number, email, status, tracking_code, shipping_label_id").eq("id", data.orderId).maybeSingle();
    if (!o) throw new Error("Pedido não encontrado");
    let code = data.trackingCode || o.tracking_code;
    if (!code && o.shipping_label_id && melhorEnvio.melhorEnvioEnabled()) code = await melhorEnvio.tracking(o.shipping_label_id);
    if (!code) throw new Error("Informe o código de rastreio (ou aguarde o Melhor Envio liberar)");
    const { error } = await supabaseAdmin.from("orders").update({ tracking_code: code, status: "shipped" }).eq("id", o.id);
    if (error) throw error;
    if (o.status !== "shipped") {
      const m = emails.shipped(o.order_number, code);
      await sendEmail(o.email, m.subject, m.html);
    }
    return { trackingCode: code };
  });

// Cancela pedido; se pago via Stripe, estorna. Estoque volta pelo trigger do banco.
export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => {
    if (!UUID.test(d.orderId)) throw new Error("orderId inválido");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: o } = await supabaseAdmin.from("orders").select("id, order_number, email, status, payment_reference, payment_method, requires_shipping").eq("id", data.orderId).maybeSingle();
    if (!o) throw new Error("Pedido não encontrado");
    if (o.status === "cancelled") return { refunded: false };
    // Pedido só digital fica "entregue" ao liberar acesso, mas pode ser cancelado (direito de arrependimento)
    if (o.requires_shipping && (o.status === "shipped" || o.status === "delivered")) throw new Error("Pedido já enviado: trate como devolução");

    let refunded = false;
    if (o.status !== "pending_payment" && o.payment_method === "stripe" && o.payment_reference?.startsWith("pi_")) {
      try {
        await createStripeClient(currentStripeEnv()).refunds.create({ payment_intent: o.payment_reference });
        refunded = true;
      } catch (e) {
        throw new Error(`Estorno falhou: ${getStripeErrorMessage(e)}`);
      }
    }
    if (o.status !== "pending_payment" && o.payment_method === "mercadopago" && o.payment_reference) {
      try {
        await mercadoPago.refund(o.payment_reference);
        refunded = true;
      } catch (e) {
        throw new Error(`Estorno falhou: ${(e as Error).message}`);
      }
    }
    const { error } = await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", o.id);
    if (error) throw error;
    if (o.status !== "pending_payment") await afterOrderCancelled(o.id);
    const m = emails.cancelled(o.order_number);
    await sendEmail(o.email, m.subject, m.html);
    return { refunded };
  });

// Pagamento recebido fora do site (Pix direto, dinheiro): mesmo fluxo pós-pagamento
export const markPaidManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => {
    if (!UUID.test(d.orderId)) throw new Error("orderId inválido");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: updated, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "paid", payment_method: "manual" })
      .eq("id", data.orderId)
      .eq("status", "pending_payment")
      .select("id");
    if (error) throw error;
    if (!updated?.length) throw new Error("Pedido não está aguardando pagamento");
    await afterOrderPaid(data.orderId);
    return { ok: true };
  });
