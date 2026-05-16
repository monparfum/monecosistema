import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageRenderer, type Block } from "@/components/blocks";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Mon Parfum" },
      { name: "description", content: "Encontros, clube olfativo e círculos privados de discussão." },
    ],
  }),
  component: Comunidade,
});

function Comunidade() {
  const { data: blocks } = useQuery({
    queryKey: ["page-blocks", "comunidade"],
    queryFn: async () => {
      const { data: page } = await supabase.from("pages").select("id").eq("slug", "comunidade").eq("status", "published").single();
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
