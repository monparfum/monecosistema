import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { quoteShipping } from "@/lib/shipping.functions";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/")({
  head: () => ({ meta: [{ title: "Checkout — Mon Parfum" }] }),
  component: Checkout,
});

const digits = (s: string) => s.replace(/\D/g, "");

function Checkout() {
  const { items, subtotalCents } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    recipient: "", document: "", postal_code: "", line1: "", number: "", line2: "", district: "", city: "", state: "", phone: "",
  });
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; products_discount: number; free_shipping: boolean } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  const cep = digits(form.postal_code);
  const cartItems = items.map((i) => ({ product_id: i.productId, quantity: i.quantity }));

  // Tipo de cada produto: só pede endereço/frete se houver item físico ou híbrido
  const types = useQuery({
    queryKey: ["cart-types", cartItems.map((i) => i.product_id).sort().join()],
    enabled: cartItems.length > 0,
    queryFn: async () => (await supabase.from("products").select("id, delivery_type").in("id", cartItems.map((i) => i.product_id))).data ?? [],
  });
  const needsShipping = !types.data || cartItems.some((i) => types.data.find((t) => t.id === i.product_id)?.delivery_type !== "digital");

  // Preenche endereço pelo CEP (ViaCEP)
  useEffect(() => {
    if (cep.length !== 8) return;
    let cancelled = false;
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((a) => {
        if (cancelled || a.erro) return;
        setForm((f) => ({ ...f, line1: a.logradouro || f.line1, district: a.bairro || f.district, city: a.localidade || f.city, state: a.uf || f.state }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [cep]);

  // Cotação feita no servidor; o pedido usa o preço gravado lá
  const shipping = useQuery({
    queryKey: ["shipping-quote", cep, JSON.stringify(cartItems)],
    enabled: !!user && needsShipping && cep.length === 8 && cartItems.length > 0,
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: () => quoteShipping({ data: { postalCode: cep, items: cartItems } }),
  });
  const options = shipping.data ?? [];
  const selected = options.find((o) => o.id === quoteId) ?? options[0];

  const shippingCents = needsShipping ? selected?.priceCents ?? 0 : 0;
  const ready = !types.isLoading && (!needsShipping || !!selected);
  // Prévia; o valor final é recalculado no banco (place_order)
  const discountCents = (coupon?.products_discount ?? 0) + (coupon?.free_shipping ? shippingCents : 0);
  const totalCents = subtotalCents + shippingCents - discountCents;

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
          <Link to="/produtos" className="border-b-2 border-foreground pb-1 text-sm">Voltar ao catálogo</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return toast.error("Informe o CEP e escolha o frete");
    setSubmitting(true);
    try {
      // Preço, estoque e frete são conferidos no banco (place_order); o cliente envia só ids, quantidades e a cotação
      const { data, error } = await supabase.rpc("place_order", {
        _items: cartItems,
        _address: form,
        _quote_id: needsShipping ? selected?.id ?? null : null,
        _coupon: coupon?.code ?? undefined,
      });
      if (error) throw error;
      const order = data as { id: string; order_number: string };

      toast.success(`Pedido ${order.order_number} criado — prossiga com o pagamento`);
      navigate({ to: "/checkout/pagamento/$orderId", params: { orderId: order.id } });
    } catch (err) {
      toast.error((err as Error).message);
      if (/frete/i.test((err as Error).message)) shipping.refetch();
      if (/cupom/i.test((err as Error).message)) setCoupon(null);
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    const { data, error } = await supabase.rpc("preview_coupon", { _code: code, _items: cartItems });
    setCouponBusy(false);
    if (error) { setCoupon(null); return toast.error(error.message); }
    setCoupon(data as { code: string; products_discount: number; free_shipping: boolean });
    toast.success("Cupom aplicado");
  };

  const fld = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <input {...props} required={props.required ?? true} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
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
            <h1 className="font-display text-4xl">{needsShipping ? "Endereço de entrega" : "Seus dados"}</h1>
            {!needsShipping && <p className="text-sm text-muted-foreground mt-2">Produto digital: o acesso chega no seu email após o pagamento.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {fld("recipient", needsShipping ? "Destinatário" : "Nome completo")}
            {fld("document", "CPF", { inputMode: "numeric", pattern: "\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}", title: "CPF com 11 dígitos" })}
          </div>
          {needsShipping && <>
          <div className="grid grid-cols-3 gap-4">
            {fld("postal_code", "CEP", { inputMode: "numeric", maxLength: 9 })}
            <div className="col-span-2">{fld("line1", "Endereço")}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {fld("number", "Número")}
            <div className="col-span-2">{fld("line2", "Complemento", { required: false })}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {fld("district", "Bairro")}
            {fld("city", "Cidade")}
            {fld("state", "UF", { maxLength: 2 })}
          </div>
          </>}
          {fld("phone", "Telefone", { required: false, type: "tel" })}

          {needsShipping && <div className="border-t border-border pt-6">
            <div className="eyebrow mb-3">Frete</div>
            {cep.length !== 8 ? (
              <p className="text-sm text-muted-foreground">Informe o CEP para calcular.</p>
            ) : shipping.isLoading ? (
              <p className="text-sm text-muted-foreground">Calculando…</p>
            ) : shipping.error ? (
              <p className="text-sm text-destructive">{(shipping.error as Error).message}</p>
            ) : (
              <div className="space-y-2">
                {options.map((o) => (
                  <label key={o.id} className="flex items-center justify-between border border-border px-4 py-3 text-sm cursor-pointer has-[:checked]:border-foreground">
                    <span className="flex items-center gap-3">
                      <input type="radio" name="shipping" checked={selected?.id === o.id} onChange={() => setQuoteId(o.id)} />
                      {o.name}{o.days ? ` · até ${o.days} dias úteis` : ""}
                    </span>
                    <span>{o.priceCents === 0 ? "Grátis" : formatBRL(o.priceCents)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>}

          <div className="border-t border-border pt-6">
            <div className="eyebrow mb-3">Pagamento</div>
            <p className="text-sm text-muted-foreground">
              Ao confirmar, você segue para o pagamento seguro. Valores finais conferidos no servidor.
            </p>
          </div>

          <button disabled={submitting || !ready} className="w-full bg-foreground text-background py-3 text-sm tracking-wide disabled:opacity-50">
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
          <div className="flex justify-between text-sm"><span>Frete</span><span>{!needsShipping ? "Digital" : !selected ? "—" : shippingCents === 0 || coupon?.free_shipping ? "Grátis" : formatBRL(shippingCents)}</span></div>
          {coupon && discountCents > 0 && (
            <div className="flex justify-between text-sm text-[color:var(--gold)]">
              <span>Cupom {coupon.code} <button type="button" onClick={() => { setCoupon(null); setCouponInput(""); }} className="underline text-muted-foreground ml-1">remover</button></span>
              <span>− {formatBRL(discountCents)}</span>
            </div>
          )}
          {!coupon && (
            <div className="flex gap-2 pt-1">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} maxLength={30} placeholder="Cupom de desconto"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                className="flex-1 min-w-0 border-b border-border bg-transparent py-1.5 text-sm uppercase focus:outline-none focus:border-foreground" />
              <button type="button" onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()} className="text-xs border border-border px-3 disabled:opacity-40">{couponBusy ? "…" : "Aplicar"}</button>
            </div>
          )}
          <div className="border-t border-border pt-3 flex justify-between font-display text-2xl">
            <span>Total</span><span>{formatBRL(totalCents)}</span>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
