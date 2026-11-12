import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { MonPage } from "@/components/mon/page";
import { submitLead } from "@/lib/leads.functions";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Qual é a sua personalidade olfativa? — MON PARFUM" },
      { name: "description", content: "Quiz de personalidade olfativa da MON Parfum: descubra seu perfil predominante, suas famílias olfativas de afinidade e as notas que você pode explorar." },
    ],
  }),
  component: Quiz,
});

// O quiz é o pacote da MON em public/quiz-mon (para atualizar: trocar a pasta). Ele avisa esta página por mensagem:
// monqHeight = altura do conteúdo; monqLead = cadastro (etapa "inicio") e resultado (etapa "resultado") → CRM.
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function Quiz() {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const el = frame.current;
      if (!el || e.origin !== window.location.origin || e.source !== el.contentWindow || !e.data) return;
      const h = Number(e.data.monqHeight);
      if (h > 0) el.style.height = `${Math.min(h, 20000)}px`;
      const p = e.data.monqLead as Record<string, unknown> | undefined;
      if (!p || typeof p !== "object") return;
      // tela nova (perguntas ou resultado) começa do topo do quiz
      if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
      const send = () => submitLead({
        data: {
          kind: "quiz", name: str(p.nome, 120), email: str(p.email, 200), phone: str(p.whatsapp, 40),
          payload: {
            quiz_id: str(p.id, 60), etapa: str(p.etapa, 20), perfil: str(p.perfil, 40), segunda_faceta: str(p.segunda_faceta, 40),
            pontos: str(p.pontos, 200), consentimento: str(p.consentimento, 10),
          },
        },
      });
      // uma nova tentativa se a rede falhar; a etapa "resultado" reenvia o contato completo de qualquer forma
      send().catch(() => new Promise((r) => setTimeout(r, 3000)).then(send)).catch((err) => console.error("Quiz: contato não enviado ao CRM", err));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <MonPage>
      <iframe ref={frame} className="m-quizframe" src="/quiz-mon/index.html" title="Quiz de personalidade olfativa MON Parfum" />
    </MonPage>
  );
}
