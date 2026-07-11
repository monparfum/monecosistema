import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";

export const Route = createFileRoute("/_crm/crm/segmentos")({
  head: () => ({ meta: [{ title: "Segmentos — CRM" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="CRM" title="Segmentos" description="Agrupamentos dinâmicos usados por Marketing e Operações." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {[
          { label: "VIP", hint: "LTV ≥ R$ 1.000" },
          { label: "Recorrentes", hint: "3+ pedidos em 12 meses" },
          { label: "Aniversariantes", hint: "Este mês" },
          { label: "Inativos", hint: "Sem compras há 90+ dias" },
          { label: "Novos", hint: "Cadastro nos últimos 30 dias" },
          { label: "Personalizados", hint: "Compraram private label ou personalizado" },
        ].map((s) => (
          <div key={s.label} className="bg-background p-6">
            <div className="eyebrow">Segmento</div>
            <div className="font-display text-2xl mt-2">{s.label}</div>
            <p className="text-xs text-muted-foreground mt-2">{s.hint}</p>
          </div>
        ))}
      </div>
    </div>
  ),
});
