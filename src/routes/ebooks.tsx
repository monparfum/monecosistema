import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/ebooks")({
  head: () => ({
    meta: [
      { title: "Ebooks — Mon Parfum" },
      { name: "description", content: "Publicações editoriais sobre perfumaria, matérias-primas e famílias olfativas." },
    ],
  }),
  component: Ebooks,
});

const livros = [
  { title: "O Vocabulário do Olfato", pages: "128 páginas", text: "Pequeno tratado sobre as famílias olfativas contemporâneas, ilustrado." },
  { title: "Matérias Vivas", pages: "96 páginas", text: "Ensaios sobre absolutos, resinas e o tempo das matérias-primas naturais." },
  { title: "Perfume e Memória", pages: "144 páginas", text: "Um percurso entre neurociência, literatura e prática perfumista." },
  { title: "Atelier", pages: "Edição limitada", text: "Diário visual do nosso ateliê parisiense, em papel algodão." },
];

function Ebooks() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <div className="eyebrow gold mb-6">Edições Mon Parfum</div>
        <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">Ebooks & guias</h1>
        <p className="mt-8 text-muted-foreground leading-relaxed">
          Uma pequena editora dentro da maison. Publicações breves, ilustradas e
          pensadas para serem lidas com tempo.
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-px bg-border">
          {livros.map((l, i) => (
            <article key={l.title} className="bg-background p-10 md:p-14">
              <div className="eyebrow mb-6">Volume {String(i + 1).padStart(2, "0")} · {l.pages}</div>
              <h2 className="font-display text-4xl mb-4">{l.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">{l.text}</p>
              <button className="editorial-link text-xs">Download (PDF)</button>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
