import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "@/lib/customers.functions";
import { formatBRL, ORDER_STATUS, PAID_STATUSES } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — E-commerce" }] }),
  component: Customer,
});

function Customer() {
  const { id } = Route.useParams();
  const { data: c, isLoading, error } = useQuery({ queryKey: ["admin-customer", id], queryFn: () => getCustomer({ data: { id } }) });
  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (error || !c) return <p className="text-destructive text-sm">{(error as Error)?.message ?? "Cliente não encontrado"}</p>;

  const paid = c.orders.filter((o) => PAID_STATUSES.includes(o.status));
  const spent = paid.reduce((s, o) => s + o.total_cents, 0);
  const products = new Map<string, number>();
  paid.flatMap((o) => o.order_items).forEach((i) => products.set(i.product_name, (products.get(i.product_name) ?? 0) + i.quantity));
  const addresses = [...new Map(c.orders.filter((o) => o.requires_shipping && o.shipping_line1)
    .map((o) => [`${o.shipping_line1}${o.shipping_number}${o.shipping_postal_code}`, o])).values()].slice(0, 3);
  const phone = c.phone ?? c.orders.find((o) => o.shipping_phone)?.shipping_phone ?? null;
  const digits = (phone ?? "").replace(/\D/g, "");

  return (
    <div className="space-y-10 max-w-[1100px]">
      <div>
        <Link to="/admin/clientes" className="eyebrow text-muted-foreground hover:text-foreground">← Clientes</Link>
        <div className="flex flex-wrap justify-between items-end gap-4 mt-3">
          <div>
            <h1 className="font-display text-4xl">{c.name || c.orders[0]?.shipping_recipient || c.email}</h1>
            <div className="text-sm text-muted-foreground mt-1">{c.email}{phone ? ` · ${phone}` : ""}</div>
          </div>
          <div className="flex gap-2 text-xs">
            {digits && <a href={`https://wa.me/${digits.length <= 11 ? "55" + digits : digits}`} target="_blank" rel="noreferrer" className="border border-border px-4 py-2">WhatsApp</a>}
            <a href={`mailto:${c.email}`} className="border border-border px-4 py-2">E-mail</a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Kpi label="Compras" value={paid.length} />
        <Kpi label="Total gasto" value={formatBRL(spent)} />
        <Kpi label="Ticket médio" value={paid.length ? formatBRL(Math.round(spent / paid.length)) : "—"} />
        <Kpi label="Cliente desde" value={new Date(c.createdAt).toLocaleDateString("pt-BR")} />
      </div>

      <section>
        <h2 className="font-display text-2xl mb-3">Pedidos</h2>
        {!c.orders.length ? <p className="text-sm text-muted-foreground">Ainda não fez pedidos.</p> : (
          <div className="border border-border divide-y divide-border">
            {c.orders.map((o) => (
              <Link key={o.id} to="/ops/pedidos/$id" params={{ id: o.id }} className="grid grid-cols-[140px_1fr_auto_auto] gap-4 p-3 text-sm items-center hover:bg-[color:var(--muted)]/40">
                <span><b>{o.order_number}</b><div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</div></span>
                <span className="text-xs">{o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}{o.coupon_code && <span className="text-[color:var(--gold)]"> · cupom {o.coupon_code}</span>}</span>
                <span className={o.status === "pending_payment" ? "text-destructive text-xs" : "text-xs"}>{ORDER_STATUS[o.status] ?? o.status}</span>
                <span>{formatBRL(o.total_cents)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="border border-border p-6">
          <div className="eyebrow mb-3">O que comprou</div>
          {products.size ? [...products].map(([name, qty]) => <div key={name} className="flex justify-between text-sm py-1"><span>{name}</span><span>× {qty}</span></div>)
            : <p className="text-sm text-muted-foreground">Nada pago ainda.</p>}
        </section>
        <section className="border border-border p-6">
          <div className="eyebrow mb-3">Endereços usados</div>
          {addresses.length ? addresses.map((o) => (
            <div key={o.id} className="text-sm py-1.5">
              {o.shipping_recipient}<br />{o.shipping_line1}, {o.shipping_number} · {o.shipping_district}<br />{o.shipping_city}/{o.shipping_state} · {o.shipping_postal_code}
            </div>
          )) : <p className="text-sm text-muted-foreground">Sem entregas.</p>}
          <div className="text-xs text-muted-foreground mt-3">Último acesso: {c.lastSignIn ? new Date(c.lastSignIn).toLocaleString("pt-BR") : "—"}</div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="bg-background p-6"><div className="eyebrow">{label}</div><div className="font-display text-2xl mt-2">{value}</div></div>;
}
