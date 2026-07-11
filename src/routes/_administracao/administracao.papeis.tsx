import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";

const ROLES = [
  { role: "admin", desc: "Acesso total à plataforma e todos os módulos." },
  { role: "editor", desc: "Compõe conteúdo no Estúdio. Sem publicar." },
  { role: "reviewer", desc: "Revisa e publica conteúdo no Estúdio." },
  { role: "ops", desc: "Operações — pedidos, produção e expedição." },
  { role: "marketing", desc: "Campanhas, calendário e social." },
  { role: "customer", desc: "Cliente final da boutique." },
];

export const Route = createFileRoute("/_administracao/administracao/papeis")({
  head: () => ({ meta: [{ title: "Papéis — Administração" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1000px]">
      <PageHeader eyebrow="Administração" title="Papéis" description="Perfis e escopos previstos pela arquitetura." />
      <div className="border-y border-border divide-y divide-border">
        {ROLES.map((r) => (
          <div key={r.role} className="py-5">
            <div className="eyebrow">Papel</div>
            <div className="font-display text-2xl mt-1">{r.role}</div>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Permissões granulares por módulo serão ativadas em fase posterior — sem alterar o banco atual.</p>
    </div>
  ),
});
