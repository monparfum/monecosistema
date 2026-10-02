import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRow } from "@/components/skeleton-row";
import { buyShippingLabel, markShipped } from "@/lib/shipping.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_ops/ops/expedicao")({
  head: () => ({ meta: [{ title: "Expedição — Operações" }] }),
  component: OpsExpedicao,
});

function OpsExpedicao() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["ops-expedicao"],
    queryFn: async () => (await supabase
      .from("orders")
      .select("id, order_number, status, email, shipping_recipient, shipping_city, shipping_state, shipping_postal_code, shipping_service, shipping_service_id, shipping_label_id, shipping_label_url, tracking_code, created_at")
      .in("status", ["paid", "processing", "shipped"])
      .eq("requires_shipping", true)
      .order("created_at", { ascending: true })
    ).data ?? [],
  });

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="Operações" title="Expedição" description="Pedidos pagos: gere a etiqueta (Melhor Envio) ou informe o rastreio manualmente. O cliente é avisado por email." />
      {isLoading ? (
        <div className="border-y border-border divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={3} />)}
        </div>
      ) : !data?.length ? (
        <EmptyState eyebrow="Sem envios" title="Nenhum pedido pronto para expedir." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {data.map((o) => (
            <ExpedicaoRow key={o.id} order={o} onSaved={() => qc.invalidateQueries({ queryKey: ["ops-expedicao"] })} />
          ))}
        </div>
      )}
    </div>
  );
}

type ExpedicaoOrder = {
  id: string;
  order_number: string;
  status: string;
  shipping_recipient: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_service: string | null;
  shipping_service_id: number | null;
  shipping_label_id: string | null;
  shipping_label_url: string | null;
  tracking_code: string | null;
  created_at: string;
};

const btn = "border px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-40";

function ExpedicaoRow({ order, onSaved }: { order: ExpedicaoOrder; onSaved: () => void }) {
  const [code, setCode] = useState(order.tracking_code ?? "");

  const label = useMutation({
    mutationFn: () => buyShippingLabel({ data: { orderId: order.id } }),
    onSuccess: (r) => {
      toast.success("Etiqueta gerada");
      if (r.trackingCode) setCode(r.trackingCode);
      window.open(r.labelUrl, "_blank", "noopener");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ship = useMutation({
    mutationFn: () => markShipped({ data: { orderId: order.id, trackingCode: code.trim() || undefined } }),
    onSuccess: (r) => { setCode(r.trackingCode); toast.success("Envio registrado — cliente avisado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markDelivered = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Entrega confirmada"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="py-5 grid grid-cols-[1.2fr_1fr_1.4fr_auto] gap-6 items-center">
      <div>
        <div className="eyebrow">{new Date(order.created_at).toLocaleDateString("pt-BR")} · {order.status}</div>
        <Link to="/ops/pedidos/$id" params={{ id: order.id }} className="font-display text-xl hover:underline">{order.order_number}</Link>
        <div className="text-xs text-muted-foreground mt-1">{order.shipping_recipient} · {order.shipping_city}/{order.shipping_state} · {order.shipping_postal_code}</div>
      </div>
      <div className="text-sm">
        <div>{order.shipping_service ?? "—"}</div>
        {order.shipping_label_url ? (
          <a href={order.shipping_label_url} target="_blank" rel="noreferrer" className="text-xs underline">Imprimir etiqueta</a>
        ) : order.shipping_service_id && order.status !== "shipped" ? (
          <button onClick={() => label.mutate()} disabled={label.isPending} className={`${btn} border-foreground mt-1`}>
            {label.isPending ? "Gerando…" : "Gerar etiqueta"}
          </button>
        ) : null}
      </div>
      <div className="flex gap-2 items-center">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={order.shipping_label_id ? "Rastreio (automático)" : "Código de rastreio"}
          className="flex-1 bg-transparent border border-border px-3 py-2 text-sm"
        />
        <button
          onClick={() => ship.mutate()}
          disabled={ship.isPending || (!code.trim() && !order.shipping_label_id)}
          className={`${btn} border-foreground`}
        >
          {order.status === "shipped" ? "Atualizar" : "Enviar"}
        </button>
      </div>
      <div>
        {order.status === "shipped" && (
          <button onClick={() => markDelivered.mutate()} disabled={markDelivered.isPending} className={`${btn} border-border`}>Entregue</button>
        )}
      </div>
    </div>
  );
}
