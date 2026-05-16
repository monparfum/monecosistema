import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import img from "@/assets/editorial-experiencias.jpg";

export const Route = createFileRoute("/experiencias")({
  head: () => ({
    meta: [
      { title: "Experiências — Mon Parfum" },
      { name: "description", content: "Jornadas olfativas privadas, perfumagem à medida e imersões sensoriais." },
      { property: "og:title", content: "Experiências sensoriais — Mon Parfum" },
      { property: "og:image", content: "/og-experiencias.jpg" },
    ],
  }),
  component: Experiencias,
});

const items = [
  { name: "Jornada olfativa privada", duration: "2h", price: "R$ 1.200", text: "Imersão guiada por um perfumista, com leitura sensorial das famílias e descoberta do seu perfil olfativo." },
  { name: "Perfumagem à medida", duration: "4h em duas sessões", price: "R$ 4.800", text: "Composição autoral de um perfume exclusivo, do briefing à entrega do flacon numerado." },
  { name: "Degustação cega", duration: "1h30", price: "R$ 680", text: "Exploração às cegas de matérias-primas raras e construções de assinatura." },
  { name: "Cerimônia do incenso", duration: "1h", price: "R$ 420", text: "Ritual contemplativo com madeiras, resinas e incensos preciosos." },
];

function Experiencias() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative">
        <div className="aspect-[21/9] overflow-hidden">
          <img src={img} alt="Atelier olfativo" width={1920} height={820} className="w-full h-full object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="eyebrow gold mb-6">Capítulo II</div>
        <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">Experiências sensoriais</h1>
        <p className="mt-8 text-muted-foreground leading-relaxed">
          Jornadas íntimas em nossos ateliês de São Paulo e Paris. Cada experiência é
          desenhada como um pequeno teatro do olfato — luz, matéria, gesto e silêncio.
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-px bg-border">
          {items.map((it) => (
            <article key={it.name} className="bg-background p-10 md:p-12">
              <div className="eyebrow mb-4">{it.duration}</div>
              <h2 className="font-display text-3xl md:text-4xl mb-4">{it.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.text}</p>
              <div className="mt-8 flex items-end justify-between">
                <div className="font-display text-2xl">{it.price}</div>
                <Link to="/sobre" className="editorial-link text-xs">Reservar</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
