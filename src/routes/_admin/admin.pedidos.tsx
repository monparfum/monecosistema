import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, ORDER_STATUS, PAID_STATUSES } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — E-commerce" }] }),
  component: AdminOrders,
});

const input = "border border-border bg-background px-3 py-2 text-sm";
const PERIODS: [string, string][] = [["7", "7 dias"], ["30", "30 dias"], ["90", "90 dias"], ["365", "12 meses"], ["", "Tudo"]];

// Lista de vendas. Mudanças de status (pago, envio, cancelamento com estorno) ficam na ficha do pedido.
function AdminOrders() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [days, setDays] = useState("30");
  const [q, setQ] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-orders", days],
    queryFn: async () => {
      let query = supabase.from("orders")
        .select("id, order_number, email, status, total_cents, discount_cents, coupon_code, created_at, payment_method, requires_shipping, shipping_recipient, shipping_phone, order_items(product_name, quantity)")
        .order("created_at", { ascending: false }).limit(2000);
      if (days) query = query.gte("created_at", new Date(Date.now() - Number(days) * 86_400_000).toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter((o) => (!status || o.status === status) &&
      (!term || [o.order_number, o.email, o.shipping_recipient, o.coupon_code, ...o.order_items.map((i) => i.product_name)].some((v) => v?.toLowerCase().includes(term))));
  }, [data, status, q]);

  const counts = useMemo(() => Object.fromEntries(Object.keys(ORDER_STATUS).map((s) => [s, data.filter((o) => o.status === s).length])), [data]);
  const paidTotal = list.filter((o) => PAID_STATUSES.includes(o.status)).reduce((s, o) => s + o.total_cents, 0);
  const hours = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  const wa = (phone: string | null) => { const d = (phone ?? "").replace(/\D/g, ""); return d ? `https://wa.me/${d.length <= 11 ? "55" + d : d}` : null; };

  const exportCsv = () => {
    const rows = list.map((o) => [new Date(o.created_at).toLocaleString("pt-BR"), o.order_number, ORDER_STATUS[o.status] ?? o.status, o.shipping_recipient, o.email,
      (o.total_cents / 100).toFixed(2).replace(".", ","), (o.discount_cents / 100).toFixed(2).replace(".", ","), o.coupon_code ?? "", o.payment_method ?? "",
      o.order_items.map((i) => `${i.product_name} x${i.quantity}`).join(" | ")]);
    const csv = [["data", "pedido", "status", "cliente", "email", "total", "desconto", "cupom", "pagamento", "itens"], ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `pedidos-mon-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="eyebrow mb-2">Vendas</div>
          <h1 className="font-display text-4xl">Pedidos</h1>
          <p className="text-sm text-muted-foreground mt-1">Clique no pedido para confirmar pagamento, enviar ou cancelar (com estorno e aviso ao cliente).</p>
        </div>
        <button onClick={exportCsv} disabled={!list.length} className="border border-border px-4 py-2 text-xs disabled:opacity-40">Exportar CSV</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatus("")} className={`px-3 py-1.5 text-xs border ${!status ? "border-foreground bg-foreground text-background" : "border-border"}`}>Todos <span className="opacity-60">{data.length}</span></button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setStatus(k)} className={`px-3 py-1.5 text-xs border ${status === k ? "border-foreground bg-foreground text-background" : "border-border"}`}>{v} <span className="opacity-60">{counts[k]}</span></button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pedido, cliente, e-mail, produto, cupom…" className={`${input} w-80`} />
        <select value={days} onChange={(e) => setDays(e.target.value)} className={input}>{PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <span className="ml-auto text-sm">{list.length} pedido(s) · pagos: <b>{formatBRL(paidTotal)}</b></span>
      </div>
      {status === "pending_payment" && (
        <p className="text-xs text-muted-foreground">Pedidos aguardando pagamento há mais de algumas horas costumam ser carrinhos abandonados: chame o cliente pelo WhatsApp.</p>
      )}

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !list.length ? <p className="text-sm text-muted-foreground">Nenhum pedido.</p> : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr>{["Pedido", "Cliente", "Itens", "Total", "Status", ""].map((h, i) => <th key={i} className="p-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((o) => (
                <tr key={o.id} onClick={() => navigate({ to: "/ops/pedidos/$id", params: { id: o.id } })} className="cursor-pointer hover:bg-[color:var(--muted)]/40 align-top">
                  <td className="p-3"><div className="font-medium">{o.order_number}</div><div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</div></td>
                  <td className="p-3">{o.shipping_recipient || "—"}<div className="text-xs text-muted-foreground">{o.email}</div></td>
                  <td className="p-3 text-xs max-w-[280px]">{o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}{!o.requires_shipping && <div className="text-muted-foreground">digital</div>}</td>
                  <td className="p-3 whitespace-nowrap">{formatBRL(o.total_cents)}{o.coupon_code && <div className="text-xs text-[color:var(--gold)]">{o.coupon_code} −{formatBRL(o.discount_cents)}</div>}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={o.status === "cancelled" ? "text-muted-foreground" : o.status === "pending_payment" ? "text-destructive" : ""}>{ORDER_STATUS[o.status] ?? o.status}</span>
                    {o.status === "pending_payment" && <div className="text-xs text-muted-foreground">há {hours(o.created_at) < 24 ? `${hours(o.created_at)}h` : `${Math.floor(hours(o.created_at) / 24)}d`}</div>}
                  </td>
                  <td className="p-3 text-xs" onClick={(e) => e.stopPropagation()}>
                    {o.status === "pending_payment" && wa(o.shipping_phone) && (
                      <a href={`${wa(o.shipping_phone)}?text=${encodeURIComponent(`Olá! Vi que seu pedido ${o.order_number} na MON PARFUM ficou aguardando pagamento. Posso ajudar a finalizar?`)}`} target="_blank" rel="noreferrer" className="underline">Lembrar no WhatsApp</a>
                    )}
                    {o.status !== "pending_payment" && <Link to="/ops/pedidos/$id" params={{ id: o.id }} className="underline">Abrir</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
