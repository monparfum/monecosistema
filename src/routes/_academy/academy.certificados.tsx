import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_academy/academy/certificados")({
  head: () => ({ meta: [{ title: "Certificados — Academy" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Academy" title="Certificados" description="Emitidos automaticamente ao concluir 100% de um curso." />
      <EmptyState eyebrow="Sem emissões" title="Nenhum certificado emitido ainda." />
    </div>
  ),
});
