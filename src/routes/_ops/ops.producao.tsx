import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRow } from "@/components/skeleton-row";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_ops/ops/producao")({
  head: () => ({ meta: [{ title: "Produção — Operações" }] }),
  component: OpsProducao,
});

function OpsProducao() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["ops-producao"],
    queryFn: async () => (await supabase
      .from("orders")
      .select("id, order_number, status, total_cents, email, shipping_recipient, created_at, order_items(product_name, quantity)")
      .in("status", ["paid", "processing"])
      .eq("requires_shipping", true)
      .order("created_at", { ascending: true })
    ).data ?? [],
  });

  const advance = useMutation({
    mutationFn: async ({ id, to }: { id: string; to: "processing" }) => {
      const { error } = await supabase.from("orders").update({ status: to }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produção iniciada");
      qc.invalidateQueries({ queryKey: ["ops-producao"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="Operações" title="Produção" description="Pedidos pagos aguardando produção e itens em curso." />

      {isLoading ? (
        <div className="border-y border-border divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
        </div>
      ) : !data?.length ? (
        <EmptyState eyebrow="Fila limpa" title="Nada em produção." description="Pedidos pagos aparecem aqui automaticamente." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {data.map((o) => (
            <div key={o.id} className="py-5 grid grid-cols-[1.2fr_1fr_auto_auto] gap-6 items-center">
              <div>
                <div className="eyebrow">{new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.status}</div>
                <Link to="/ops/pedidos/$id" params={{ id: o.id }} className="font-display text-xl hover:underline">{o.order_number}</Link>
                <div className="text-xs text-muted-foreground mt-1">{o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}</div>
              </div>
              <div className="text-sm text-muted-foreground">{o.shipping_recipient}<br />{o.email}</div>
              <div className="font-display text-lg">{formatBRL(o.total_cents)}</div>
              <div className="flex gap-2">
                {o.status === "paid" && (
                  <button onClick={() => advance.mutate({ id: o.id, to: "processing" })} disabled={advance.isPending} className="border border-foreground px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-40">Iniciar</button>
                )}
                {o.status === "processing" && (
                  <Link to="/ops/expedicao" className="border border-foreground px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors">Expedir</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
