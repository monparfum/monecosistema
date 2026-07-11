import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { SkeletonRow } from "@/components/skeleton-row";
import { EmptyState } from "@/components/empty-state";
import { useState } from "react";
import { toast } from "sonner";

const ALL_ROLES = ["admin", "editor", "reviewer", "customer"] as const;
type Role = typeof ALL_ROLES[number];

export const Route = createFileRoute("/_administracao/administracao/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Administração" }] }),
  component: Users,
});

function Users() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["adm-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at"),
        supabase.from("user_roles").select("id, user_id, role"),
      ]);
      const rmap = new Map<string, { role: Role; id: string }[]>();
      (roles.data ?? []).forEach((r) => {
        const arr = rmap.get(r.user_id) ?? [];
        arr.push({ role: r.role as Role, id: r.id });
        rmap.set(r.user_id, arr);
      });
      return (profiles.data ?? []).map((p) => ({
        ...p,
        roles: rmap.get(p.id) ?? [],
      }));
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: Role; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Papéis atualizados"); qc.invalidateQueries({ queryKey: ["adm-users"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((u) => !q || `${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="Administração" title="Usuários" description="Toda pessoa com conta. Clique nos papéis para conceder ou revogar." />
      <div className="border-y border-border py-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
      </div>
      {isLoading ? (
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={3} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhum usuário." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {filtered.map((u) => {
            const roleSet = new Set(u.roles.map((r) => r.role));
            return (
              <div key={u.id} className="py-5 grid grid-cols-[1.4fr_2fr_auto] gap-6 items-center">
                <div>
                  <div className="font-display text-lg">{u.full_name || "Sem nome"}</div>
                  <div className="text-sm text-muted-foreground">{u.phone ?? "—"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => {
                    const has = roleSet.has(r);
                    return (
                      <button
                        key={r}
                        onClick={() => toggleRole.mutate({ userId: u.id, role: r, has })}
                        disabled={toggleRole.isPending}
                        className={`eyebrow px-3 py-1.5 border transition-colors ${has ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
                <div className="eyebrow">{new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
