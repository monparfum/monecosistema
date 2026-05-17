import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_studio/studio/equipe")({
  component: Equipe,
});

type Role = "admin" | "editor" | "reviewer" | "customer";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin · poder total",
  reviewer: "Revisor · aprova e publica",
  editor: "Editor · escreve rascunhos",
  customer: "Cliente · sem acesso ao Studio",
};

function Equipe() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: rows } = useQuery({
    queryKey: ["studio-team"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role, id");
      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        roles: (roles ?? []).filter((r) => r.user_id === p.id) as Array<{ id: string; role: Role; user_id: string }>,
      }));
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="max-w-xl">
        <div className="eyebrow mb-3 text-muted-foreground">Studio · Equipe</div>
        <h1 className="font-display text-4xl">Acesso restrito</h1>
        <p className="mt-4 text-sm text-muted-foreground">Apenas admins podem gerenciar permissões.</p>
      </div>
    );
  }

  const setRole = async (userId: string, role: Role, current: Array<{ id: string; role: Role }>) => {
    // remove studio roles other than the chosen one, leave customer untouched
    const studio: Role[] = ["admin", "editor", "reviewer"];
    const toRemove = current.filter((r) => studio.includes(r.role) && r.role !== role);
    for (const r of toRemove) {
      await supabase.from("user_roles").delete().eq("id", r.id);
    }
    if (role !== "customer" && !current.some((r) => r.role === role)) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Papel atualizado");
    qc.invalidateQueries({ queryKey: ["studio-team"] });
  };

  return (
    <div className="space-y-12">
      <div>
        <div className="eyebrow mb-3">Studio · Equipe</div>
        <h1 className="font-display text-5xl">Permissões</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Defina quem pode editar conteúdo e quem pode publicá-lo. Apenas Revisores e Admins podem publicar páginas — Editores criam rascunhos para revisão.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <RoleCard title="Admin" body="Acesso total ao Studio, ao Comércio e à gestão da equipe." />
        <RoleCard title="Revisor" body="Edita, aprova e publica páginas. Não gerencia a equipe." />
        <RoleCard title="Editor" body="Cria e edita rascunhos. Não consegue publicar — envia para o revisor." />
      </div>

      <div className="divide-y divide-border border-t border-b border-border">
        {rows?.map((row) => {
          const current: Role = row.roles.find((r) => r.role === "admin")?.role
            ?? row.roles.find((r) => r.role === "reviewer")?.role
            ?? row.roles.find((r) => r.role === "editor")?.role
            ?? "customer";
          return (
            <div key={row.id} className="grid grid-cols-[1fr_auto] gap-6 py-5 items-center">
              <div>
                <div className="font-display text-xl">{row.full_name || "Sem nome"}</div>
                <div className="text-[10px] tracking-wide uppercase text-muted-foreground mt-1">{row.id.slice(0, 8)}…</div>
              </div>
              <RoleSelector current={current} onChange={(r) => setRole(row.id, r, row.roles)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-border p-6">
      <div className="font-display text-2xl mb-2">{title}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function RoleSelector({ current, onChange }: { current: Role; onChange: (r: Role) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <select
      value={current}
      disabled={busy}
      onChange={async (e) => { setBusy(true); await onChange(e.target.value as Role); setBusy(false); }}
      className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
    >
      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </select>
  );
}
