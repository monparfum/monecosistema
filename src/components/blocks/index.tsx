import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";
import heroImg from "@/assets/editorial-hero.jpg";
import experienciasImg from "@/assets/editorial-experiencias.jpg";
import workshopsImg from "@/assets/editorial-workshops.jpg";
import cursosImg from "@/assets/editorial-cursos.jpg";

const assetMap: Record<string, string> = {
  "/src/assets/editorial-hero.jpg": heroImg,
  "/src/assets/editorial-experiencias.jpg": experienciasImg,
  "/src/assets/editorial-workshops.jpg": workshopsImg,
  "/src/assets/editorial-cursos.jpg": cursosImg,
};

export const resolveImg = (url?: string): string =>
  !url ? heroImg : assetMap[url] ?? url;

export type Block = {
  id: string;
  type: string;
  position: number;
  content: Record<string, unknown>;
};

export const BLOCK_DEFS = [
  { type: "hero", label: "Hero editorial", description: "Imagem full-bleed com título serif e CTA" },
  { type: "text", label: "Texto editorial", description: "Manifesto centralizado" },
  { type: "grid", label: "Grid editorial", description: "Três chapitres com imagem, título e link" },
  { type: "featured_products", label: "Produtos em destaque", description: "Coleção puxada do catálogo" },
  { type: "cta", label: "CTA editorial", description: "Faixa com chamada e botão" },
  { type: "image_text", label: "Imagem + Texto", description: "Split 50/50 com imagem e bloco textual" },
] as const;

const get = (c: Record<string, unknown>, k: string, fallback = ""): string =>
  typeof c[k] === "string" ? (c[k] as string) : fallback;

function HeroBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[92vh] min-h-[680px] w-full">
        <img src={resolveImg(get(c, "image"))} alt={get(c, "title", "Hero")} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1400px] px-8 h-full flex flex-col justify-between py-16">
          <div className="fade-in"><span className="eyebrow">{get(c, "eyebrow")}</span></div>
          <div className="fade-in-slow max-w-2xl">
            <h1 className="font-display text-[clamp(3rem,7.5vw,7.5rem)] leading-[0.92] tracking-tight whitespace-pre-line">
              {get(c, "title")}
            </h1>
            {get(c, "subtitle") && (
              <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">{get(c, "subtitle")}</p>
            )}
            {get(c, "ctaLabel") && get(c, "ctaHref") && (
              <div className="mt-10">
                <Link to={get(c, "ctaHref")} className="editorial-link">{get(c, "ctaLabel")}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TextBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-32 text-center fade-in">
      {get(c, "eyebrow") && <div className="eyebrow mb-10">— {get(c, "eyebrow")} —</div>}
      <p className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.25] text-foreground/90 whitespace-pre-line">
        {get(c, "body")}
      </p>
    </section>
  );
}

function GridBlock({ c }: { c: Record<string, unknown> }) {
  const items = (Array.isArray(c.items) ? c.items : []) as Array<Record<string, string>>;
  return (
    <section className="border-t border-border py-32">
      <div className="mx-auto max-w-[1400px] px-8">
        {get(c, "eyebrow") && <div className="eyebrow mb-12">— {get(c, "eyebrow")} —</div>}
        <div className="grid md:grid-cols-3 gap-10">
          {items.map((it, i) => (
            <Link key={i} to={it.href || "/"} className="group block">
              <div className="aspect-[4/5] overflow-hidden mb-6">
                <img src={resolveImg(it.image)} alt={it.title} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-[1.03]" />
              </div>
              <div className="eyebrow mb-2">{it.subtitle}</div>
              <h3 className="font-display text-3xl leading-tight">{it.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProductsBlock({ c }: { c: Record<string, unknown> }) {
  const limit = typeof c.limit === "number" ? c.limit : 3;
  const { data } = useQuery({
    queryKey: ["block-featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("slug,name,brand,price_cents,image_url")
        .eq("featured", true).eq("active", true).limit(limit);
      if (error) throw error;
      return data;
    },
  });
  return (
    <section className="border-t border-border py-32">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="mb-16">
          {get(c, "eyebrow") && <div className="eyebrow mb-6">— {get(c, "eyebrow")} —</div>}
          {get(c, "title") && <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95]">{get(c, "title")}</h2>}
        </div>
        <div className="grid md:grid-cols-3 gap-x-10 gap-y-20">
          {data?.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
        <div className="mt-16 text-center">
          <Link to="/catalogo" className="editorial-link">Découvrir la collection</Link>
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <section className="border-t border-border py-32">
      <div className="mx-auto max-w-3xl px-8 text-center">
        {get(c, "eyebrow") && <div className="eyebrow mb-6">— {get(c, "eyebrow")} —</div>}
        <h2 className="font-display text-[clamp(2.25rem,4vw,4rem)] leading-[1.05]">{get(c, "title")}</h2>
        {get(c, "body") && <p className="mt-6 text-muted-foreground leading-relaxed">{get(c, "body")}</p>}
        {get(c, "ctaLabel") && get(c, "ctaHref") && (
          <div className="mt-10">
            <Link to={get(c, "ctaHref")} className="editorial-link">{get(c, "ctaLabel")}</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ImageTextBlock({ c }: { c: Record<string, unknown> }) {
  const reverse = c.reverse === true;
  return (
    <section className="border-t border-border py-32">
      <div className="mx-auto max-w-[1400px] px-8 grid lg:grid-cols-2 gap-16 items-center">
        <div className={reverse ? "lg:order-2" : ""}>
          <div className="aspect-[5/6] overflow-hidden">
            <img src={resolveImg(get(c, "image"))} alt={get(c, "title", "Imagem")} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className={reverse ? "lg:order-1 lg:pr-8" : "lg:pl-8"}>
          {get(c, "eyebrow") && <div className="eyebrow mb-6">— {get(c, "eyebrow")} —</div>}
          <h2 className="font-display text-[clamp(2rem,3.5vw,3.5rem)] leading-[1.05]">{get(c, "title")}</h2>
          {get(c, "body") && <p className="mt-8 text-muted-foreground leading-relaxed">{get(c, "body")}</p>}
        </div>
      </div>
    </section>
  );
}

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "hero": return <HeroBlock c={block.content} />;
    case "text": return <TextBlock c={block.content} />;
    case "grid": return <GridBlock c={block.content} />;
    case "featured_products": return <FeaturedProductsBlock c={block.content} />;
    case "cta": return <CtaBlock c={block.content} />;
    case "image_text": return <ImageTextBlock c={block.content} />;
    default: return null;
  }
}

export function PageRenderer({ blocks }: { blocks: Block[] }) {
  return <>{blocks.map((b) => <BlockRenderer key={b.id} block={b} />)}</>;
}
