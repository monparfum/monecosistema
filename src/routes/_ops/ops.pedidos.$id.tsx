import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { cancelOrder, markShipped, markPaidManually } from "@/lib/shipping.functions";

const FLOW = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = typeof FLOW[number];

const NEXT_ACTIONS: Record<OrderStatus, { to: OrderStatus; label: string }[]> = {
  pending_payment: [{ to: "paid", label: "Marcar como pago" }, { to: "cancelled", label: "Cancelar" }],
  paid: [{ to: "processing", label: "Iniciar produção" }, { to: "cancelled", label: "Cancelar" }],
  processing: [{ to: "shipped", label: "Marcar como enviado" }, { to: "cancelled", label: "Cancelar" }],
  shipped: [{ to: "delivered", label: "Confirmar entrega" }],
  delivered: [],
  cancelled: [],
};

export const Route = createFileRoute("/_ops/ops/pedidos/$id")({
  head: () => ({ meta: [{ title: "Pedido — Operações" }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-order", id],
    queryFn: async () => {
      const [order, timeline] = await Promise.all([
        supabase.from("orders").select("*, order_items(id, product_name, product_brand, quantity, unit_price_cents, line_total_cents, image_url)").eq("id", id).maybeSingle(),
        supabase.from("module_events").select("*").eq("subject_type", "order").eq("subject_id", id).order("created_at", { ascending: true }),
      ]);
      return { order: order.data, timeline: timeline.data ?? [] };
    },
  });

  const transition = useMutation({
    mutationFn: async (to: OrderStatus) => {
      if (to === "cancelled") {
        if (!confirm("Cancelar o pedido? Se pago, o valor será estornado ao cliente.")) return;
        const r = await cancelOrder({ data: { orderId: id } });
        if (r.refunded) toast.success("Estorno solicitado no Stripe");
        return;
      }
      if (to === "paid") {
        await markPaidManually({ data: { orderId: id } });
        return;
      }
      if (to === "shipped") {
        const code = data?.order?.tracking_code || prompt("Código de rastreio") || "";
        await markShipped({ data: { orderId: id, trackingCode: code } });
        return;
      }
      const { error } = await supabase.from("orders").update({ status: to }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["ops-order", id] });
      qc.invalidateQueries({ queryKey: ["ops-pedidos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!data?.order) return <EmptyState title="Pedido não encontrado." />;

  const o = data.order;
  // Pedido só digital: sem produção/envio; pode ser cancelado mesmo "entregue" (acesso liberado)
  const actions = o.requires_shipping
    ? NEXT_ACTIONS[o.status as OrderStatus] ?? []
    : o.status === "pending_payment" ? NEXT_ACTIONS.pending_payment
    : o.status === "cancelled" ? [] : [{ to: "cancelled" as const, label: "Cancelar e revogar acesso" }];

  return (
    <div className="space-y-10 max-w-[1200px]">
      <div>
        <Link to="/ops/pedidos" className="eyebrow text-muted-foreground hover:text-foreground">← Pedidos</Link>
        <PageHeader
          eyebrow={`Pedido · ${o.status}`}
          title={o.order_number}
          description={`${new Date(o.created_at).toLocaleString("pt-BR")} · ${o.email}`}
          actions={
            <div className="flex gap-2 flex-wrap justify-end">
              {actions.map((a) => (
                <button
                  key={a.to}
                  onClick={() => transition.mutate(a.to)}
                  disabled={transition.isPending}
                  className="border border-foreground px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
        <Info label="Total" value={formatBRL(o.total_cents)} />
        <Info label="Frete" value={o.requires_shipping ? formatBRL(o.shipping_cents) : "Digital — sem envio"} />
        <Info label="Pagamento" value={o.payment_method || "—"} />
      </div>

      <section className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-2xl mb-4">Itens</h2>
          <div className="border-y border-border divide-y divide-border">
            {o.order_items.map((it) => (
              <div key={it.id} className="py-4 flex gap-4 items-center">
                {it.image_url && <img src={it.image_url} alt="" className="w-14 h-14 object-cover" />}
                <div className="flex-1">
                  <div className="eyebrow">{it.product_brand ?? ""}</div>
                  <div className="font-display text-lg">{it.product_name}</div>
                  <div className="text-xs text-muted-foreground">{it.quantity} × {formatBRL(it.unit_price_cents)}</div>
                </div>
                <div className="font-display">{formatBRL(it.line_total_cents)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-4">Entrega</h2>
          <div className="border border-border p-6 text-sm space-y-1">
            <div className="font-display text-lg">{o.shipping_recipient}</div>
            {o.shipping_document && <div className="text-muted-foreground">CPF {o.shipping_document}</div>}
            <div>{o.shipping_line1}{o.shipping_number ? `, ${o.shipping_number}` : ""}{o.shipping_line2 ? ` — ${o.shipping_line2}` : ""}</div>
            <div>{o.shipping_district ? `${o.shipping_district} · ` : ""}{o.shipping_city} / {o.shipping_state} · {o.shipping_postal_code}</div>
            {o.shipping_phone && <div className="text-muted-foreground">{o.shipping_phone}</div>}
            <div className="pt-3 border-t border-border mt-3">
              <div>Frete: {o.shipping_service ?? "—"}</div>
              {o.tracking_code && <div>Rastreio: <a className="underline" target="_blank" rel="noreferrer" href={`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(o.tracking_code)}`}>{o.tracking_code}</a></div>}
              {o.shipping_label_url && <a className="underline" target="_blank" rel="noreferrer" href={o.shipping_label_url}>Imprimir etiqueta</a>}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Timeline</h2>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
        ) : (
          <ol className="border-l-2 border-border pl-6 space-y-6">
            {data.timeline.map((ev) => (
              <li key={ev.id} className="relative">
                <span className="absolute -left-[29px] top-1 w-3 h-3 bg-foreground" />
                <div className="eyebrow">{new Date(ev.created_at).toLocaleString("pt-BR")}</div>
                <div className="font-display text-lg italic">{ev.event_type}</div>
                <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{JSON.stringify(ev.payload, null, 2)}</pre>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-background p-6">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-2xl mt-2 leading-none">{value}</div>
    </div>
  );
}
