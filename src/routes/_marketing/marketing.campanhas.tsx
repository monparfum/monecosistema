import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_marketing/marketing/campanhas")({
  head: () => ({ meta: [{ title: "Campanhas — Marketing" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Marketing" title="Campanhas" description="Lançamentos, datas comemorativas e eventos." />
      <EmptyState eyebrow="Sem campanhas" title="Crie a primeira campanha da maison." description="Cada campanha organiza peças de conteúdo, canais e métricas de conversão." />
    </div>
  ),
});
