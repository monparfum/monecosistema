import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Mon Parfum" }] }),
  component: Checkout,
});

function Checkout() {
  const { items, subtotalCents, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    recipient: "", line1: "", line2: "", city: "", state: "", postal_code: "", phone: "",
  });

  const shippingCents = subtotalCents >= 35000 ? 0 : 2500;
  const totalCents = subtotalCents + shippingCents;

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="font-display text-3xl mb-4">Entre para continuar</h1>
          <p className="text-muted-foreground mb-8">Você precisa estar autenticado para finalizar a compra.</p>
          <Link to="/login" search={{ redirect: "/checkout" }} className="inline-block bg-foreground text-background px-6 py-3 text-sm">Entrar</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="font-display text-3xl mb-4">Sua sacola está vazia</h1>
          <Link to="/catalogo" className="border-b-2 border-foreground pb-1 text-sm">Voltar ao catálogo</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          email: user.email!,
          status: "pending_payment",
          subtotal_cents: subtotalCents,
          shipping_cents: shippingCents,
          total_cents: totalCents,
          shipping_recipient: form.recipient,
          shipping_line1: form.line1,
          shipping_line2: form.line2 || null,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_postal_code: form.postal_code,
          shipping_phone: form.phone || null,
          payment_method: "manual",
        })
        .select("id, order_number")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          product_name: i.name,
          product_brand: i.brand ?? null,
          unit_price_cents: i.priceCents,
          quantity: i.quantity,
          line_total_cents: i.priceCents * i.quantity,
          image_url: i.imageUrl ?? null,
        })),
      );
      if (itemsError) throw itemsError;

      clear();
      toast.success(`Pedido ${order.order_number} criado`);
      navigate({ to: "/pedidos" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const fld = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <input {...props} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-[1fr_400px] gap-16">
        <form onSubmit={submit} className="space-y-8">
          <div>
            <div className="eyebrow mb-3">Checkout</div>
            <h1 className="font-display text-4xl">Endereço de entrega</h1>
          </div>
          {fld("recipient", "Destinatário")}
          {fld("line1", "Endereço")}
          {fld("line2", "Complemento", { required: false })}
          <div className="grid grid-cols-3 gap-4">
            {fld("city", "Cidade")}
            {fld("state", "UF")}
            {fld("postal_code", "CEP")}
          </div>
          {fld("phone", "Telefone", { required: false, type: "tel" })}

          <div className="border-t border-border pt-6">
            <div className="eyebrow mb-3">Pagamento</div>
            <p className="text-sm text-muted-foreground">
              O pedido será criado com status <strong>pagamento pendente</strong>. Nossa equipe entrará em contato com instruções (Pix / cartão).
            </p>
          </div>

          <button disabled={submitting} className="w-full bg-foreground text-background py-3 text-sm tracking-wide disabled:opacity-50">
            {submitting ? "Processando…" : `Confirmar pedido — ${formatBRL(totalCents)}`}
          </button>
        </form>

        <aside className="border border-border p-6 h-fit space-y-4">
          <div className="eyebrow">Resumo</div>
          <ul className="divide-y divide-border">
            {items.map((i) => (
              <li key={i.productId} className="py-3 flex justify-between text-sm">
                <span>{i.name} <span className="text-muted-foreground">×{i.quantity}</span></span>
                <span>{formatBRL(i.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatBRL(subtotalCents)}</span></div>
          <div className="flex justify-between text-sm"><span>Frete</span><span>{shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</span></div>
          <div className="border-t border-border pt-3 flex justify-between font-display text-2xl">
            <span>Total</span><span>{formatBRL(totalCents)}</span>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
