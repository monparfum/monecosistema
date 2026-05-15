import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background grid grid-cols-[220px_1fr]">
      <aside className="border-r border-border p-6 space-y-6">
        <Link to="/" className="font-display text-2xl block">Mon Parfum</Link>
        <div className="eyebrow">Admin</div>
        <nav className="space-y-2 text-sm">
          <Link to="/admin" className="block hover:underline" activeOptions={{ exact: true }} activeProps={{ className: "block underline" }}>Painel</Link>
          <Link to="/admin/produtos" className="block hover:underline" activeProps={{ className: "block underline" }}>Produtos</Link>
          <Link to="/admin/categorias" className="block hover:underline" activeProps={{ className: "block underline" }}>Categorias</Link>
          <Link to="/admin/pedidos" className="block hover:underline" activeProps={{ className: "block underline" }}>Pedidos</Link>
          <Link to="/admin/clientes" className="block hover:underline" activeProps={{ className: "block underline" }}>Clientes</Link>
        </nav>
        <Link to="/" className="text-xs text-muted-foreground border-b border-border">← Voltar à loja</Link>
      </aside>
      <main className="p-10"><Outlet /></main>
    </div>
  );
}
