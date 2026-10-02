import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MonPage } from "@/components/mon/page";
import { Honeypot, useLeadForm } from "@/components/mon/ui";
import { QUIZ_INTERESSE, QUIZ_OBJETIVO } from "@/lib/mon-content";
import { loadSite, useSite, waLink } from "@/lib/site-content";

export const Route = createFileRoute("/quiz")({
  loader: ({ context }) => loadSite(context.queryClient, "quiz"),
  head: () => ({ meta: [{ title: "Quiz Olfativo — MON PARFUM" }, { name: "description", content: "Descubra o território olfativo que combina com você e por onde começar na MON." }] }),
  component: Quiz,
});

type Interesse = keyof typeof QUIZ_INTERESSE;
type Objetivo = keyof typeof QUIZ_OBJETIVO;

// Recomendação pelo objetivo declarado
const CAMINHO: Record<Objetivo, { label: string; to: string; params?: { slug: string } }> = {
  criar: { label: "Ver os Kits MON", to: "/experiencias" },
  entender: { label: "Conhecer a Introdução à Perfumaria", to: "/cursos/$slug", params: { slug: "introducao-a-perfumaria" } },
  profissionalizar: { label: "Ver o curso de Aspectos Legais", to: "/cursos/$slug", params: { slug: "aspectos-legais-e-regulatorios" } },
  presente: { label: "Ver os produtos MON", to: "/produtos" },
};

function Quiz() {
  const [step, setStep] = useState(0);
  const [interesse, setInteresse] = useState<Interesse | null>(null);
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [nome, setNome] = useState("");
  const lead = useLeadForm("quiz");
  const c = useSite("quiz");
  const g = useSite("geral");
  const pct = step === 0 ? 0 : step === 4 ? 100 : (step / 4) * 100;

  const restart = () => { setStep(0); setInteresse(null); setObjetivo(null); };

  return (
    <MonPage>
      <div className="m-wrap m-sec">
        <div className="m-quizbox">
          <div className="m-qprog"><i style={{ width: `${pct}%` }} /></div>

          {step === 0 && (
            <div>
              <h1>{c.text("titulo")}</h1>
              <p className="m-lead" style={{ marginTop: "1.2rem" }}>{c.text("texto")}</p>
              <div className="m-ctas"><button className="m-btn" onClick={() => setStep(1)}>Começar</button></div>
              <p className="m-small" style={{ marginTop: "1rem" }}>Rápido e gratuito. Resultado personalizado.</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="m-kick">1 de 2</div>
              <h2>Qual território olfativo mais te atrai?</h2>
              <p style={{ marginTop: ".8rem" }} className="m-small">Se gostar de mais de um, escolha o que te chama mais neste momento.</p>
              <div style={{ marginTop: "1.5rem" }}>
                {(Object.keys(QUIZ_INTERESSE) as Interesse[]).map((k) => (
                  <button key={k} className="m-qopt" onClick={() => { setInteresse(k); setStep(2); }}>
                    <span className="em" aria-hidden="true">{QUIZ_INTERESSE[k].emoji}</span>
                    <div><b>{QUIZ_INTERESSE[k].nome}</b><span>{QUIZ_INTERESSE[k].desc}</span></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="m-kick">2 de 2</div>
              <h2>O que você mais busca agora?</h2>
              <p style={{ marginTop: ".8rem" }} className="m-small">Isso nos ajuda a indicar o melhor caminho para você na MON.</p>
              <div style={{ marginTop: "1.5rem" }}>
                {(Object.keys(QUIZ_OBJETIVO) as Objetivo[]).map((k) => (
                  <button key={k} className="m-qopt" onClick={() => { setObjetivo(k); setStep(3); }}>
                    <span className="em" aria-hidden="true">{QUIZ_OBJETIVO[k].emoji}</span>
                    <div><b>{QUIZ_OBJETIVO[k].nome}</b><span>{QUIZ_OBJETIVO[k].desc}</span></div>
                  </button>
                ))}
              </div>
              <button className="m-linkbtn" onClick={() => setStep(1)}>← Voltar</button>
            </div>
          )}

          {step === 3 && interesse && (
            <div>
              <div style={{ fontSize: "2.4rem" }} aria-hidden="true">{QUIZ_INTERESSE[interesse].emoji}</div>
              <h2>Seu caminho olfativo está pronto</h2>
              <p style={{ marginTop: ".8rem" }}>Preencha abaixo para ver o seu resultado e receber conteúdos sobre perfumaria que combinam com você.</p>
              <form
                className="m-form"
                style={{ position: "relative" }}
                onSubmit={async (e) => {
                  const ok = await lead.submit(e, { interesse, objetivo });
                  if (ok) setStep(4);
                }}
              >
                <Honeypot />
                <div><label htmlFor="qz-name">Nome</label><input id="qz-name" name="name" required maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
                <div><label htmlFor="qz-email">E-mail</label><input id="qz-email" name="email" type="email" required maxLength={200} /></div>
                <div><label htmlFor="qz-phone">WhatsApp (opcional)</label><input id="qz-phone" name="phone" type="tel" maxLength={40} /></div>
                <div><button className="m-btn" disabled={lead.sending}>{lead.sending ? "Enviando…" : "Ver meu resultado"}</button></div>
              </form>
              <p className="m-small" style={{ marginTop: ".8rem" }}>Sem spam. Só perfumaria.</p>
              <button className="m-linkbtn" onClick={() => setStep(2)}>← Voltar</button>
            </div>
          )}

          {step === 4 && interesse && objetivo && (
            <div className="m-result">
              <div className="m-kick">{QUIZ_INTERESSE[interesse].familias}</div>
              <h2>{nome.trim() ? `${nome.trim().split(" ")[0]}, s` : "S"}eu território é {QUIZ_INTERESSE[interesse].nome}</h2>
              <div className="m-kpis" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div><b>{QUIZ_INTERESSE[interesse].emoji} {QUIZ_INTERESSE[interesse].nome}</b><span>Seu território</span></div>
                <div><b>{QUIZ_OBJETIVO[objetivo].emoji} {QUIZ_OBJETIVO[objetivo].nome}</b><span>Seu objetivo</span></div>
              </div>
              <p style={{ marginTop: "1.4rem" }}>{QUIZ_INTERESSE[interesse].texto}</p>
              <h3 style={{ marginTop: "1.4rem" }}>E agora?</h3>
              <p style={{ marginTop: ".5rem" }}>{c.text("resultado_texto")}</p>
              <div className="m-ctas">
                <Link to={CAMINHO[objetivo].to} params={CAMINHO[objetivo].params as never} className="m-btn">{CAMINHO[objetivo].label}</Link>
                <Link to="/cursos" className="m-btn ghost">Ver todos os cursos</Link>
                <a className="m-btn ghost" href={waLink(g.text("whatsapp_numero"))} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
              </div>
              <p className="m-small" style={{ marginTop: "1rem" }}>A equipe da MON vai te ajudar a encontrar o caminho certo — sem pressa e sem pressão.</p>
              <button className="m-linkbtn" onClick={restart}>Refazer o quiz</button>
            </div>
          )}
        </div>
      </div>
    </MonPage>
  );
}
