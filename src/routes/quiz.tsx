import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MonPage } from "@/components/mon/page";
import { Honeypot, useLeadForm } from "@/components/mon/ui";
import { BEHAVIORAL, PROFILE, QUESTIONS, scoreQuiz, type ProfileKey } from "@/lib/quiz";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Qual é a sua personalidade olfativa? — MON PARFUM" },
      { name: "description", content: "Descubra sua personalidade olfativa e explore as notas que mais combinam com você. Uma experiência MON Parfum." },
    ],
  }),
  component: Quiz,
});

type Stage = "inicio" | "perguntas" | "contato" | "resultado";
const img = (name: string) => `/img/quiz/${name}.webp`;

function Quiz() {
  const [stage, setStage] = useState<Stage>("inicio");
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<(ProfileKey | null)[]>(() => Array(QUESTIONS.length).fill(null));
  const [nome, setNome] = useState("");
  const [shared, setShared] = useState(false);
  const lead = useLeadForm("quiz");
  const top = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Cada tela nova começa do topo do quiz (não na primeira carga da página)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stage, at]);

  const r = scoreQuiz(answers);
  const [k1, k2] = r.keys;
  const p = PROFILE[k1];
  const p2 = PROFILE[k2];
  const item = QUESTIONS[at];
  const last = at === QUESTIONS.length - 1;

  const start = () => { setAnswers(Array(QUESTIONS.length).fill(null)); setAt(0); setStage("perguntas"); };
  const restart = () => { setAnswers(Array(QUESTIONS.length).fill(null)); setAt(0); setStage("inicio"); };

  const share = async () => {
    const message = `Meu perfil olfativo MON Parfum é ${p.name} (${p.tag}), com uma segunda faceta ${p2.name}. Descubra o seu!`;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Minha personalidade olfativa | MON Parfum", text: message, url }); return; }
      catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(`${message} ${url}`); setShared(true); setTimeout(() => setShared(false), 2500); }
    catch { window.prompt("Copie seu resultado:", `${message} ${url}`); }
  };

  return (
    <MonPage>
      <div className="mq" ref={top}>
        {stage === "inicio" && (
          <section className="mq-hero">
            <div className="mq-hero-copy">
              <p className="mq-eyebrow light">Uma descoberta sobre você</p>
              <h1>Qual é a sua<br /><em>personalidade</em><br />olfativa?</h1>
              <p className="mq-hero-desc">Descubra os universos de fragrâncias que mais se conectam com você — e as notas que podem despertar seus sentidos.</p>
              <button type="button" className="mq-btn cream" onClick={start}>Começar o quiz <span aria-hidden="true">↗</span></button>
              <div className="mq-highlights"><span>12 perguntas</span><span>4 universos olfativos</span><span>Resultado personalizado</span></div>
            </div>
            <div className="mq-hero-photo" role="img" aria-label="Fotografia editorial de frasco de perfume e flores" style={{ backgroundImage: `linear-gradient(90deg,#1a231c 0%,transparent 28%),url('${img("hero")}')` }} />
          </section>
        )}

        {stage === "perguntas" && (
          <section className="mq-quiz" aria-labelledby="mq-question">
            <div className="mq-shell">
              <div className="mq-step">
                <span className="mq-eyebrow">{at < BEHAVIORAL ? "Parte 1 de 2 · Perfil comportamental" : "Parte 2 de 2 · Universo olfativo"}</span>
                <span className="mq-counter">{at + 1} / {QUESTIONS.length}</span>
              </div>
              <div className="mq-track"><div className="mq-fill" style={{ width: `${((at + 1) / QUESTIONS.length) * 100}%` }} /></div>
              <h2 id="mq-question">{item.q}</h2>
              <p className="mq-instr">Escolha a alternativa que mais combina com você na maior parte do tempo. Não há respostas certas ou erradas.</p>
              <div className="mq-options" role="radiogroup" aria-labelledby="mq-question">
                {item.o.map(([key, label]) => {
                  const sel = answers[at] === key;
                  const photo = at >= BEHAVIORAL;
                  return (
                    <button key={key} type="button" role="radio" aria-checked={sel}
                      className={`mq-option${sel ? " selected" : ""}${photo ? " has-image" : ""}`}
                      onClick={() => setAnswers((a) => a.map((v, i) => (i === at ? key : v)))}>
                      {photo && <span className="mq-option-image" aria-hidden="true" style={{ backgroundImage: `url('${img(`q${at + 1}-${key}`)}')` }} />}
                      <span className="mq-radio" aria-hidden="true" />
                      <span className="mq-option-label">{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mq-nav">
                <button type="button" className="mq-btn outline" disabled={at === 0} onClick={() => setAt(at - 1)}>← Anterior</button>
                <button type="button" className="mq-btn dark" disabled={!answers[at]} onClick={() => (last ? setStage("contato") : setAt(at + 1))}>
                  {last ? "Descobrir meu perfil →" : "Próxima pergunta →"}
                </button>
              </div>
            </div>
          </section>
        )}

        {stage === "contato" && (
          <section className="mq-quiz">
            <div className="mq-shell narrow">
              <span className="mq-eyebrow">Seu perfil está pronto</span>
              <h2>Para onde enviamos o seu resultado?</h2>
              <p className="mq-instr">Preencha abaixo para ver o seu perfil olfativo e receber conteúdos de perfumaria que combinam com você.</p>
              <form className="m-form" style={{ position: "relative" }}
                onSubmit={async (e) => {
                  const ok = await lead.submit(e, {
                    perfil: k1, segunda_faceta: k2,
                    afinidades: r.keys.map((k) => `${PROFILE[k].name} ${r.pct(k)}%`).join(" · "),
                  });
                  if (ok) setStage("resultado");
                }}>
                <Honeypot />
                <div><label htmlFor="qz-name">Nome</label><input id="qz-name" name="name" required maxLength={120} autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
                <div><label htmlFor="qz-email">E-mail</label><input id="qz-email" name="email" type="email" required maxLength={200} autoComplete="email" /></div>
                <div><label htmlFor="qz-phone">WhatsApp (opcional)</label><input id="qz-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" /></div>
                <div className="mq-nav">
                  <button type="button" className="mq-btn outline" onClick={() => setStage("perguntas")}>← Anterior</button>
                  <button className="mq-btn dark" disabled={lead.sending}>{lead.sending ? "Enviando…" : "Ver meu resultado →"}</button>
                </div>
              </form>
              <p className="mq-note">Sem spam. Seus dados são usados só pela MON, conforme a <Link to="/politicas/$doc" params={{ doc: "privacidade" }}>Política de Privacidade</Link>.</p>
            </div>
          </section>
        )}

        {stage === "resultado" && (
          <section className="mq-results" aria-live="polite">
            <div className="mq-result-heading">
              <p className="mq-eyebrow">{nome.trim() ? `${nome.trim().split(" ")[0]}, seu` : "Seu"} universo olfativo predominante</p>
              <h2 style={{ color: p.color }}>{p.name}</h2>
              <p className="mq-result-tag">{p.tag}</p>
            </div>
            <div className="mq-result-layout">
              <div className="mq-result-photo" role="img" aria-label="Natureza e matérias-primas da perfumaria" style={{ backgroundImage: `url('${img(`perfil-${k1}`)}')` }} />
              <div>
                <p className="mq-intro">{p.text}</p>
                <div className="mq-detail"><h3>Suas famílias de afinidade</h3><p>{p.families}</p></div>
                <div className="mq-detail"><h3>Notas e acordes para explorar</h3><p>{p.notes}</p></div>
                <div className="mq-affinity">
                  <h3>Seu mapa de afinidades</h3>
                  {r.keys.map((k) => (
                    <div className="mq-bar-row" key={k}>
                      <div className="mq-bar-label"><span>{PROFILE[k].name}</span><span>{r.pct(k)}%</span></div>
                      <div className="mq-bar-track"><div className="mq-bar-fill" style={{ width: `${r.pct(k)}%`, background: PROFILE[k].color }} /></div>
                    </div>
                  ))}
                  <p className="mq-note">Percentuais relativos às respostas deste quiz, não medidas científicas de personalidade.</p>
                </div>
                <div className="mq-second">
                  <h3>Sua segunda faceta: {p2.name}</h3>
                  <p>{r.tie
                    ? "Você demonstrou duas afinidades de igual intensidade. Explore ambas as direções em seus perfumes."
                    : `Além de seu universo principal, você também demonstra afinidade com o perfil ${p2.name.toLowerCase()}. Vale experimentar contrastes e combinações entre esses dois universos.`}</p>
                </div>
              </div>
            </div>
            <div className="mq-reflection">
              <h2>Você não precisa ser a mesma pessoa todos os dias.<br /><em>Seu perfume também não.</em></h2>
              <p>Há dias em que buscamos delicadeza; em outros, energia, liberdade ou profundidade. Uma escolha isolada não define quem somos. O interessante é perceber a frequência com que retornamos aos aromas que continuam nos encantando.</p>
              <p>Seu perfil olfativo não é uma regra. É um ponto de partida para explorar novas possibilidades.</p>
            </div>
            <div className="mq-cta" style={{ backgroundImage: `linear-gradient(90deg,#15231bfa,#15231be8),url('${img("perfume")}')` }}>
              <div>
                <p className="mq-eyebrow">Sua jornada continua</p>
                <h2>A perfumaria despertou algo em você?</h2>
                <p>Descobrir suas preferências é só o começo. Na MON Parfum, transformamos curiosidade em repertório, sensibilidade em conhecimento e conhecimento em criação.</p>
                <strong>Se a perfumaria faz parte da sua jornada, seu lugar é aqui.</strong>
              </div>
              <Link to="/cursos" className="mq-btn cream">Conhecer os cursos da MON Parfum ↗</Link>
            </div>
            <div className="mq-share">
              <button type="button" className="mq-btn outline" onClick={share}>{shared ? "Resultado copiado ✓" : "Compartilhar resultado ↗"}</button>
              <button type="button" className="mq-btn outline" onClick={restart}>Refazer o teste ↻</button>
            </div>
            <p className="mq-note center">Experiência educativa inspirada no quadrante olfativo apresentado no material de referência de J. Stephan Jellinek e na organização de famílias da Fragrance Wheel de Michael Edwards. Não constitui avaliação psicométrica ou diagnóstico de personalidade.</p>
          </section>
        )}
      </div>
    </MonPage>
  );
}
