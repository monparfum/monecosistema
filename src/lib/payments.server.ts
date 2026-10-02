import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmail, emails } from "@/lib/email.server";
import { membersEnabled, notifyOrder, syncProduct, type OrderNotice } from "@/lib/members.server";
import { formatBRL } from "@/lib/format";

// Marca pedido como pago somente se valor (centavos) e moeda batem com o total do banco.
// Idempotente: gateways mandam vários avisos por pagamento; só o primeiro muda o status.
export async function markOrderPaid(orderId: string, method: "stripe" | "mercadopago", paymentRef: string, amountCents: unknown, currency: unknown) {
  const { data: order } = await supabaseAdmin.from("orders").select("total_cents, order_number").eq("id", orderId).maybeSingle();
  if (!order) return false;
  if (amountCents !== order.total_cents || String(currency).toLowerCase() !== "brl") {
    await supabaseAdmin.rpc("log_module_event", {
      _event_type: "payment.amount_mismatch",
      _actor: null as unknown as string,
      _subject_type: "order",
      _subject_id: orderId,
      _payload: { order_number: order.order_number, method, expected: order.total_cents, received: amountCents as number, currency: String(currency), ref: paymentRef },
    });
    console.error(`[${method}] amount mismatch`, orderId, amountCents, order.total_cents);
    return false;
  }
  const { data: updated } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", payment_method: method, payment_reference: paymentRef })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id");
  if (updated?.[0]) await afterOrderPaid(orderId);
  return true;
}

async function loadOrderNotice(orderId: string, event: OrderNotice["event"]) {
  const { data: o } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, email, total_cents, payment_method, updated_at, requires_shipping, shipping_recipient, shipping_phone, order_items(product_id, product_name, products(name, active, delivery_type, member_course_ids))")
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return null;
  const digital = o.order_items.filter((i) => i.product_id && i.products && i.products.delivery_type !== "physical");
  const notice: OrderNotice = {
    event,
    order: { id: o.id, number: o.order_number, amount_cents: o.total_cents, payment_method: o.payment_method, paid_at: o.updated_at },
    customer: { email: o.email, name: o.shipping_recipient, phone: o.shipping_phone },
    products: digital.map((i) => ({ id: i.product_id!, name: i.product_name })),
  };
  return { o, digital, notice };
}

// Pago: email de confirmação; digital/híbrido → área de membros cria conta, libera cursos e manda o acesso;
// pedido só digital fica entregue (não vai à expedição)
export async function afterOrderPaid(orderId: string) {
  const r = await loadOrderNotice(orderId, "order.paid");
  if (!r) return;
  const { o, digital, notice } = r;
  const paid = emails.paid(o.order_number, formatBRL(o.total_cents));
  await sendEmail(o.email, paid.subject, paid.html);
  if (digital.length && membersEnabled()) {
    // Garante que o produto existe lá com os cursos atuais antes de liberar
    for (const i of digital) {
      await syncProduct({ id: i.product_id!, name: i.products!.name, active: true, courseIds: i.products!.member_course_ids })
        .catch((e) => console.error("[membros] sync produto", i.product_id, e));
    }
    await notifyOrder(notice);
  }
  if (!o.requires_shipping) {
    await supabaseAdmin.from("orders").update({ status: "delivered" }).eq("id", o.id).eq("status", "paid");
  }
}

// Cancelado/estornado: área de membros revoga os cursos do pedido e avisa o aluno
export async function afterOrderCancelled(orderId: string) {
  const r = await loadOrderNotice(orderId, "order.cancelled");
  if (r?.digital.length) await notifyOrder(r.notice);
}
