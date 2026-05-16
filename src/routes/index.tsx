import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageRenderer, type Block } from "@/components/blocks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mon Parfum — Maison olfativa contemporânea" },
      { name: "description", content: "Perfumes autorais, experiências sensoriais e educação em perfumaria de luxo. Uma maison editorial entre São Paulo e Paris." },
      { property: "og:title", content: "Mon Parfum — Maison olfativa contemporânea" },
      { property: "og:description", content: "Um ecossistema de perfumaria de autor." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: blocks } = useQuery({
    queryKey: ["page-blocks", "home"],
    queryFn: async () => {
      const { data: page } = await supabase.from("pages").select("id").eq("slug", "home").eq("status", "published").single();
      if (!page) return [];
      const { data } = await supabase.from("page_blocks").select("*").eq("page_id", page.id).order("position");
      return (data ?? []) as Block[];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {blocks && <PageRenderer blocks={blocks} />}
      <SiteFooter />
    </div>
  );
}
