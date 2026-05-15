import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Mon Parfum` }] }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name,slug)")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="p-12 text-muted-foreground">Carregando…</div></div>;
  if (!p) return null;

  const inStock = (p.stock ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <nav className="text-xs text-muted-foreground mb-8">
          <Link to="/catalogo">Catálogo</Link>
          {p.categories && <> · <Link to="/categoria/$slug" params={{ slug: p.categories.slug }}>{p.categories.name}</Link></>}
        </nav>
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="aspect-[4/5] bg-muted overflow-hidden">
            {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" width={1024} height={1280} />}
          </div>
          <div className="space-y-8">
            {p.brand && <div className="eyebrow">{p.brand}</div>}
            <h1 className="font-display text-5xl leading-tight">{p.name}</h1>
            <div className="text-2xl">{formatBRL(p.price_cents)}</div>
            {p.description && <p className="text-muted-foreground leading-relaxed">{p.description}</p>}

            <dl className="grid grid-cols-2 gap-y-3 text-sm border-t border-border pt-6">
              {p.notes && (<><dt className="eyebrow">Notas</dt><dd>{p.notes}</dd></>)}
              {p.fragrance_family && (<><dt className="eyebrow">Família</dt><dd className="capitalize">{p.fragrance_family}</dd></>)}
              {p.volume_ml && (<><dt className="eyebrow">Volume</dt><dd>{p.volume_ml} ml</dd></>)}
              <dt className="eyebrow">Disponibilidade</dt>
              <dd>{inStock ? `${p.stock} em estoque` : "Esgotado"}</dd>
            </dl>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-muted">−</button>
                <span className="px-4 min-w-10 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-muted">+</button>
              </div>
              <button
                disabled={!inStock}
                onClick={() => {
                  add({ productId: p.id, slug: p.slug, name: p.name, brand: p.brand, priceCents: p.price_cents, imageUrl: p.image_url }, qty);
                  toast.success("Adicionado à sacola");
                }}
                className="flex-1 bg-foreground text-background py-3 px-6 text-sm tracking-wide hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inStock ? "Adicionar à sacola" : "Esgotado"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
