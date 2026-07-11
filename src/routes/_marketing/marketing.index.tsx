import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_marketing/marketing/")({
  head: () => ({ meta: [{ title: "Marketing — Mon Parfum" }] }),
  component: MarketingIndex,
});

function MarketingIndex() {
  const { data } = useQuery({
    queryKey: ["marketing-conversions"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: orders } = await supabase
        .from("orders")
        .select("total_cents, status, created_at")
        .in("status", ["paid", "processing", "shipped", "delivered"])
        .gte("created_at", since);
      const rows = orders ?? [];
      return {
        conversions: rows.length,
        revenue: rows.reduce((s, o) => s + o.total_cents, 0),
      };
    },
  });

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · Marketing"
        title="Inteligência de marca"
        description="Conversões e receita já vêm do Commerce. Seguidores, leads e ROI ativam ao conectar canais."
      />
      <StatGrid>
        <StatCard label="Seguidores" value="—" hint="Somatório redes conectadas" />
        <StatCard label="Leads" value="—" hint="CRM · captura em breve" />
        <StatCard label="Conversões · 30d" value={data?.conversions ?? "—"} hint="Pedidos pagos" />
        <StatCard label="Receita · 30d" value={data ? formatBRL(data.revenue) : "—"} />
      </StatGrid>
      <EmptyState
        eyebrow="Conectar canais"
        title="Conecte redes e ferramentas para completar o painel."
        description="Instagram, TikTok, Pinterest, YouTube, Facebook e LinkedIn — cada conexão alimenta as métricas em tempo real."
      />
    </div>
  );
}
