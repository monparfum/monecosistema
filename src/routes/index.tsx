import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import heroImg from "@/assets/editorial-hero.jpg";
import experienciasImg from "@/assets/editorial-experiencias.jpg";
import workshopsImg from "@/assets/editorial-workshops.jpg";
import cursosImg from "@/assets/editorial-cursos.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mon Parfum — Maison olfativa contemporânea" },
      { name: "description", content: "Perfumes autorais, experiências sensoriais e educação em perfumaria de luxo. Uma maison editorial entre São Paulo e Paris." },
      { property: "og:title", content: "Mon Parfum — Maison olfativa contemporânea" },
      { property: "og:description", content: "Um ecossistema de perfumaria de autor." },
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
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Cinematic full-bleed hero */}
      <section className="relative grain vignette overflow-hidden">
        <div className="relative h-[92vh] min-h-[680px] w-full">
          <img
            src={heroImg}
            alt="Frasco de perfume Mon Parfum em mármore escuro com luz dourada e fumaça"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-8 h-full flex flex-col justify-between py-16">
            <div className="fade-in flex items-center justify-between">
              <span className="eyebrow gold">Édition Nº 01 — MMXXVI</span>
              <span className="eyebrow hidden md:inline">Paris · São Paulo</span>
            </div>
            <div className="fade-in-slow max-w-3xl">
              <h1 className="font-display text-[clamp(3.5rem,9vw,9rem)] leading-[0.88] tracking-tight">
                Le parfum,<br />
                <em className="italic text-[color:var(--gold)]">une langue</em><br />
                silencieuse.
              </h1>
              <div className="mt-10 flex items-center gap-10">
                <Link to="/catalogo" className="editorial-link">La collection</Link>
                <Link to="/experiencias" className="editorial-link text-muted-foreground">Les expériences</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto — single editorial paragraph */}
      <section className="mx-auto max-w-4xl px-8 py-40 text-center fade-in">
        <div className="eyebrow gold mb-10">— Manifeste —</div>
        <p className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.25] text-foreground/90">
          O perfume é a mais íntima das artes. Uma assinatura invisível
          que carrega memória, lugar e desejo. Cada criação Mon Parfum nasce
          de um gesto editorial — pesquisa, matéria-prima rara, intenção.
          Não fazemos produtos. Compomos atmosferas.
        </p>
      </section>

      {/* Editorial chapter — Experiences */}
      <EditorialChapter
        chapter="II"
        eyebrow="Expériences sensorielles"
        title={<>Uma jornada<br /><em className="italic">olfativa privada.</em></>}
        text="Imersões em ateliê conduzidas pelos nossos perfumistas. Composição à medida, degustações cegas e cerimônias sensoriais em ambientes desenhados para a contemplação."
        cta={{ to: "/experiencias", label: "Réserver une session" }}
        image={experienciasImg}
        imageAlt="Mãos segurando mouillettes em ateliê de perfumaria com luz quente"
        reverse={false}
      />

      {/* Editorial chapter — Workshops */}
      <EditorialChapter
        chapter="III"
        eyebrow="Workshops d'auteur"
        title={<>Branding olfativo<br /><em className="italic">sob medida.</em></>}
        text="Encontros olfativos desenhados para maisons, lançamentos e equipes. Composição de assinaturas exclusivas em nossos ateliês de Paris e São Paulo."
        cta={{ to: "/workshops", label: "Solliciter une proposition" }}
        image={workshopsImg}
        imageAlt="Ateliê parisiense com decanters de cristal sobre mármore"
        reverse
      />

      {/* La Collection — editorial product showcase */}
      <section className="relative border-t border-border py-40">
        <div className="mx-auto max-w-[1400px] px-8">
          <div className="grid md:grid-cols-12 gap-12 items-end mb-24">
            <div className="md:col-span-7">
              <div className="eyebrow gold mb-8">Chapitre IV — La Collection</div>
              <h2 className="font-display text-[clamp(3rem,6vw,6rem)] leading-[0.95] tracking-tight">
                Objets de désir,<br />
                <em className="italic text-muted-foreground">non un catalogue.</em>
              </h2>
            </div>
            <p className="md:col-span-4 md:col-start-9 text-base text-muted-foreground leading-relaxed">
              Frascos editoriais que carregam composições raras. Cada peça —
              uma narrativa olfativa completa, da matéria-prima ao gesto final.
            </p>
          </div>
          {featured && featured.length > 0 && (
            <div className="grid md:grid-cols-3 gap-x-10 gap-y-20">
              {featured.map((p) => <ProductCard key={p.slug} p={p} />)}
            </div>
          )}
          <div className="mt-24 text-center">
            <Link to="/catalogo" className="editorial-link">Découvrir la collection</Link>
          </div>
        </div>
      </section>

      {/* Editorial chapter — Cursos */}
      <EditorialChapter
        chapter="V"
        eyebrow="École Mon Parfum"
        title={<>L'éducation<br /><em className="italic">d'un nez.</em></>}
        text="Programas conduzidos por perfumistas em atividade. Da iniciação às famílias olfativas ao curso de composição autoral — uma escola para quem deseja escrever em essências."
        cta={{ to: "/cursos", label: "Explorer les formations" }}
        image={cursosImg}
        imageAlt="Caderno de couro com formulações de perfumista e caneta dourada"
        reverse={false}
      />

      {/* Universe — minimal editorial list */}
      <section className="border-t border-border py-40">
        <div className="mx-auto max-w-[1400px] px-8">
          <div className="eyebrow gold mb-10">Chapitre VI — L'Univers</div>
          <div className="divide-y divide-border">
            {[
              { to: "/comunidade" as const, label: "Communauté", text: "Círculos privados, clube de assinaturas e encontros olfativos." },
              { to: "/ebooks" as const, label: "Éditions & guides", text: "Publicações sobre famílias olfativas e história da perfumaria." },
              { to: "/sobre" as const, label: "La Maison", text: "Filosofia, perfumistas e os ateliês onde tudo é composto." },
            ].map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="group grid md:grid-cols-12 gap-8 items-baseline py-10 transition-colors hover:bg-[color:var(--muted)]/40 -mx-8 px-8"
              >
                <div className="md:col-span-1 eyebrow gold">— {c.label[0]}</div>
                <div className="md:col-span-5 font-display text-[clamp(2.5rem,4vw,4rem)] leading-none group-hover:translate-x-2 transition-transform duration-500">
                  {c.label}
                </div>
                <p className="md:col-span-5 text-muted-foreground text-sm leading-relaxed">{c.text}</p>
                <span className="md:col-span-1 text-right eyebrow text-foreground/60 group-hover:text-[color:var(--gold)]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function EditorialChapter({
  chapter, eyebrow, title, text, cta, image, imageAlt, reverse,
}: {
  chapter: string;
  eyebrow: string;
  title: React.ReactNode;
  text: string;
  cta: { to: "/experiencias" | "/workshops" | "/cursos" | "/comunidade" | "/ebooks" | "/sobre" | "/catalogo"; label: string };
  image: string;
  imageAlt: string;
  reverse: boolean;
}) {
  return (
    <section className="relative border-t border-border py-32 md:py-40 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-8 grid lg:grid-cols-12 gap-16 items-center">
        <div className={`lg:col-span-7 ${reverse ? "lg:order-2" : ""}`}>
          <div className="relative aspect-[4/5] md:aspect-[5/4] overflow-hidden grain">
            <img
              src={image}
              alt={imageAlt}
              loading="lazy"
              width={1920}
              height={1200}
              className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        </div>
        <div className={`lg:col-span-5 space-y-10 ${reverse ? "lg:order-1 lg:pr-8" : "lg:pl-8"}`}>
          <div className="flex items-center gap-6">
            <span className="eyebrow gold">Chapitre {chapter}</span>
            <span className="h-px w-16 bg-[color:var(--gold)]/40" />
            <span className="eyebrow">{eyebrow}</span>
          </div>
          <h2 className="font-display text-[clamp(2.75rem,5vw,5rem)] leading-[0.95] tracking-tight">
            {title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md">{text}</p>
          <Link to={cta.to} className="editorial-link">{cta.label}</Link>
        </div>
      </div>
    </section>
  );
}
