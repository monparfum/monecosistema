import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageRenderer, type Block } from "@/components/blocks";

export const Route = createFileRoute("/$slug")({
  component: DynamicPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <div className="eyebrow mb-4">404</div>
        <h1 className="font-display text-5xl">Página não encontrada</h1>
        <p className="mt-6 text-muted-foreground">Este endereço não existe ou ainda não foi publicado.</p>
      </div>
      <SiteFooter />
    </div>
  ),
});

function DynamicPage() {
  const { slug } = Route.useParams();

  // Studio preview mode bypasses "published" filter so editors can preview drafts
  const isStudio = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("studio") === "1";

  const { data, isLoading } = useQuery({
    queryKey: ["dynamic-page", slug, isStudio],
    queryFn: async () => {
      let q = supabase.from("pages").select("id,title,seo_title,seo_description,status").eq("slug", slug);
      if (!isStudio) q = q.eq("status", "published");
      const { data: page } = await q.maybeSingle();
      if (!page) return null;
      const { data: blocks } = await supabase
        .from("page_blocks").select("*").eq("page_id", page.id).order("position");
      return { page, blocks: (blocks ?? []) as Block[] };
    },
  });

  if (isLoading) return null;
  if (!data) throw notFound();

  if (typeof document !== "undefined") {
    document.title = data.page.seo_title || `${data.page.title} — Mon Parfum`;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <PageRenderer blocks={data.blocks} />
      <SiteFooter />
    </div>
  );
}
