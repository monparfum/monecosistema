import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_ops/ops/")({
  head: () => ({ meta: [{ title: "Operações — Mon Parfum" }] }),
  component: OpsDashboard,
});

function OpsDashboard() {
  const { data } = useQuery({
    queryKey: ["ops-stats"],
    queryFn: async () => {
      const orders = (await supabase.from("orders").select("status, total_cents")).data ?? [];
      const by = (s: string) => orders.filter((o) => o.status === s).length;
      const revenue = orders
        .filter((o) => o.status !== "cancelled" && o.status !== "pending_payment")
        .reduce((s, o) => s + o.total_cents, 0);
      return {
        aguardando: by("pending_payment"),
        producao: by("paid") + by("processing"),
        expedicao: by("shipped"),
        entregues: by("delivered"),
        receita: revenue,
        total: orders.length,
      };
    },
  });

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · Operações"
        title="Painel operacional"
        description="Todo pedido criado no Commerce chega aqui automaticamente para separação, produção e expedição."
      />
      <StatGrid>
        <StatCard label="Aguardando pagamento" value={data?.aguardando ?? "—"} />
        <StatCard label="Em produção" value={data?.producao ?? "—"} />
        <StatCard label="Em expedição" value={data?.expedicao ?? "—"} />
        <StatCard label="Entregues" value={data?.entregues ?? "—"} />
        <StatCard label="Pedidos totais" value={data?.total ?? "—"} />
        <StatCard label="Receita realizada" value={data ? formatBRL(data.receita) : "—"} hint="Exclui cancelados e aguardando" />
      </StatGrid>
    </div>
  );
}
