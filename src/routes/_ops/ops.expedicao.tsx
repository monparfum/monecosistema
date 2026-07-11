import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRow } from "@/components/skeleton-row";
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
      .select("id, order_number, status, email, shipping_recipient, shipping_city, shipping_state, shipping_postal_code, tracking_code, created_at")
      .in("status", ["processing", "shipped"])
      .order("created_at", { ascending: true })
    ).data ?? [],
  });

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="Operações" title="Expedição" description="Pedidos prontos para envio e em trânsito. Registre o código de rastreio." />
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
  email: string;
  shipping_recipient: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  tracking_code: string | null;
  created_at: string;
};

function ExpedicaoRow({ order, onSaved }: { order: ExpedicaoOrder; onSaved: () => void }) {
  const [code, setCode] = useState(order.tracking_code ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const patch: { tracking_code: string; status?: "shipped" } = { tracking_code: code.trim() };
      if (order.status !== "shipped") patch.status = "shipped";
      const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Envio registrado"); onSaved(); },
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
    <div className="py-5 grid grid-cols-[1.2fr_1.4fr_auto] gap-6 items-center">
      <div>
        <div className="eyebrow">{new Date(order.created_at).toLocaleDateString("pt-BR")} · {order.status}</div>
        <Link to="/ops/pedidos/$id" params={{ id: order.id }} className="font-display text-xl hover:underline">{order.order_number}</Link>
        <div className="text-xs text-muted-foreground mt-1">{order.shipping_recipient} · {order.shipping_city}/{order.shipping_state} · {order.shipping_postal_code}</div>
      </div>
      <div className="flex gap-2 items-center">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de rastreio"
          className="flex-1 bg-transparent border border-border px-3 py-2 text-sm"
        />
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !code.trim()}
          className="border border-foreground px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-40"
        >
          {order.status === "shipped" ? "Atualizar" : "Enviar"}
        </button>
      </div>
      <div>
        {order.status === "shipped" && (
          <button onClick={() => markDelivered.mutate()} disabled={markDelivered.isPending} className="border border-border px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-40">Entregue</button>
        )}
      </div>
    </div>
  );
}
