import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import img from "@/assets/editorial-cursos.jpg";

export const Route = createFileRoute("/cursos")({
  head: () => ({
    meta: [
      { title: "Cursos — Mon Parfum" },
      { name: "description", content: "Educação premium em perfumaria, da iniciação à composição autoral." },
      { property: "og:title", content: "Cursos de perfumaria — Mon Parfum" },
    ],
  }),
  component: Cursos,
});

const programas = [
  { name: "Iniciação olfativa", level: "Programa I", duration: "6 semanas", text: "Famílias, acordes e a gramática do perfume contemporâneo." },
  { name: "Composição autoral", level: "Programa II", duration: "12 semanas", text: "Da ideia ao flacon. Você sai com sua primeira composição original." },
  { name: "Matérias-primas raras", level: "Avançado", duration: "4 semanas intensivas", text: "Estudo profundo de absolutos, resinas, animálicos sintéticos e novas moléculas." },
  { name: "Residência Mon Parfum", level: "Por convite", duration: "6 meses", text: "Residência ao lado do nosso perfumista-chefe em ateliê privado." },
];

function Cursos() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-[1400px] px-6 pt-20 pb-12 grid lg:grid-cols-12 gap-12 items-end">
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] overflow-hidden">
            <img src={img} alt="Caderno de formulação de perfumista" width={1920} height={1440} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="eyebrow gold">Capítulo V</div>
          <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">Cursos de perfumaria</h1>
          <p className="text-muted-foreground leading-relaxed">
            Uma escola editorial dentro da maison. Programas pensados como rituais
            de aprendizado — pequenos grupos, matérias-primas reais, leitura intensa.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-20 border-t border-border">
        <div className="grid md:grid-cols-2 gap-px bg-border">
          {programas.map((p) => (
            <article key={p.name} className="bg-background p-10 md:p-14">
              <div className="eyebrow mb-4">{p.level} · {p.duration}</div>
              <h2 className="font-display text-4xl mb-5">{p.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">{p.text}</p>
              <Link to="/sobre" className="editorial-link text-xs">Lista de espera</Link>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
