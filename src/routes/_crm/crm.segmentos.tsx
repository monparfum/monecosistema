import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";

const SEGMENTS = [
  { id: "vip", label: "VIP", hint: "LTV ≥ R$ 1.000" },
  { id: "recurring", label: "Recorrentes", hint: "2+ pedidos" },
  { id: "new", label: "Novos", hint: "Cadastro últimos 30 dias" },
  { id: "inactive", label: "Inativos", hint: "Sem compras há 90+ dias" },
  { id: "students", label: "Alunos Academy", hint: "Possuem matrícula em curso" },
  { id: "buyers", label: "Compradores", hint: "Ao menos 1 pedido pago" },
] as const;

export const Route = createFileRoute("/_crm/crm/segmentos")({
  head: () => ({ meta: [{ title: "Segmentos — CRM" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="CRM" title="Segmentos" description="Filtros dinâmicos aplicados sobre a base de clientes." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {SEGMENTS.map((s) => (
          <Link
            key={s.id}
            to="/crm/clientes"
            search={{ segment: s.id }}
            className="bg-background p-6 hover:bg-[color:var(--muted)] transition-colors"
          >
            <div className="eyebrow">Segmento</div>
            <div className="font-display text-2xl mt-2 italic">{s.label}</div>
            <p className="text-xs text-muted-foreground mt-2">{s.hint}</p>
            <div className="eyebrow text-muted-foreground mt-4">Aplicar filtro →</div>
          </Link>
        ))}
      </div>
    </div>
  ),
});
