import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import img from "@/assets/editorial-workshops.jpg";

export const Route = createFileRoute("/workshops")({
  head: () => ({
    meta: [
      { title: "Workshops corporativos — Mon Parfum" },
      { name: "description", content: "Team building sensorial, branding olfativo e experiências premium para empresas." },
      { property: "og:title", content: "Workshops corporativos — Mon Parfum" },
    ],
  }),
  component: Workshops,
});

const formats = [
  { name: "Team building olfativo", scale: "10 – 40 pessoas", text: "Dinâmica colaborativa de composição em torno de uma narrativa de marca." },
  { name: "Branding olfativo", scale: "Projeto sob medida", text: "Concepção de assinatura olfativa para espaços corporativos, hotelaria e varejo." },
  { name: "Lançamento sensorial", scale: "Eventos premium", text: "Curadoria e cenografia olfativa para ativações de marca e premieres." },
  { name: "Workshop executivo", scale: "C-level / boards", text: "Encontro privado conduzido por nosso perfumista-chefe." },
];

function Workshops() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-[1400px] px-6 pt-20 pb-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-8">
          <div className="eyebrow gold">Capítulo III</div>
          <h1 className="font-display text-6xl md:text-7xl leading-[0.95]">Workshops corporativos</h1>
          <p className="text-muted-foreground leading-relaxed">
            Construímos experiências olfativas sob medida para empresas que entendem o
            valor do sensorial como ferramenta de cultura, marca e relacionamento.
          </p>
          <Link to="/sobre" className="editorial-link text-sm">Solicitar proposta</Link>
        </div>
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] overflow-hidden">
            <img src={img} alt="Workshop corporativo em ateliê parisiense" width={1920} height={1440} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-20 border-t border-border">
        <div className="eyebrow mb-10">Formatos</div>
        <div className="grid md:grid-cols-2 gap-px bg-border">
          {formats.map((f) => (
            <article key={f.name} className="bg-background p-10 md:p-12">
              <div className="eyebrow mb-4">{f.scale}</div>
              <h2 className="font-display text-3xl mb-4">{f.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-3xl md:text-4xl leading-snug">
          “Trabalhamos com marcas que querem ser <em>sentidas</em>, não apenas vistas.”
        </p>
        <div className="eyebrow mt-8">Laure Beaumont · Perfumista-chefe</div>
      </section>

      <SiteFooter />
    </div>
  );
}
