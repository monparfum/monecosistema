import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroImg from "@/assets/editorial-hero.jpg";
import bottleImg from "@/assets/bp-bottle.jpg";
import atelierImg from "@/assets/bp-atelier.jpg";
import quietImg from "@/assets/bp-quiet.jpg";
import daniImg from "@/assets/bp-dani.jpg";
import societyImg from "@/assets/bp-society.jpg";
import expImg from "@/assets/editorial-experiencias.jpg";
import workshopsImg from "@/assets/editorial-workshops.jpg";
import cursosImg from "@/assets/editorial-cursos.jpg";

export const Route = createFileRoute("/businessplan")({
  component: BusinessPlan,
  head: () => ({
    meta: [
      { title: "Mon Parfum — The House of Olfactive Experience" },
      { name: "description", content: "Bíblia visual da maison Mon Parfum. A nova era da perfumaria autoral brasileira." },
    ],
  }),
});

const TOTAL = 16;

function Chapter({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-6 text-[10px] tracking-[0.4em] uppercase text-foreground/50">
      <span>{n}</span>
      <span className="h-px w-12 bg-foreground/30" />
      <span>{label}</span>
    </div>
  );
}

function Slide({
  index,
  bg = "bg-background",
  children,
}: {
  index: number;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-slide={index}
      className={`relative min-h-screen w-full flex flex-col ${bg}`}
    >
      <div className="absolute top-8 left-8 z-30 text-[10px] tracking-[0.4em] uppercase text-foreground/60">
        Mon Parfum
      </div>
      <div className="absolute top-8 right-8 z-30 text-[10px] tracking-[0.4em] uppercase text-foreground/60">
        {String(index).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
      </div>
      <div className="flex-1 flex flex-col justify-center">{children}</div>
    </section>
  );
}

function BusinessPlan() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-background text-foreground font-sans">
      {/* progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-foreground/5">
        <div
          className="h-full bg-foreground/80 transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 1 — COVER */}
      <Slide index={1}>
        <div className="relative h-screen w-full overflow-hidden">
          <img src={heroImg} alt="Mon Parfum" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background/70" />
          <div className="relative z-10 h-full mx-auto max-w-[1400px] px-10 flex flex-col justify-between py-16">
            <Chapter n="Chapitre 01" label="Ouverture" />
            <div className="max-w-3xl">
              <div className="text-[10px] tracking-[0.5em] uppercase mb-8 text-foreground/70">
                The House of Olfactive Experience
              </div>
              <h1 className="font-display text-[clamp(4rem,11vw,11rem)] leading-[0.88] tracking-[-0.02em]">
                Mon<br />Parfum
              </h1>
              <p className="mt-10 font-display italic text-2xl md:text-3xl text-foreground/80 max-w-xl leading-snug">
                “A nova era da perfumaria autoral brasileira.”
              </p>
            </div>
            <div className="flex justify-between items-end text-[10px] tracking-[0.4em] uppercase text-foreground/60">
              <span>Édition MMXXVI</span>
              <span>Manifeste — Bible Visuelle</span>
            </div>
          </div>
        </div>
      </Slide>

      {/* 2 — MARKET */}
      <Slide index={2}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 02" label="Le Marché" />
          <h2 className="mt-12 font-display text-[clamp(2.75rem,6vw,6rem)] leading-[0.95] max-w-5xl">
            O mercado vende fragrâncias.<br />
            <span className="italic text-foreground/60">A Mon constrói experiências.</span>
          </h2>
          <div className="mt-24 grid md:grid-cols-2 gap-px bg-border">
            <div className="bg-background p-12">
              <div className="eyebrow mb-8">Perfumaria tradicional</div>
              <ul className="font-display text-3xl space-y-4 text-foreground/50">
                <li>— vende produto</li>
                <li>— vende catálogo</li>
                <li>— compete por preço</li>
                <li>— comunica características</li>
              </ul>
            </div>
            <div className="bg-background p-12">
              <div className="eyebrow gold mb-8">Mon Parfum</div>
              <ul className="font-display text-3xl space-y-4">
                <li>— vende identidade</li>
                <li>— vende memória</li>
                <li>— vende atmosfera</li>
                <li>— vende pertencimento</li>
              </ul>
            </div>
          </div>
        </div>
      </Slide>

      {/* 3 — PRADA EFFECT */}
      <Slide index={3}>
        <div className="grid lg:grid-cols-2 min-h-screen">
          <div className="relative overflow-hidden">
            <img src={quietImg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex flex-col justify-center px-12 lg:px-20 py-24">
            <Chapter n="Chapitre 03" label="L'effet Prada" />
            <p className="mt-12 font-display italic text-3xl md:text-4xl leading-snug text-foreground/80">
              “O Diabo Veste Prada nunca foi sobre roupas.<br />Era sobre influência cultural.”
            </p>
            <div className="mt-16 eyebrow gold mb-6">A Mon será</div>
            <div className="grid grid-cols-2 gap-y-4 font-display text-2xl">
              <span>— mídia</span><span>— cultura</span>
              <span>— experiência</span><span>— lifestyle</span>
              <span>— comunidade</span><span>— educação</span>
            </div>
          </div>
        </div>
      </Slide>

      {/* 4 — QUIET LUXURY */}
      <Slide index={4}>
        <div className="relative min-h-screen flex items-center">
          <img src={bottleImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" loading="lazy" />
          <div className="absolute inset-0 bg-background/50" />
          <div className="relative z-10 mx-auto max-w-4xl px-10 text-center">
            <Chapter n="Chapitre 04" label="Quiet Luxury" />
            <h2 className="mt-12 font-display text-[clamp(3rem,7vw,7rem)] leading-[0.95]">
              O novo luxo<br /><span className="italic">não grita.</span>
            </h2>
            <p className="mt-12 text-lg text-foreground/70 max-w-xl mx-auto leading-relaxed">
              Ele vende curadoria, atmosfera, refinamento, experiência, identidade.
              Sussurra para quem sabe ouvir.
            </p>
          </div>
        </div>
      </Slide>

      {/* 5 — ECOSYSTEM */}
      <Slide index={5}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 05" label="L'écosystème" />
          <h2 className="mt-12 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95]">
            Um único universo.<br /><span className="italic text-foreground/60">Nove constelações.</span>
          </h2>
          <div className="relative mt-24 aspect-[16/10] border border-border/60">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="eyebrow gold mb-3">Centre</div>
                <div className="font-display text-5xl md:text-6xl">Mon Parfum</div>
              </div>
            </div>
            {[
              { t: "Experience Commerce", x: "8%", y: "10%" },
              { t: "Expériences", x: "92%", y: "10%", a: "right" },
              { t: "Corporate", x: "92%", y: "50%", a: "right" },
              { t: "Cursos", x: "92%", y: "90%", a: "right" },
              { t: "Communauté", x: "50%", y: "92%", a: "center" },
              { t: "Journal", x: "8%", y: "90%" },
              { t: "Membership", x: "8%", y: "50%" },
              { t: "Private Label", x: "50%", y: "8%", a: "center" },
              { t: "IA Olfactive", x: "50%", y: "50%", a: "center", hidden: true },
            ].map((n) => (
              !n.hidden && (
                <div
                  key={n.t}
                  className="absolute text-xs tracking-[0.3em] uppercase text-foreground/70"
                  style={{
                    left: n.x, top: n.y,
                    transform: `translate(${n.a === "right" ? "-100%" : n.a === "center" ? "-50%" : "0"}, -50%)`,
                  }}
                >
                  · {n.t}
                </div>
              )
            ))}
          </div>
        </div>
      </Slide>

      {/* 6 — EXPERIENCE COMMERCE */}
      <Slide index={6}>
        <div className="grid lg:grid-cols-12 min-h-screen">
          <div className="lg:col-span-7 flex flex-col justify-center px-12 lg:px-20 py-24">
            <Chapter n="Chapitre 06" label="Experience Commerce" />
            <h2 className="mt-10 font-display text-[clamp(2.5rem,5.5vw,5.5rem)] leading-[0.95]">
              Não uma loja.<br /><span className="italic">Uma revista viva.</span>
            </h2>
            <p className="mt-10 text-lg text-foreground/70 max-w-lg leading-relaxed">
              Cada produto é um capítulo. Cada coleção, uma campanha.
              O e-commerce torna-se editorial cinematográfico — emocional, aspiracional, sensorial.
            </p>
          </div>
          <div className="lg:col-span-5 relative overflow-hidden min-h-[60vh]">
            <img src={bottleImg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      </Slide>

      {/* 7 — EXPERIENCIAS */}
      <Slide index={7}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 07" label="Les expériences" />
          <h2 className="mt-10 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] max-w-3xl">
            Três jornadas sensoriais.
          </h2>
          <div className="mt-20 grid md:grid-cols-3 gap-10">
            {[
              { t: "Mon Bois", sub: "Floresta íntima", img: workshopsImg, d: "Madeiras quentes, fumaça e silêncio. Uma imersão na memória." },
              { t: "Mon Jardin", sub: "Jardim secreto", img: expImg, d: "Flores brancas, orvalho, o instante antes do amanhecer." },
              { t: "Mon Exclusive", sub: "Atelier privé", img: atelierImg, d: "Criação one-to-one. Sua assinatura olfativa, em vinte mãos." },
            ].map((e) => (
              <div key={e.t}>
                <div className="aspect-[4/5] overflow-hidden mb-6">
                  <img src={e.img} alt={e.t} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="eyebrow gold mb-3">{e.sub}</div>
                <h3 className="font-display text-3xl mb-3">{e.t}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{e.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* 8 — DANI */}
      <Slide index={8}>
        <div className="grid lg:grid-cols-2 min-h-screen">
          <div className="relative overflow-hidden order-2 lg:order-1">
            <img src={daniImg} alt="Daniela Bitelo" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="flex flex-col justify-center px-12 lg:px-20 py-24 order-1 lg:order-2">
            <Chapter n="Chapitre 08" label="La directrice" />
            <div className="eyebrow gold mt-12 mb-6">Daniela Bitelo</div>
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,5.5rem)] leading-[0.95]">
              A curadora<br /><span className="italic">por trás da maison.</span>
            </h2>
            <p className="mt-10 text-lg text-foreground/70 max-w-md leading-relaxed">
              Diretora criativa. Curadora olfativa. Fundadora visionária.
              A presença editorial que torna a Mon não apenas uma marca — mas uma referência cultural.
            </p>
          </div>
        </div>
      </Slide>

      {/* 9 — EDUCATION */}
      <Slide index={9}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 09" label="L'éducation" />
          <h2 className="mt-10 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] max-w-4xl">
            A Masterclass<br />da perfumaria autoral.
          </h2>
          <div className="mt-20 grid md:grid-cols-3 gap-px bg-border">
            {[
              { n: "I.", t: "Introdução à Perfumaria", d: "O alfabeto sensorial. Famílias, notas e arquitetura olfativa." },
              { n: "II.", t: "Masterclass", d: "Composição autoral. Da matéria-prima à assinatura final." },
              { n: "III.", t: "Segredos do Jasmim", d: "Estudo monográfico. A flor que mudou a história do perfume." },
            ].map((c) => (
              <div key={c.t} className="bg-background p-10">
                <div className="font-display text-5xl text-foreground/30 mb-8">{c.n}</div>
                <h3 className="font-display text-2xl mb-4">{c.t}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 italic text-foreground/60 text-sm">Inspirado em Masterclass · Vogue Edu · Netflix.</p>
        </div>
      </Slide>

      {/* 10 — CORPORATE */}
      <Slide index={10}>
        <div className="relative min-h-screen flex items-center">
          <img src={atelierImg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-background/60" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-10 w-full">
            <Chapter n="Chapitre 10" label="Corporate Experience" />
            <h2 className="mt-12 font-display text-[clamp(2.5rem,5.5vw,5.5rem)] leading-[0.95] max-w-3xl">
              Branding olfativo<br /><span className="italic">para casas de prestígio.</span>
            </h2>
            <div className="mt-16 grid md:grid-cols-4 gap-px bg-border max-w-4xl">
              {["Hotéis", "Marcas de luxo", "Eventos privados", "Team building"].map((t) => (
                <div key={t} className="bg-background p-8 text-center">
                  <div className="font-display text-xl">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* 11 — PRIVATE LABEL */}
      <Slide index={11}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 11" label="Private Label" />
          <h2 className="mt-12 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] max-w-4xl">
            Um laboratório criativo<br /><span className="italic">à disposição das maisons.</span>
          </h2>
          <div className="mt-20 grid md:grid-cols-2 gap-16 items-center">
            <div className="aspect-[5/6] overflow-hidden">
              <img src={atelierImg} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="space-y-6">
              {[
                ["Fragrâncias personalizadas", "Desenvolvimento autoral sob medida."],
                ["Hotéis & Spas", "Assinatura olfativa para hospitalidade premium."],
                ["Marcas de luxo", "Identidade sensorial integrada à arquitetura de marca."],
                ["Manufatura premium", "Produção em escala controlada, padrão maison."],
              ].map(([t, d]) => (
                <div key={t} className="border-b border-border pb-5">
                  <div className="font-display text-2xl mb-1">{t}</div>
                  <p className="text-sm text-foreground/60">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* 12 — TRAFFIC */}
      <Slide index={12}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 12" label="Stratégie média" />
          <h2 className="mt-12 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] max-w-3xl">
            Cultura primeiro.<br /><span className="italic text-foreground/60">Performance, em seguida.</span>
          </h2>
          <div className="mt-20 grid md:grid-cols-4 gap-px bg-border">
            {[
              { t: "Editorial", d: "Journal próprio, ensaios autorais." },
              { t: "Instagram", d: "Direção cinematográfica, ritmo lento." },
              { t: "TikTok", d: "Sensorial, refinado, narrativo." },
              { t: "Pinterest", d: "Moodboards permanentes da maison." },
              { t: "YouTube", d: "Filmes longos, masterclasses." },
              { t: "SEO", d: "Autoridade cultural via conteúdo." },
              { t: "Newsletter", d: "O diário privado da Mon." },
              { t: "Créateurs", d: "Curadoria de vozes premium." },
            ].map((c) => (
              <div key={c.t} className="bg-background p-8">
                <div className="font-display text-2xl mb-2">{c.t}</div>
                <p className="text-xs text-foreground/60 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* 13 — SOCIETY */}
      <Slide index={13}>
        <div className="relative min-h-screen flex items-center">
          <img src={societyImg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-background/40" />
          <div className="relative z-10 mx-auto max-w-3xl px-10 text-center">
            <Chapter n="Chapitre 13" label="La société" />
            <div className="eyebrow gold mt-12 mb-6">Membership Privé</div>
            <h2 className="font-display text-[clamp(3rem,7vw,7rem)] leading-[0.92]">
              The Mon<br />Society
            </h2>
            <p className="mt-10 text-foreground/80 max-w-md mx-auto leading-relaxed">
              Um clube íntimo. Drops limitados, jantares sensoriais,
              acesso antecipado, conversa com a curadora.
            </p>
          </div>
        </div>
      </Slide>

      {/* 14 — CAMPAIGNS */}
      <Slide index={14}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 14" label="Campagnes saisonnières" />
          <h2 className="mt-12 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] max-w-3xl">
            Cada estação, um filme.
          </h2>
          <div className="mt-20 grid md:grid-cols-4 gap-6">
            {[
              { t: "Fête des Mères", s: "Mai" },
              { t: "Saint-Valentin", s: "Février" },
              { t: "Noël", s: "Décembre" },
              { t: "Black Édition", s: "Novembre" },
            ].map((c, i) => (
              <div key={c.t} className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={[heroImg, quietImg, bottleImg, atelierImg][i]}
                  alt={c.t}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="eyebrow mb-1">{c.s}</div>
                  <div className="font-display text-2xl">{c.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* 15 — ROADMAP */}
      <Slide index={15}>
        <div className="mx-auto max-w-[1400px] px-10 py-32 w-full">
          <Chapter n="Chapitre 15" label="Le plan" />
          <h2 className="mt-12 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.95]">
            Da autoridade<br /><span className="italic">à liderança cultural.</span>
          </h2>
          <div className="mt-24 grid md:grid-cols-4 gap-px bg-border">
            {[
              { n: "Phase I", t: "Autoridade cultural", d: "Journal, manifesto, primeiras coleções autorais." },
              { n: "Phase II", t: "Comunidade & experiências", d: "Mon Society, atelier privado, jornadas sensoriais." },
              { n: "Phase III", t: "Escala nacional", d: "Corporate, private label, expansão da educação." },
              { n: "Phase IV", t: "Liderança cultural", d: "A maison brasileira de referência mundial." },
            ].map((p) => (
              <div key={p.n} className="bg-background p-10">
                <div className="eyebrow gold mb-6">{p.n}</div>
                <h3 className="font-display text-2xl mb-4">{p.t}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* 16 — FINAL */}
      <Slide index={16}>
        <div className="relative min-h-screen flex items-center">
          <img src={bottleImg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-background/70" />
          <div className="relative z-10 mx-auto max-w-3xl px-10 text-center">
            <p className="font-display italic text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.2] text-foreground/85">
              “Perfume deixa de ser produto.<br />
              E passa a ser experiência,<br />memória e identidade.”
            </p>
            <div className="mt-20 font-display text-6xl md:text-7xl">Mon Parfum</div>
            <div className="mt-6 text-[10px] tracking-[0.5em] uppercase text-foreground/60">
              The Future of Olfactive Experience
            </div>
          </div>
        </div>
      </Slide>

      <footer className="border-t border-border py-10 text-center text-[10px] tracking-[0.4em] uppercase text-foreground/50">
        Mon Parfum · Bible Visuelle · Édition Privée
      </footer>
    </div>
  );
}
