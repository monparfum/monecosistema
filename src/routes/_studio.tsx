import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_studio")({
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: StudioLayout,
});

function StudioLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-[240px_1fr]">
      <aside className="border-r border-border px-6 py-8 sticky top-0 h-screen flex flex-col">
        <Link to="/" className="font-display text-2xl leading-none">Mon Parfum</Link>
        <div className="eyebrow mt-1 mb-10">Studio</div>
        <nav className="flex-1 space-y-1 text-sm">
          <StudioLink to="/studio" exact>Visão geral</StudioLink>
          <StudioLink to="/studio/paginas">Páginas</StudioLink>
          <StudioLink to="/studio/midia">Mídia</StudioLink>
        </nav>
        <div className="space-y-2 pt-6 border-t border-border">
          <Link to="/admin" className="block eyebrow text-muted-foreground hover:text-foreground">Comércio</Link>
          <Link to="/" className="block eyebrow text-muted-foreground hover:text-foreground">← Site</Link>
        </div>
      </aside>
      <main className="px-12 py-10 max-w-[1400px]"><Outlet /></main>
    </div>
  );
}

function StudioLink({ to, exact, children }: { to: string; exact?: boolean; children: React.ReactNode }) {
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
