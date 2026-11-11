import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { formatBRL, ORDER_STATUS } from "@/lib/format";
import { toast } from "sonner";
import { buyShippingLabel, cancelOrder, checkPayment, markShipped, markPaidManually, syncShipment } from "@/lib/shipping.functions";
import { CARRIER_STATUS } from "@/lib/shipment-status";

export const Route = createFileRoute("/_ops/ops/pedidos/$id")({
  head: () => ({ meta: [{ title: "Pedido — Operações" }] }),
  component: OrderDetail,
});

const ORDER = ["pending_payment", "paid", "processing", "shipped", "delivered"];
const PAYMENT: Record<string, string> = { stripe: "Cartão (Stripe)", mercadopago: "Mercado Pago", manual: "Recebido fora do site" };
const trackUrl = (code: string) => `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(code)}`;
const btn = "border border-foreground px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-40";
const btnSoft = "border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] hover:border-foreground transition-colors disabled:opacity-40";

type Ev = { id: string; created_at: string; event_type: string; payload: unknown };

function eventText(ev: Ev) {
  const p = (ev.payload ?? {}) as Record<string, unknown>;
  if (ev.event_type === "order.created") return "Pedido criado";
  if (ev.event_type === "order.status_changed") return `${ORDER_STATUS[String(p.from)] ?? p.from} → ${ORDER_STATUS[String(p.to)] ?? p.to}`;
  if (ev.event_type === "payment.amount_mismatch") return `Pagamento recusado: valor recebido (${formatBRL(Number(p.received) || 0)}) diferente do pedido (${formatBRL(Number(p.expected) || 0)})`;
  if (ev.event_type === "stock.oversold") return "Estoque ficou negativo neste pedido";
  return ev.event_type;
}

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [carrier, setCarrier] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ops-order", id],
    queryFn: async () => {
      const [order, timeline] = await Promise.all([
        supabase.from("orders").select("*, order_items(id, product_name, product_brand, quantity, unit_price_cents, line_total_cents, image_url)").eq("id", id).maybeSingle(),
        supabase.from("module_events").select("*").eq("subject_type", "order").eq("subject_id", id).order("created_at", { ascending: true }),
      ]);
      return { order: order.data, timeline: (timeline.data ?? []) as Ev[] };
    },
  });
  const o = data?.order;
  useEffect(() => { if (o?.tracking_code) setCode(o.tracking_code); }, [o?.tracking_code]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["ops-order", id] });
    qc.invalidateQueries({ queryKey: ["ops-pedidos"] });
    qc.invalidateQueries({ queryKey: ["ops-expedicao"] });
  };
  // Toda ação: roda, avisa, recarrega o pedido
  const act = useMutation({
    mutationFn: async (fn: () => Promise<string | void>) => fn(),
    onSuccess: (msg) => { if (msg) toast.success(msg); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const run = (fn: () => Promise<string | void>) => act.mutate(fn);
  const setStatus = async (status: "processing" | "delivered", msg: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
    return msg;
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!o) return <EmptyState title="Pedido não encontrado." />;

  const at = ORDER.indexOf(o.status);
  const cancelled = o.status === "cancelled";
  const paid = at >= 1;
  const when = (to: string) => {
    const ev = data!.timeline.find((e) => e.event_type === "order.status_changed" && (e.payload as { to?: string } | null)?.to === to);
    return ev ? new Date(ev.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : null;
  };
  const steps = o.requires_shipping
    ? [
        { label: "Pagamento", done: paid, date: when("paid") },
        { label: "Preparação", done: at >= 2, date: when("processing") },
        { label: "Etiqueta", done: !!o.shipping_label_id || at >= 3, date: null },
        { label: "Despachado", done: at >= 3, date: when("shipped") },
        { label: "Entregue", done: at >= 4, date: when("delivered") },
      ]
    : [
        { label: "Pagamento", done: paid, date: when("paid") },
        { label: "Acesso liberado", done: at >= 4, date: when("delivered") },
      ];
  const canShip = o.requires_shipping && (o.status === "paid" || o.status === "processing");

  return (
    <div className="space-y-10 max-w-[1200px]">
      <div>
        <Link to="/ops/pedidos" className="eyebrow text-muted-foreground hover:text-foreground">← Pedidos</Link>
        <PageHeader
          eyebrow={`Pedido · ${ORDER_STATUS[o.status] ?? o.status}`}
          title={o.order_number}
          description={`${new Date(o.created_at).toLocaleString("pt-BR")} · ${o.email}`}
          actions={!cancelled && (o.requires_shipping ? at < 3 : true) ? (
            <button
              className={btnSoft} disabled={act.isPending}
              onClick={() => confirm("Cancelar o pedido? Se já foi pago, o valor é estornado ao cliente.") && run(async () => {
                const r = await cancelOrder({ data: { orderId: id } });
                return r.refunded ? "Pedido cancelado e estorno solicitado" : "Pedido cancelado";
              })}
            >
              {o.requires_shipping ? "Cancelar pedido" : "Cancelar e revogar acesso"}
            </button>
          ) : undefined}
        />
      </div>

      {cancelled ? (
        <div className="border border-destructive/40 text-destructive px-5 py-4 text-sm">Pedido cancelado{when("cancelled") ? ` em ${when("cancelled")}` : ""}.</div>
      ) : (
        <ol className="grid gap-px bg-border border border-border" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Andamento do pedido">
          {steps.map((s, i) => (
            <li key={s.label} className={`p-4 ${s.done ? "bg-foreground text-background" : "bg-background text-muted-foreground"}`} aria-current={s.done && !steps[i + 1]?.done ? "step" : undefined}>
              <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">{i + 1} · {s.done ? "feito" : "pendente"}</div>
              <div className="font-display text-lg leading-tight mt-1">{s.label}</div>
              {s.date && <div className="text-[11px] opacity-70 mt-1">{s.date}</div>}
            </li>
          ))}
        </ol>
      )}

      <div className="grid md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h2 className="font-display text-2xl">Pagamento</h2>
          <div className="border border-border p-6 text-sm space-y-3">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Situação</span><b>{cancelled ? "Cancelado" : paid ? "Confirmado" : "Aguardando pagamento"}</b></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Total</span><span>{formatBRL(o.total_cents)}{o.requires_shipping ? ` (frete ${formatBRL(o.shipping_cents)})` : ""}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Forma</span><span>{PAYMENT[o.payment_method ?? ""] ?? o.payment_method ?? "—"}</span></div>
            {o.payment_reference && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Referência</span><span className="font-mono text-xs break-all text-right">{o.payment_reference}</span></div>}
            {o.status === "pending_payment" && (
              <div className="pt-3 border-t border-border space-y-3">
                <p className="text-xs text-muted-foreground">O pagamento é confirmado sozinho quando o cliente paga. Se ele diz que pagou e continua aqui, confira direto no Stripe / Mercado Pago:</p>
                <div className="flex gap-2 flex-wrap">
                  <button className={btn} disabled={act.isPending} onClick={() => run(async () => {
                    const r = await checkPayment({ data: { orderId: id } });
                    if (!r.paid) throw new Error("Nenhum pagamento aprovado encontrado para este pedido.");
                    return "Pagamento encontrado — pedido confirmado e cliente avisado";
                  })}>Conferir pagamento</button>
                  <button className={btnSoft} disabled={act.isPending} onClick={() => confirm("Marcar como pago sem confirmação do gateway? Use só para Pix direto, dinheiro ou transferência.") && run(async () => {
                    await markPaidManually({ data: { orderId: id } });
                    return "Marcado como pago";
                  })}>Recebi por fora</button>
                </div>
              </div>
            )}
          </div>

          <h2 className="font-display text-2xl pt-4">Itens</h2>
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
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">{o.requires_shipping ? "Envio" : "Entrega"}</h2>
          {!o.requires_shipping ? (
            <div className="border border-border p-6 text-sm text-muted-foreground">Pedido só digital: sem envio. O acesso é liberado na área de membros assim que o pagamento confirma.</div>
          ) : (
            <div className="border border-border p-6 text-sm space-y-4">
              <div className="space-y-1">
                <div className="font-display text-lg">{o.shipping_recipient}</div>
                {o.shipping_document && <div className="text-muted-foreground">CPF {o.shipping_document}</div>}
                <div>{o.shipping_line1}{o.shipping_number ? `, ${o.shipping_number}` : ""}{o.shipping_line2 ? ` — ${o.shipping_line2}` : ""}</div>
                <div>{o.shipping_district ? `${o.shipping_district} · ` : ""}{o.shipping_city} / {o.shipping_state} · {o.shipping_postal_code}</div>
                {o.shipping_phone && <div className="text-muted-foreground">{o.shipping_phone}</div>}
              </div>
              <div className="pt-3 border-t border-border flex justify-between gap-4"><span className="text-muted-foreground">Frete escolhido</span><span>{o.shipping_service ?? "—"}</span></div>

              {!paid && !cancelled && <p className="text-xs text-muted-foreground">Etiqueta e despacho liberam depois do pagamento.</p>}

              {o.status === "paid" && (
                <button className={btnSoft} disabled={act.isPending} onClick={() => run(() => setStatus("processing", "Pedido em preparação"))}>Iniciar preparação</button>
              )}

              {(canShip || o.shipping_label_url) && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="eyebrow">Etiqueta</div>
                  {o.shipping_label_url ? (
                    <div className="flex gap-2 flex-wrap items-center">
                      <a className={btn} target="_blank" rel="noreferrer" href={o.shipping_label_url}>Imprimir etiqueta</a>
                      <button className={btnSoft} disabled={act.isPending} onClick={() => run(async () => {
                        const r = await syncShipment({ data: { orderId: id } });
                        setCarrier(r.carrierStatus);
                        return r.changed ? `Atualizado: ${ORDER_STATUS[r.status] ?? r.status}` : "Sem novidade na transportadora";
                      })}>Atualizar rastreio</button>
                    </div>
                  ) : o.shipping_service_id ? (
                    <>
                      <button className={btn} disabled={act.isPending} onClick={() => run(async () => {
                        const r = await buyShippingLabel({ data: { orderId: id } });
                        window.open(r.labelUrl, "_blank", "noopener");
                        return "Etiqueta comprada no Melhor Envio — abrindo para imprimir";
                      })}>{act.isPending ? "Aguarde…" : "Gerar etiqueta (Melhor Envio)"}</button>
                      <p className="text-xs text-muted-foreground">Compra a etiqueta com o saldo da carteira do Melhor Envio e abre o PDF para imprimir e colar na caixa.</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Este pedido foi fechado com frete fixo (sem cotação do Melhor Envio). Gere a etiqueta direto no painel do Melhor Envio e informe o rastreio abaixo.</p>
                  )}
                  {carrier && <p className="text-xs">Transportadora: <b>{CARRIER_STATUS[carrier] ?? carrier}</b></p>}
                </div>
              )}

              {(canShip || at >= 3) && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="eyebrow">Rastreio</div>
                  {canShip ? (
                    <>
                      <div className="flex gap-2">
                        <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={60} placeholder={o.shipping_label_id ? "Vem sozinho do Melhor Envio" : "Código de rastreio"} aria-label="Código de rastreio" className="flex-1 min-w-0 bg-transparent border border-border px-3 py-2 text-sm" />
                        <button className={btn} disabled={act.isPending || (!code.trim() && !o.shipping_label_id)} onClick={() => run(async () => {
                          const r = await markShipped({ data: { orderId: id, trackingCode: code.trim() || undefined } });
                          setCode(r.trackingCode);
                          return "Pedido despachado — cliente avisado por e-mail com o link de rastreio";
                        })}>Despachar</button>
                      </div>
                      <p className="text-xs text-muted-foreground">Ao despachar, o cliente recebe o e-mail com o link de rastreio e passa a ver o rastreio em "Meus pedidos". Com etiqueta do Melhor Envio, isso também acontece sozinho quando a transportadora registra a postagem.</p>
                    </>
                  ) : o.tracking_code ? (
                    <div className="flex gap-3 flex-wrap items-center">
                      <a className="underline font-mono" target="_blank" rel="noreferrer" href={trackUrl(o.tracking_code)}>{o.tracking_code}</a>
                      {o.status === "shipped" && <button className={btnSoft} disabled={act.isPending} onClick={() => run(() => setStatus("delivered", "Entrega confirmada"))}>Confirmar entrega</button>}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="font-display text-2xl mb-4">Histórico</h2>
        {data!.timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
        ) : (
          <ol className="border-l-2 border-border pl-6 space-y-4">
            {data!.timeline.map((ev) => (
              <li key={ev.id} className="relative">
                <span className="absolute -left-[29px] top-1.5 w-3 h-3 bg-foreground" aria-hidden="true" />
                <div className="eyebrow">{new Date(ev.created_at).toLocaleString("pt-BR")}</div>
                <div className="text-sm">{eventText(ev)}</div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
