import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  // Reativo à navegação (window.location não re-renderiza o layout)
  const pathname = useLocation({ select: (l) => l.pathname });
  const isModules = pathname === "/admin/modulos";
  return (
    <div className="min-h-screen bg-background grid grid-cols-[240px_1fr]">
      <aside className="border-r border-border p-6 flex flex-col gap-6 sticky top-0 h-screen">
        <div>
          <Link to="/" className="block" aria-label="MON PARFUM — site"><img src="/logo-mon.png" alt="MON Parfum" style={{ height: 40, width: "auto" }} /></Link>
          <div className="eyebrow mt-1">{isModules ? "Admin" : "Módulo · E-commerce"}</div>
        </div>

        <Link to="/admin/modulos" className="eyebrow text-muted-foreground hover:text-foreground">
          ← Módulos
        </Link>

        {!isModules && (
          <nav className="space-y-1 text-sm border-t border-border pt-6">
            <SideLink to="/admin" exact>Painel</SideLink>
            <SideLink to="/admin/pedidos">Pedidos</SideLink>
            <SideLink to="/admin/produtos">Produtos</SideLink>
            <SideLink to="/admin/estoque">Estoque</SideLink>
            <SideLink to="/admin/categorias">Categorias</SideLink>
            <SideLink to="/admin/cupons">Cupons</SideLink>
            <SideLink to="/admin/clientes">Clientes</SideLink>
            <SideLink to="/admin/configuracoes">Configurações</SideLink>
          </nav>
        )}

        <div className="mt-auto pt-6 border-t border-border space-y-2">
          <Link to="/studio" className="eyebrow text-muted-foreground hover:text-foreground block">Estúdio →</Link>
          <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground block">Ver site →</Link>
        </div>
      </aside>
      <main className="p-10"><Outlet /></main>
    </div>
  );
}

function SideLink({ to, exact, children }: { to: string; exact?: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "block py-2 px-3 bg-[color:var(--muted)] text-foreground border-l-2 border-foreground" }}
      inactiveProps={{ className: "block py-2 px-3 text-muted-foreground hover:text-foreground border-l-2 border-transparent" }}
    >
      {children}
    </Link>
  );
}
