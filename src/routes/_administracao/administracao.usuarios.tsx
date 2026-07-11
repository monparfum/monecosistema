import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { SkeletonRow } from "@/components/skeleton-row";
import { EmptyState } from "@/components/empty-state";
import { useState } from "react";

export const Route = createFileRoute("/_administracao/administracao/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Administração" }] }),
  component: Users,
});

function Users() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["adm-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const rmap = new Map<string, string[]>();
      (roles.data ?? []).forEach((r) => {
        const arr = rmap.get(r.user_id) ?? [];
        arr.push(r.role as string);
        rmap.set(r.user_id, arr);
      });
      return (profiles.data ?? []).map((p) => ({
        ...p,
        roles: rmap.get(p.id) ?? ["customer"],
      }));
    },
  });

  const filtered = (data ?? []).filter((u) => !q || `${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="Administração" title="Usuários" description="Toda pessoa com conta na plataforma." />
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
          {filtered.map((u) => (
            <div key={u.id} className="py-4 grid grid-cols-[1.4fr_1fr_auto] gap-6 items-center">
              <div>
                <div className="font-display text-lg">{u.full_name || "Sem nome"}</div>
                <div className="text-sm text-muted-foreground">{u.phone ?? "—"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.roles.map((r) => (
                  <span key={r} className="eyebrow border border-border px-2 py-1">{r}</span>
                ))}
              </div>
              <div className="eyebrow">{new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
