import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { z } from "zod";

const search = z.object({ familia: z.string().optional() });

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s) => search.parse(s),
  head: () => ({ meta: [{ title: "Catálogo — Mon Parfum" }, { name: "description", content: "Coleção completa de perfumes Mon Parfum." }] }),
  component: Catalogo,
});

function Catalogo() {
  const { familia } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["products", familia ?? null],
    queryFn: async () => {
      let q = supabase.from("products").select("slug,name,brand,price_cents,image_url,fragrance_family").eq("active", true).order("name");
      if (familia) q = q.eq("fragrance_family", familia);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="eyebrow mb-3">Catálogo</div>
        <h1 className="font-display text-5xl">{familia ? `Família ${familia}` : "Toda a coleção"}</h1>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        {isLoading ? (
          <div className="text-muted-foreground">Carregando…</div>
        ) : data?.length === 0 ? (
          <div className="text-muted-foreground">Nenhum produto encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {data?.map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
