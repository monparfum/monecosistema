import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";

export const Route = createFileRoute("/_administracao/administracao/empresa")({
  head: () => ({ meta: [{ title: "Empresa — Administração" }] }),
  component: () => (
    <div className="space-y-8 max-w-[900px]">
      <PageHeader eyebrow="Administração" title="Empresa" description="Dados da maison usados em documentos e e-mails." />
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {[
          ["Razão social", "Mon Parfum Ltda."],
          ["CNPJ", "—"],
          ["Endereço fiscal", "—"],
          ["Contato", "—"],
        ].map(([k, v]) => (
          <div key={k} className="bg-background p-5">
            <div className="eyebrow">{k}</div>
            <div className="font-display text-xl mt-1">{v}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Edição inline será habilitada quando este módulo receber dados persistentes.</p>
    </div>
  ),
});
