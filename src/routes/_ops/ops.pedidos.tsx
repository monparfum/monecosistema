import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { SkeletonRow } from "@/components/skeleton-row";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/format";
import { useState } from "react";

const STATUSES = ["all","pending_payment","paid","processing","shipped","delivered","cancelled"] as const;

export const Route = createFileRoute("/_ops/ops/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Operações" }] }),
  component: OpsPedidos,
});

function OpsPedidos() {
  const [filter, setFilter] = useState<typeof STATUSES[number]>("all");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["ops-pedidos"],
    queryFn: async () => (await supabase.from("orders").select("id, order_number, status, total_cents, email, shipping_recipient, shipping_city, shipping_state, created_at").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = (data ?? []).filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (q && !`${o.order_number} ${o.email} ${o.shipping_recipient}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="Operações" title="Pedidos" description="Compartilhado com Commerce — mesmos dados, visão operacional." />

      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, e-mail ou destinatário…"
          className="flex-1 min-w-[260px] bg-transparent border border-border px-3 py-2 text-sm"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof STATUSES[number])} className="bg-transparent border border-border px-3 py-2 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "Todos os status" : s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState eyebrow="Sem pedidos" title="Nada aqui ainda." description="Assim que houver pedidos no Commerce, eles aparecem nesta lista automaticamente." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {filtered.map((o) => (
            <Link
              key={o.id}
              to="/ops/pedidos/$id"
              params={{ id: o.id }}
              className="py-5 grid grid-cols-[1.2fr_1fr_auto_auto] gap-6 items-center hover:bg-[color:var(--muted)] px-2 -mx-2 transition-colors"
            >
              <div>
                <div className="eyebrow">{new Date(o.created_at).toLocaleString("pt-BR")}</div>
                <div className="font-display text-xl">{o.order_number}</div>
                <div className="text-sm text-muted-foreground">{o.shipping_recipient} · {o.shipping_city}/{o.shipping_state}</div>
              </div>
              <div className="text-sm text-muted-foreground">{o.email}</div>
              <div className="eyebrow">{o.status}</div>
              <div className="font-display text-xl">{formatBRL(o.total_cents)}</div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Clique num pedido para abrir a ficha operacional com timeline e transições de status.</p>
    </div>
  );
}
