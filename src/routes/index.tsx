import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import heroImg from "@/assets/hero-perfume.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mon Parfum — Boutique de perfumes raros" },
      { name: "description", content: "Curadoria editorial de perfumes autorais. Composições raras de maisons independentes." },
      { property: "og:title", content: "Mon Parfum — Boutique de perfumes raros" },
      { property: "og:description", content: "Curadoria editorial de perfumes autorais." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,name,brand,price_cents,image_url")
        .eq("featured", true)
        .eq("active", true)
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center pt-12 pb-24">
        <div className="space-y-8">
          <div className="eyebrow">Edição de outono · 2026</div>
          <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">
            A perfumaria,<br />como um manuscrito.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Composições raras, selecionadas com critério editorial. Cada frasco, uma assinatura.
          </p>
          <div className="flex gap-6 pt-2">
            <Link to="/catalogo" className="border-b-2 border-foreground pb-1 text-sm font-medium hover:opacity-70">
              Ver coleção
            </Link>
            <Link to="/catalogo" search={{ familia: "amadeirado" } as never} className="border-b border-border pb-1 text-sm text-muted-foreground hover:text-foreground">
              Amadeirados
            </Link>
          </div>
        </div>
        <div className="aspect-[4/5] bg-muted overflow-hidden">
          <img src={heroImg} alt="Frasco de perfume Mon Parfum" width={1600} height={1200} className="w-full h-full object-cover" />
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="eyebrow mb-3">Em destaque</div>
            <h2 className="font-display text-4xl">Composições da temporada</h2>
          </div>
          <Link to="/catalogo" className="text-sm border-b border-border hover:border-foreground pb-1">
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {featured?.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-24 border-t border-border">
        <div className="eyebrow mb-3">Famílias olfativas</div>
        <h2 className="font-display text-4xl mb-12">Encontre seu universo</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {cats?.map((c) => (
            <Link key={c.id} to="/categoria/$slug" params={{ slug: c.slug }} className="bg-background p-8 group hover:bg-muted transition-colors">
              <div className="font-display text-2xl mb-2 group-hover:translate-x-1 transition-transform">{c.name}</div>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
