import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_ops/ops/producao")({
  head: () => ({ meta: [{ title: "Produção — Operações" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Operações" title="Produção" description="Perfumes personalizados, private label e kits em produção." />
      <EmptyState
        eyebrow="Aguardando itens"
        title="Nenhum item em produção."
        description="Quando um pedido incluir perfumes personalizados, private label ou kits, ele aparece nesta linha com status Aguardando, Em produção e Finalizado."
      />
    </div>
  ),
});
