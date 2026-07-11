import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_marketing/marketing/")({
  head: () => ({ meta: [{ title: "Marketing — Mon Parfum" }] }),
  component: () => (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · Marketing"
        title="Inteligência de marca"
        description="Seguidores, leads, conversões e ROI consolidados. Preparado para receber IA de conteúdo e análise competitiva."
      />
      <StatGrid>
        <StatCard label="Seguidores" value="—" hint="Somatório redes conectadas" />
        <StatCard label="Leads" value="—" />
        <StatCard label="Conversões" value="—" />
        <StatCard label="ROI" value="—" />
      </StatGrid>
      <EmptyState
        eyebrow="Conectar canais"
        title="Conecte redes e ferramentas para popular o painel."
        description="Instagram, TikTok, Pinterest, YouTube, Facebook e LinkedIn — cada conexão passa a alimentar as métricas em tempo real."
      />
    </div>
  ),
});
