import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_academy/academy/cursos")({
  head: () => ({ meta: [{ title: "Cursos — Academy" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Academy" title="Cursos" description="Catálogo de cursos disponível aos alunos." />
      <EmptyState
        eyebrow="Sem cursos"
        title="Nenhum curso publicado."
        description="Crie um produto do tipo Curso no Commerce e ele aparecerá aqui com módulos, aulas e downloads."
      />
    </div>
  ),
});
