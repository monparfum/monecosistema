import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import img from "@/assets/editorial-hero.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Mon Parfum" },
      { name: "description", content: "A maison olfativa Mon Parfum: filosofia, perfumistas e ateliês." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <div className="eyebrow gold mb-6">A maison</div>
        <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">Sobre Mon Parfum</h1>
        <p className="mt-10 font-display text-2xl md:text-3xl leading-snug text-muted-foreground">
          Uma casa olfativa contemporânea, fundada sobre a ideia de que o perfume é,
          antes de tudo, uma forma de escrita.
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="aspect-[21/9] overflow-hidden">
          <img src={img} alt="Frasco Mon Parfum em luz dourada" width={1920} height={820} className="w-full h-full object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 space-y-12">
        <Block title="Filosofia">
          Trabalhamos com matérias-primas raras, tempo longo e poucas peças por ano.
          Cada perfume começa como um texto: um briefing escrito, uma referência literária,
          um lugar. A composição é a tradução desse texto em moléculas.
        </Block>
        <Block title="Ateliês">
          Nossos ateliês ficam em São Paulo (Jardins) e Paris (Marais). São espaços de
          trabalho silenciosos, abertos por agendamento para experiências privadas e
          residências de cursos.
        </Block>
        <Block title="Ecossistema">
          Mon Parfum reúne produtos, experiências sensoriais, workshops corporativos,
          uma escola, uma comunidade e uma pequena editora. Tudo desenhado para
          oferecer múltiplas portas de entrada ao mundo do perfume.
        </Block>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-20 text-center border-t border-border">
        <div className="eyebrow mb-4">Contato direto</div>
        <p className="font-display text-3xl">contato@monparfum.com.br</p>
        <Link to="/experiencias" className="editorial-link text-sm mt-8 inline-block">Reservar uma jornada</Link>
      </section>

      <SiteFooter />
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[140px_1fr] gap-6">
      <div className="eyebrow pt-1">{title}</div>
      <p className="text-base leading-relaxed text-foreground/85">{children}</p>
    </div>
  );
}
