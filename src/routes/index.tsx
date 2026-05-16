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
      { name: "description", content: "Perfumes autorais, experiências sensoriais, workshops e educação em perfumaria de luxo." },
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
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Cinematic hero */}
      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-6 grid lg:grid-cols-12 gap-12 items-center pt-16 pb-32">
          <div className="lg:col-span-5 space-y-10 fade-in">
            <div className="eyebrow gold">Capítulo I · Maison contemporânea</div>
            <h1 className="font-display text-[3.5rem] md:text-[5.5rem] leading-[0.92] tracking-tight">
              O perfume<br />
              <em className="italic text-muted-foreground">como linguagem.</em>
            </h1>
            <p className="text-base text-muted-foreground max-w-md leading-relaxed">
              Mon Parfum é um ecossistema olfativo: composições autorais, experiências
              sensoriais, educação e comunidade. Uma maison para quem entende o
              perfume como obra.
            </p>
            <div className="flex gap-8 pt-2">
              <Link to="/experiencias" className="editorial-link text-sm">
                Descobrir a maison
              </Link>
              <Link to="/catalogo" className="editorial-link text-sm text-muted-foreground">
                Ver coleção
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7 fade-in">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={heroImg}
                alt="Frasco de perfume Mon Parfum em mármore creme com luz dourada"
                width={1080}
                height={1350}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        <div className="hairline mx-auto max-w-[1400px]" />
      </section>

      {/* Manifesto */}
      <section className="mx-auto max-w-3xl px-6 py-32 text-center">
        <div className="eyebrow mb-8">Manifesto</div>
        <p className="font-display text-3xl md:text-4xl leading-snug">
          Acreditamos que o perfume é a mais íntima das artes — uma assinatura invisível
          que carrega memória, lugar e desejo. Cada criação Mon Parfum nasce de um
          gesto editorial: pesquisa, matéria-prima rara e intenção.
        </p>
      </section>

      {/* Experiências */}
      <EditorialBlock
        eyebrow="Capítulo II"
        title="Experiências sensoriais"
        text="Jornadas olfativas privadas conduzidas por nossos perfumistas. Imersões em ateliê, perfumagem à medida e degustações cegas em ambientes cuidadosamente desenhados."
        cta={{ to: "/experiencias", label: "Reservar uma jornada" }}
        image={experienciasImg}
        imageAlt="Mãos em luva de seda segurando um mouillette diante de órgão de perfumista"
        reverse={false}
      />

      {/* Workshops corporativos */}
      <EditorialBlock
        eyebrow="Capítulo III"
        title="Workshops corporativos"
        text="Encontros olfativos desenhados para equipes, lançamentos e eventos premium. Team building sensorial, branding olfativo e experiências sob medida em São Paulo e Paris."
        cta={{ to: "/workshops", label: "Solicitar proposta" }}
        image={workshopsImg}
        imageAlt="Ateliê parisiense com mesa de mármore e equipe colaborando em formulações"
        reverse
      />

      {/* Produtos */}
      <section className="mx-auto max-w-[1400px] px-6 py-32 border-t border-border">
        <div className="grid md:grid-cols-2 gap-10 items-end mb-16">
          <div>
            <div className="eyebrow mb-4 gold">Capítulo IV · A coleção</div>
            <h2 className="font-display text-5xl md:text-6xl leading-tight">
              Objetos de desejo,<br /> não catálogo.
            </h2>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed md:pl-12">
            Frascos editoriais que carregam composições raras. Cada peça é uma narrativa
            olfativa completa — da matéria-prima à embalagem.
            <span className="block mt-6">
              <Link to="/catalogo" className="editorial-link text-sm text-foreground">Ver toda a coleção</Link>
            </span>
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
          {featured?.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* Cursos */}
      <EditorialBlock
        eyebrow="Capítulo V"
        title="Cursos de perfumaria"
        text="Educação premium em criação olfativa. Programas conduzidos por perfumistas em atividade, da iniciação ao curso de composição autoral. Certificação Mon Parfum."
        cta={{ to: "/cursos", label: "Explorar formações" }}
        image={cursosImg}
        imageAlt="Mãos de perfumista escrevendo em caderno de formulações em couro"
        reverse={false}
      />

      {/* Editorial / Comunidade */}
      <section className="mx-auto max-w-[1400px] px-6 py-32 border-t border-border">
        <div className="eyebrow mb-4 gold">Capítulo VI</div>
        <h2 className="font-display text-5xl md:text-6xl mb-16">Universo editorial</h2>
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {[
            { to: "/comunidade" as const, label: "Comunidade", text: "Encontros, clube de assinaturas olfativas e círculos privados de discussão." },
            { to: "/ebooks" as const, label: "Ebooks & guias", text: "Publicações editoriais sobre famílias olfativas, matérias-primas e história da perfumaria." },
            { to: "/sobre" as const, label: "Sobre a maison", text: "Nossa filosofia, nossos perfumistas e os ateliês onde tudo é criado." },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="bg-background p-10 group hover:bg-muted/40 transition-colors">
              <div className="eyebrow mb-6">→ Ler</div>
              <div className="font-display text-3xl mb-4 group-hover:translate-x-1 transition-transform">
                {c.label}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function EditorialBlock({
  eyebrow, title, text, cta, image, imageAlt, reverse,
}: {
  eyebrow: string; title: string; text: string;
  cta: { to: "/experiencias" | "/workshops" | "/cursos" | "/comunidade" | "/ebooks" | "/sobre"; label: string };
  image: string; imageAlt: string; reverse: boolean;
}) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-32 border-t border-border">
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        <div className={`lg:col-span-7 ${reverse ? "lg:order-2" : ""}`}>
          <div className="aspect-[16/10] overflow-hidden">
            <img src={image} alt={imageAlt} loading="lazy" width={1920} height={1200} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className={`lg:col-span-5 space-y-8 ${reverse ? "lg:order-1 lg:pr-12" : "lg:pl-8"}`}>
          <div className="eyebrow gold">{eyebrow}</div>
          <h2 className="font-display text-5xl md:text-6xl leading-[1] tracking-tight">{title}</h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md">{text}</p>
          <Link to={cta.to} className="editorial-link text-sm">{cta.label}</Link>
        </div>
      </div>
    </section>
  );
}
