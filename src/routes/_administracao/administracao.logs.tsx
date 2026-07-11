import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_administracao/administracao/logs")({
  head: () => ({ meta: [{ title: "Logs — Administração" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Administração" title="Logs" description="Auditoria de eventos do sistema." />
      <EmptyState
        eyebrow="Auditoria"
        title="Nenhum evento registrado ainda."
        description="Assim que o Core de eventos estiver persistindo em banco, cada emissão (pedido, matrícula, campanha) aparecerá aqui com timestamp e ator."
      />
    </div>
  ),
});
