import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageRenderer, type Block } from "@/components/blocks";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Mon Parfum" },
      { name: "description", content: "A maison olfativa Mon Parfum: filosofia, perfumistas e ateliês." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  const { data: blocks } = useQuery({
    queryKey: ["page-blocks", "sobre"],
    queryFn: async () => {
      const { data: page } = await supabase.from("pages").select("id").eq("slug", "sobre").eq("status", "published").single();
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
