import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE_PAGES } from "@/lib/site-schema";

export const Route = createFileRoute("/_admin/admin/site/")({ component: SitePages });

function SitePages() {
  const { data } = useQuery({
    queryKey: ["admin-site-updated"],
    queryFn: async () => new Map(((await supabase.from("site_content").select("page, updated_at")).data ?? []).map((r) => [r.page, r.updated_at])),
  });
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="eyebrow mb-2">Site</div>
        <h1 className="font-display text-4xl">Páginas do site</h1>
        <p className="text-sm text-muted-foreground mt-2">Textos, fotos e perguntas de cada página. Preço, foto e descrição de cursos e kits ficam em <Link to="/admin/produtos" className="underline">Produtos</Link>.</p>
      </div>
      <div className="border-y border-border divide-y divide-border">
        {SITE_PAGES.map((p) => (
          <Link key={p.slug} to="/admin/site/$page" params={{ page: p.slug }} className="flex items-center justify-between py-4 hover:bg-muted/40 px-2">
            <div>
              <div className="font-display text-xl">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.sections.map((s) => s.title).join(" · ")}</div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {data?.get(p.slug) ? `editado em ${new Date(data.get(p.slug)!).toLocaleDateString("pt-BR")}` : "texto padrão"}
              <div className="underline mt-1">Editar →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
