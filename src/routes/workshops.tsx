import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageRenderer, type Block } from "@/components/blocks";

export const Route = createFileRoute("/workshops")({
  head: () => ({
    meta: [
      { title: "Workshops corporativos — Mon Parfum" },
      { name: "description", content: "Team building sensorial, branding olfativo e experiências premium para empresas." },
    ],
  }),
  component: Workshops,
});

function Workshops() {
  const { data: blocks } = useQuery({
    queryKey: ["page-blocks", "workshops"],
    queryFn: async () => {
      const { data: page } = await supabase.from("pages").select("id").eq("slug", "workshops").eq("status", "published").single();
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
