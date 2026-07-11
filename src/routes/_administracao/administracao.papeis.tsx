import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Minus } from "lucide-react";
import { PageHeader } from "@/components/module-shell";

const ROLES = ["admin", "editor", "reviewer", "customer"] as const;
type Role = (typeof ROLES)[number];

const DESCRIPTIONS: Record<Role, string> = {
  admin: "Acesso total à plataforma e todos os módulos.",
  editor: "Compõe conteúdo no Estúdio. Sem publicar.",
  reviewer: "Revisa e publica conteúdo no Estúdio.",
  customer: "Cliente final da boutique.",
};

const MODULES = [
  { key: "commerce", label: "Commerce" },
  { key: "studio", label: "Estúdio" },
  { key: "ops", label: "Operações" },
  { key: "crm", label: "CRM" },
  { key: "academy", label: "Academy" },
  { key: "marketing", label: "Marketing" },
  { key: "administracao", label: "Administração" },
];

// r=read, w=write, p=publish
const MATRIX: Record<Role, Record<string, string>> = {
  admin:    { commerce: "rwp", studio: "rwp", ops: "rwp", crm: "rwp", academy: "rwp", marketing: "rwp", administracao: "rwp" },
  editor:   { commerce: "r",   studio: "rw",  ops: "",    crm: "r",   academy: "rw",  marketing: "rw",  administracao: "" },
  reviewer: { commerce: "r",   studio: "rwp", ops: "",    crm: "r",   academy: "rwp", marketing: "rwp", administracao: "" },
  customer: { commerce: "r",   studio: "",    ops: "",    crm: "",    academy: "r",   marketing: "",    administracao: "" },
};

function scopeLabel(s: string) {
  if (!s) return null;
  const parts: string[] = [];
  if (s.includes("r")) parts.push("ler");
  if (s.includes("w")) parts.push("editar");
  if (s.includes("p")) parts.push("publicar");
  return parts.join(" · ");
}

export const Route = createFileRoute("/_administracao/administracao/papeis")({
  head: () => ({ meta: [{ title: "Papéis — Administração" }] }),
  component: Papeis,
});

function Papeis() {
  const { data } = useQuery({
    queryKey: ["roles-counts"],
    queryFn: async () => {
      const { data: rows } = await supabase.from("user_roles").select("role");
      const counts: Record<string, number> = {};
      (rows ?? []).forEach((r) => { counts[r.role] = (counts[r.role] ?? 0) + 1; });
      return counts;
    },
  });

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Administração"
        title="Papéis"
        description="Escopo de acesso por módulo. Alocação de papéis feita em Usuários."
      />

      <div className="grid md:grid-cols-4 gap-px bg-border border border-border">
        {ROLES.map((r) => (
          <div key={r} className="bg-background p-5">
            <div className="eyebrow">Papel</div>
            <div className="font-display text-2xl mt-1 capitalize">{r}</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-3xl">{data?.[r] ?? 0}</span>
              <span className="text-xs text-muted-foreground">pessoas</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="eyebrow mb-3">Matriz de permissões</div>
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[color:var(--cream)]/40">
                <th className="text-left p-4 eyebrow font-normal">Módulo</th>
                {ROLES.map((r) => (
                  <th key={r} className="text-left p-4 eyebrow font-normal capitalize">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.key} className="border-b border-border last:border-0">
                  <td className="p-4 font-display text-base">{m.label}</td>
                  {ROLES.map((r) => {
                    const s = MATRIX[r][m.key];
                    return (
                      <td key={r} className="p-4">
                        {s ? (
                          <div className="flex items-center gap-2">
                            <Check className="size-3.5 text-[color:var(--gold)]" strokeWidth={2} />
                            <span className="text-xs text-muted-foreground">{scopeLabel(s)}</span>
                          </div>
                        ) : (
                          <Minus className="size-3.5 text-muted-foreground" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Para atribuir ou revogar papéis, vá em <Link to="/administracao/usuarios" className="editorial-link">Usuários</Link>.
      </p>
    </div>
  );
}
