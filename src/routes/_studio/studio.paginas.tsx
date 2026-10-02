import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE_PAGES } from "@/lib/site-schema";

export const Route = createFileRoute("/_studio/studio/paginas")({ component: StudioPagesRoute });

function StudioPagesRoute() {
  const location = useLocation();
  if (location.pathname !== "/studio/paginas") return <Outlet />;
  return <PagesList />;
}

function PagesList() {
  const { data } = useQuery({
    queryKey: ["admin-site-updated"],
    queryFn: async () => new Map(((await supabase.from("site_content").select("page, updated_at")).data ?? []).map((r) => [r.page, r.updated_at])),
  });
  return (
    <div className="space-y-10">
      <div>
        <div className="eyebrow mb-3">Studio</div>
        <h1 className="font-display text-5xl">Páginas do site</h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">Textos, fotos, listas e perguntas de cada página, com prévia ao vivo. Preço, foto e conteúdo de cada curso ou kit ficam em <Link to="/admin/produtos" className="underline">Comércio › Produtos</Link>.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {SITE_PAGES.map((p) => (
          <Link key={p.slug} to="/studio/paginas/$slug" params={{ slug: p.slug }} className="bg-background p-6 hover:bg-[color:var(--muted)]/30 transition-colors">
            <div className="flex justify-between items-start gap-4">
              <div className="font-display text-2xl">{p.title}</div>
              <span className="eyebrow text-muted-foreground shrink-0">{data?.get(p.slug) ? `editado ${new Date(data.get(p.slug)!).toLocaleDateString("pt-BR")}` : "padrão"}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">{p.sections.map((s) => s.title).join(" · ")}</div>
            <div className="editorial-link text-xs mt-4">Editar →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
