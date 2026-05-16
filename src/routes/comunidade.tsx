import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Mon Parfum" },
      { name: "description", content: "Encontros, clube olfativo e círculos privados de discussão." },
    ],
  }),
  component: Comunidade,
});

const pilares = [
  { name: "Le Cercle", text: "Clube privado de assinaturas trimestrais com edições exclusivas." },
  { name: "Encontros", text: "Saraus olfativos mensais em São Paulo, Paris e Lisboa." },
  { name: "Diário", text: "Cartas editoriais sobre famílias, perfumistas e matérias-primas." },
];

function Comunidade() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <div className="eyebrow gold mb-6">Capítulo VI</div>
        <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">Comunidade</h1>
        <p className="mt-8 text-muted-foreground leading-relaxed">
          Um círculo silencioso de pessoas que tratam o perfume como linguagem.
          Encontros, leituras e descobertas compartilhadas em uma cadência editorial.
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-16 border-t border-border">
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {pilares.map((p) => (
            <div key={p.name} className="bg-background p-12">
              <h2 className="font-display text-3xl mb-4">{p.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-display text-2xl md:text-3xl leading-snug">
          Receba o diário Mon Parfum — uma carta editorial, uma vez por mês.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); }}
          className="mt-10 flex items-center gap-3 border-b border-border max-w-md mx-auto"
        >
          <input
            type="email"
            required
            placeholder="seu e-mail"
            className="flex-1 bg-transparent py-3 text-sm focus:outline-none"
          />
          <button className="eyebrow">Assinar →</button>
        </form>
        <Link to="/login" className="block mt-8 eyebrow text-muted-foreground">Já é membro? Entrar</Link>
      </section>

      <SiteFooter />
    </div>
  );
}
