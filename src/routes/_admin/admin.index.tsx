import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RevenueChart } from "@/components/revenue-chart";
import { formatBRL, ORDER_STATUS, PAID_STATUSES } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/")({ component: Dashboard });

const PERIODS = [[7, "7 dias"], [30, "30 dias"], [90, "90 dias"], [365, "12 meses"]] as const;

function Dashboard() {
  const [days, setDays] = useState<number>(30);
  const { data } = useQuery({
    queryKey: ["admin-stats", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const prevSince = new Date(Date.now() - 2 * days * 86_400_000).toISOString();
      const [orders, products, company] = await Promise.all([
        supabase.from("orders").select("id, order_number, email, status, total_cents, discount_cents, coupon_code, created_at, requires_shipping, order_items(product_id, product_name, quantity, line_total_cents)")
          .gte("created_at", prevSince).order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, stock, active, delivery_type, coming_soon"),
        supabase.from("company_settings").select("low_stock_threshold").eq("singleton", true).maybeSingle(),
      ]);
      const all = orders.data ?? [];
      const cur = all.filter((o) => o.created_at >= since);
      const prev = all.filter((o) => o.created_at < since);
      const paid = cur.filter((o) => PAID_STATUSES.includes(o.status));
      const prevPaid = prev.filter((o) => PAID_STATUSES.includes(o.status));
      const revenue = paid.reduce((s, o) => s + o.total_cents, 0);
      const prevRevenue = prevPaid.reduce((s, o) => s + o.total_cents, 0);
      const top = new Map<string, { name: string; qty: number; cents: number }>();
      paid.flatMap((o) => o.order_items).forEach((i) => {
        const t = top.get(i.product_id ?? i.product_name) ?? { name: i.product_name, qty: 0, cents: 0 };
        t.qty += i.quantity; t.cents += i.line_total_cents;
        top.set(i.product_id ?? i.product_name, t);
      });
      const low = company.data?.low_stock_threshold ?? 5;
      return {
        revenue, prevRevenue, paidCount: paid.length,
        ticket: paid.length ? Math.round(revenue / paid.length) : 0,
        discounts: paid.reduce((s, o) => s + o.discount_cents, 0),
        pending: cur.filter((o) => o.status === "pending_payment"),
        toShip: all.filter((o) => o.requires_shipping && ["paid", "processing"].includes(o.status)).length,
        top: [...top.values()].sort((a, b) => b.cents - a.cents).slice(0, 6),
        lowStock: (products.data ?? []).filter((p) => p.active && !p.coming_soon && p.delivery_type !== "digital" && p.stock <= low).sort((a, b) => a.stock - b.stock),
        recent: cur.slice(0, 8),
        conversion: cur.length ? Math.round((paid.length / cur.length) * 100) : null,
      };
    },
  });

  const delta = data && data.prevRevenue ? Math.round(((data.revenue - data.prevRevenue) / data.prevRevenue) * 100) : null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="eyebrow mb-2">Painel</div>
          <h1 className="font-display text-4xl">Vendas</h1>
        </div>
        <div className="flex border border-border">
          {PERIODS.map(([d, label]) => (
            <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 text-xs ${days === d ? "bg-foreground text-background" : ""}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Kpi label="Receita (pedidos pagos)" value={data ? formatBRL(data.revenue) : "—"}
          hint={delta == null ? undefined : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs. período anterior`} />
        <Kpi label="Pedidos pagos" value={data?.paidCount ?? "—"} hint={data?.conversion != null ? `${data.conversion}% dos pedidos criados` : undefined} />
        <Kpi label="Ticket médio" value={data ? formatBRL(data.ticket) : "—"} />
        <Kpi label="Descontos concedidos" value={data ? formatBRL(data.discounts) : "—"} />
      </div>

      <RevenueChart days={Math.min(days, 90)} />

      {data && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Panel title="Precisa de atenção">
            <Row to="/ops/expedicao" left="Pedidos pagos aguardando envio" right={data.toShip} />
            <Row to="/admin/pedidos" left="Aguardando pagamento (possível carrinho abandonado)" right={data.pending.length} />
            <Row to="/admin/estoque" left="Produtos com estoque baixo" right={data.lowStock.length} alert={data.lowStock.length > 0} />
          </Panel>
          <Panel title="Mais vendidos">
            {data.top.length ? data.top.map((t) => (
              <div key={t.name} className="flex justify-between gap-4 py-2 text-sm"><span>{t.name} <span className="text-muted-foreground">× {t.qty}</span></span><span>{formatBRL(t.cents)}</span></div>
            )) : <p className="text-sm text-muted-foreground py-2">Nenhuma venda no período.</p>}
          </Panel>
          <Panel title="Estoque baixo">
            {data.lowStock.length ? data.lowStock.slice(0, 8).map((p) => (
              <div key={p.id} className="flex justify-between py-2 text-sm"><span>{p.name}</span><span className={p.stock === 0 ? "text-destructive" : ""}>{p.stock === 0 ? "esgotado" : `${p.stock} un.`}</span></div>
            )) : <p className="text-sm text-muted-foreground py-2">Tudo abastecido.</p>}
          </Panel>
          <Panel title="Últimos pedidos">
            {data.recent.length ? data.recent.map((o) => (
              <Link key={o.id} to="/ops/pedidos/$id" params={{ id: o.id }} className="flex justify-between gap-4 py-2 text-sm hover:underline">
                <span>{o.order_number} <span className="text-muted-foreground">· {ORDER_STATUS[o.status] ?? o.status}</span></span>
                <span>{formatBRL(o.total_cents)}</span>
              </Link>
            )) : <p className="text-sm text-muted-foreground py-2">Nenhum pedido no período.</p>}
          </Panel>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-background p-6">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border p-6">
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ to, left, right, alert }: { to: "/ops/expedicao" | "/admin/pedidos" | "/admin/estoque"; left: string; right: React.ReactNode; alert?: boolean }) {
  return (
    <Link to={to} className="flex justify-between gap-4 py-2 text-sm hover:underline">
      <span>{left}</span><span className={alert ? "text-destructive font-medium" : "font-medium"}>{right}</span>
    </Link>
  );
}
