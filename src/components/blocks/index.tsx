import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";
import { toast } from "sonner";
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
  { type: "banner", label: "Banner editorial", description: "Split imagem + texto e CTA (capítulo)" },
  { type: "text", label: "Texto editorial", description: "Manifesto centralizado" },
  { type: "quote", label: "Citação", description: "Frase grande em itálico com atribuição" },
  { type: "grid", label: "Grid editorial", description: "Três chapitres com imagem, título e link" },
  { type: "cards_list", label: "Lista de cards", description: "Grid 2/3 colunas de cards textuais com CTA" },
  { type: "text_columns", label: "Colunas de texto", description: "3 colunas curtas (pilares)" },
  { type: "featured_products", label: "Produtos em destaque", description: "Coleção puxada do catálogo" },
  { type: "cta", label: "CTA editorial", description: "Faixa com chamada e botão" },
  { type: "image_text", label: "Imagem + Texto", description: "Split 50/50 com imagem e bloco textual" },
  { type: "newsletter", label: "Newsletter", description: "Captura de e-mail editorial" },
  { type: "faq", label: "FAQ", description: "Lista de perguntas e respostas" },
] as const;

const get = (c: Record<string, unknown>, k: string, fallback = ""): string =>
  typeof c[k] === "string" ? (c[k] as string) : fallback;

function HeroBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[500px] w-full group overflow-hidden">
        <img 
          src={resolveImg(get(c, "image"))} 
          alt={get(c, "title", "Hero")} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[6000ms] ease-out group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/20 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1400px] px-10 h-full flex flex-col justify-center gap-8">
          <div className="fade-in space-y-4">
            <div className="w-12 h-px bg-gold/50" />
            <span className="eyebrow gold tracking-[0.45em]">{get(c, "eyebrow")}</span>
          </div>
          <div className="fade-in-slow max-w-4xl">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,5rem)] leading-[0.88] tracking-[-0.04em] whitespace-pre-line text-foreground/95 italic-serif">
              {get(c, "title")}
            </h1>
            {get(c, "subtitle") && (
              <p className="mt-6 text-sm md:text-base text-muted-foreground/80 max-w-xl leading-relaxed font-light">
                {get(c, "subtitle")}
              </p>
            )}
            {get(c, "ctaLabel") && get(c, "ctaHref") && (
              <div className="mt-10">
                <Link to={get(c, "ctaHref")} className="editorial-link !text-[10px] tracking-[0.3em]">
                  {get(c, "ctaLabel")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BannerBlock({ c }: { c: Record<string, unknown> }) {
  const reverse = c.reverse === true;
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-20 pb-16 grid lg:grid-cols-12 gap-12 items-center">
      <div className={`lg:col-span-5 space-y-6 ${reverse ? "lg:order-1" : "lg:order-2"}`}>
        {get(c, "eyebrow") && <div className="eyebrow gold">{get(c, "eyebrow")}</div>}
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">{get(c, "title")}</h1>
        {get(c, "body") && <p className="text-muted-foreground leading-relaxed">{get(c, "body")}</p>}
        {get(c, "ctaLabel") && get(c, "ctaHref") && (
          <Link to={get(c, "ctaHref")} className="editorial-link text-sm">{get(c, "ctaLabel")}</Link>
        )}
      </div>
      <div className={`lg:col-span-7 ${reverse ? "lg:order-2" : "lg:order-1"}`}>
        <div className="aspect-[4/3] overflow-hidden">
          <img src={resolveImg(get(c, "image"))} alt={get(c, "title", "Banner")} className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function TextBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center fade-in">
      {get(c, "eyebrow") && <div className="eyebrow gold mb-6">{get(c, "eyebrow")}</div>}
      <p className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.25] text-foreground/90 whitespace-pre-line">
        {get(c, "body")}
      </p>
    </section>
  );
}

function QuoteBlock({ c }: { c: Record<string, unknown> }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="font-display text-3xl md:text-4xl leading-snug italic whitespace-pre-line">
        “{get(c, "body")}”
      </p>
      {get(c, "attribution") && <div className="eyebrow mt-8">{get(c, "attribution")}</div>}
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

function CardsListBlock({ c }: { c: Record<string, unknown> }) {
  const items = (Array.isArray(c.items) ? c.items : []) as Array<Record<string, string>>;
  const cols = typeof c.columns === "number" ? c.columns : 2;
  const gridCls = cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20 border-t border-border">
      {get(c, "eyebrow") && <div className="eyebrow mb-10">{get(c, "eyebrow")}</div>}
      <div className={`grid ${gridCls} gap-px bg-border`}>
        {items.map((it, i) => (
          <article key={i} className="bg-background p-10 md:p-12 flex flex-col">
            {it.eyebrow && <div className="eyebrow mb-4">{it.eyebrow}</div>}
            <h2 className="font-display text-3xl md:text-4xl mb-4">{it.title}</h2>
            {it.body && <p className="text-sm text-muted-foreground leading-relaxed flex-1">{it.body}</p>}
            {(it.meta || (it.ctaLabel && it.ctaHref)) && (
              <div className="mt-8 flex items-end justify-between">
                {it.meta ? <div className="font-display text-2xl">{it.meta}</div> : <span />}
                {it.ctaLabel && it.ctaHref && (
                  <Link to={it.ctaHref} className="editorial-link text-xs">{it.ctaLabel}</Link>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function TextColumnsBlock({ c }: { c: Record<string, unknown> }) {
  const items = (Array.isArray(c.items) ? c.items : []) as Array<Record<string, string>>;
  const cols = typeof c.columns === "number" ? c.columns : 3;
  const gridCls = cols === 2 ? "md:grid-cols-2" : cols === 4 ? "md:grid-cols-4" : "md:grid-cols-3";
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-16 border-t border-border">
      {get(c, "eyebrow") && <div className="eyebrow mb-10">{get(c, "eyebrow")}</div>}
      <div className={`grid ${gridCls} gap-px bg-border`}>
        {items.map((it, i) => (
          <div key={i} className="bg-background p-12">
            <h2 className="font-display text-3xl mb-4">{it.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{it.body}</p>
          </div>
        ))}
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

function NewsletterBlock({ c }: { c: Record<string, unknown> }) {
  const [email, setEmail] = useState("");
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      {get(c, "eyebrow") && <div className="eyebrow gold mb-6">{get(c, "eyebrow")}</div>}
      <p className="font-display text-2xl md:text-3xl leading-snug">{get(c, "title")}</p>
      <form
        onSubmit={(e) => { e.preventDefault(); toast.success("Obrigado — em breve você receberá nosso diário."); setEmail(""); }}
        className="mt-10 flex items-center gap-3 border-b border-border max-w-md mx-auto"
      >
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={get(c, "placeholder", "seu e-mail")}
          className="flex-1 bg-transparent py-3 text-sm focus:outline-none"
        />
        <button className="eyebrow">{get(c, "ctaLabel", "Assinar")} →</button>
      </form>
    </section>
  );
}

function FaqBlock({ c }: { c: Record<string, unknown> }) {
  const items = (Array.isArray(c.items) ? c.items : []) as Array<Record<string, string>>;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 border-t border-border">
      {get(c, "eyebrow") && <div className="eyebrow mb-4">{get(c, "eyebrow")}</div>}
      {get(c, "title") && <h2 className="font-display text-4xl md:text-5xl mb-12">{get(c, "title")}</h2>}
      <div className="divide-y divide-border border-t border-b border-border">
        {items.map((it, i) => (
          <div key={i} className="py-6">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-start text-left gap-6">
              <span className="font-display text-xl md:text-2xl">{it.question}</span>
              <span className="eyebrow shrink-0 pt-2">{open === i ? "—" : "+"}</span>
            </button>
            {open === i && <p className="mt-4 text-muted-foreground leading-relaxed text-sm">{it.answer}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "hero": return <HeroBlock c={block.content} />;
    case "banner": return <BannerBlock c={block.content} />;
    case "text": return <TextBlock c={block.content} />;
    case "quote": return <QuoteBlock c={block.content} />;
    case "grid": return <GridBlock c={block.content} />;
    case "cards_list": return <CardsListBlock c={block.content} />;
    case "text_columns": return <TextColumnsBlock c={block.content} />;
    case "featured_products": return <FeaturedProductsBlock c={block.content} />;
    case "cta": return <CtaBlock c={block.content} />;
    case "image_text": return <ImageTextBlock c={block.content} />;
    case "newsletter": return <NewsletterBlock c={block.content} />;
    case "faq": return <FaqBlock c={block.content} />;
    default: return null;
  }
}

function useStudioMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("studio") === "1";
}

export function PageRenderer({ blocks }: { blocks: Block[] }) {
  const studio = useStudioMode();
  if (!studio) return <>{blocks.map((b) => <BlockRenderer key={b.id} block={b} />)}</>;
  return (
    <>
      <style>{`
        [data-studio-block]{position:relative;outline:1px dashed transparent;transition:outline-color .15s;cursor:pointer;}
        [data-studio-block]:hover{outline-color:hsl(var(--foreground,#000)/.4);}
        [data-studio-block][data-studio-selected="true"]{outline:2px solid hsl(var(--foreground,#000));}
        [data-studio-block]::before{content:attr(data-studio-label);position:absolute;top:6px;left:6px;z-index:50;background:#000;color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:3px 6px;opacity:0;transition:opacity .15s;pointer-events:none;}
        [data-studio-block]:hover::before,[data-studio-block][data-studio-selected="true"]::before{opacity:1;}
      `}</style>
      {blocks.map((b) => {
        const def = BLOCK_DEFS.find((d) => d.type === b.type);
        return (
          <div
            key={b.id}
            data-studio-block
            data-studio-block-id={b.id}
            data-studio-label={def?.label ?? b.type}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.parent?.postMessage({ type: "studio:select", blockId: b.id }, "*");
              document.querySelectorAll('[data-studio-selected="true"]').forEach((el) => el.removeAttribute("data-studio-selected"));
              (e.currentTarget as HTMLElement).setAttribute("data-studio-selected", "true");
            }}
          >
            <BlockRenderer block={b} />
          </div>
        );
      })}
    </>
  );
}
