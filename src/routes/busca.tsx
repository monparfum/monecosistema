import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { z } from "zod";

export const Route = createFileRoute("/busca")({
  validateSearch: (s) => z.object({ q: z.string().default("") }).parse(s),
  head: () => ({ meta: [{ title: "Busca — Mon Parfum" }] }),
  component: Busca,
});

function Busca() {
  const { q } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q) return [];
      const { data, error } = await supabase
        .from("products")
        .select("slug,name,brand,price_cents,image_url")
        .eq("active", true)
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%,notes.ilike.%${q}%`);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <div className="eyebrow mb-3">Resultados para</div>
        <h1 className="font-display text-5xl">"{q}"</h1>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        {isLoading ? <div className="text-muted-foreground">Buscando…</div>
          : data?.length === 0 ? <div className="text-muted-foreground">Nenhum resultado.</div>
          : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">{data?.map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
      </section>
      <SiteFooter />
    </div>
  );
}
