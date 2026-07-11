import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_academy/academy/")({
  head: () => ({ meta: [{ title: "Academy — Mon Parfum" }] }),
  component: () => (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · Academy"
        title="Área de membros"
        description="Quando um curso é comprado no Commerce, o acesso é liberado automaticamente aqui."
      />
      <StatGrid>
        <StatCard label="Cursos ativos" value="—" />
        <StatCard label="Alunos" value="—" />
        <StatCard label="Aulas assistidas" value="—" />
        <StatCard label="Certificados" value="—" />
      </StatGrid>
      <EmptyState
        eyebrow="Estrutura pronta"
        title="Publique o primeiro curso para começar."
        description="Player, progresso, downloads, certificados e histórico ficam disponíveis assim que houver cursos publicados no Commerce."
      />
    </div>
  ),
});
