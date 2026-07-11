import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_academy/academy/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Academy" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Academy" title="Alunos" description="Cada compra de curso libera automaticamente um aluno." />
      <EmptyState eyebrow="Sem matrículas" title="Nenhum aluno matriculado ainda." />
    </div>
  ),
});
