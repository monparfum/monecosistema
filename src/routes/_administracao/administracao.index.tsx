import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";

export const Route = createFileRoute("/_administracao/administracao/")({
  head: () => ({ meta: [{ title: "Administração — Mon Parfum" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const { data } = useQuery({
    queryKey: ["adm-stats"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
      ]);
      const rs = roles.data ?? [];
      return {
        usuarios: profiles.count ?? 0,
        admins: rs.filter((r) => r.role === "admin").length,
        editores: rs.filter((r) => r.role === "editor").length,
        revisores: rs.filter((r) => r.role === "reviewer").length,
      };
    },
  });
  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · Administração"
        title="Plataforma"
        description="Usuários, papéis, integrações e segurança do ecossistema."
      />
      <StatGrid>
        <StatCard label="Usuários" value={data?.usuarios ?? "—"} />
        <StatCard label="Administradores" value={data?.admins ?? "—"} />
        <StatCard label="Editores" value={data?.editores ?? "—"} />
        <StatCard label="Revisores" value={data?.revisores ?? "—"} />
      </StatGrid>
    </div>
  );
}
