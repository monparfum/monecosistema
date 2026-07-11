import { createFileRoute, Link } from "@tanstack/react-router";
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
    queryKey: ["adm-stats-v2"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [profiles, roles, orders, paid, events] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_cents").eq("status", "paid"),
        supabase.from("module_events").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      const rs = roles.data ?? [];
      const revenue = (paid.data ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
      return {
        usuarios: profiles.count ?? 0,
        admins: rs.filter((r) => r.role === "admin").length,
        editores: rs.filter((r) => r.role === "editor").length,
        pedidos: orders.count ?? 0,
        receita: revenue,
        eventos30d: events.count ?? 0,
      };
    },
  });

  const brl = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
        <StatCard label="Pedidos totais" value={data?.pedidos ?? "—"} />
        <StatCard label="Receita paga" value={data ? brl(data.receita) : "—"} />
        <StatCard label="Eventos · 30d" value={data?.eventos30d ?? "—"} />
      </StatGrid>

      <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
        {[
          { to: "/administracao/usuarios", eyebrow: "Pessoas", title: "Usuários" },
          { to: "/administracao/papeis", eyebrow: "Escopo", title: "Papéis" },
          { to: "/administracao/comunicacoes", eyebrow: "Contato", title: "Comunicações" },
          { to: "/administracao/integracoes", eyebrow: "Serviços", title: "Integrações" },
          { to: "/administracao/logs", eyebrow: "Auditoria", title: "Logs" },
          { to: "/administracao/empresa", eyebrow: "Marca", title: "Empresa" },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="bg-background p-6 hover:bg-[color:var(--cream)]/40 transition-colors">
            <div className="eyebrow">{l.eyebrow}</div>
            <div className="font-display text-2xl mt-1">{l.title}</div>
            <div className="editorial-link mt-4 text-xs">Abrir →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
