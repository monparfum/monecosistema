import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Mon Parfum` }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: cat } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: products } = useQuery({
    queryKey: ["category-products", slug],
    enabled: !!cat?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("slug,name,brand,price_cents,image_url").eq("active", true).eq("category_id", cat!.id).order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="eyebrow mb-3">Categoria</div>
        <h1 className="font-display text-5xl">{cat?.name ?? slug}</h1>
        {cat?.description && <p className="text-muted-foreground mt-3 max-w-xl">{cat.description}</p>}
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products?.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
