import { createFileRoute, Link } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { Honeypot, Ph, useLeadForm } from "@/components/mon/ui";
import { loadSite, Rich, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/atelier-prive")({
  loader: ({ context }) => loadSite(context.queryClient, "atelier"),
  head: () => ({ meta: [{ title: "Atelier Privé — MON PARFUM" }, { name: "description", content: "Uma tarde. Uma bancada. Daniela Bitelo ao seu lado." }] }),
  component: AtelierPrive,
});

function AtelierPrive() {
  const c = useSite("atelier");
  const form = useLeadForm("atelier");
  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <div>
              <h1>{c.text("titulo")}</h1>
              <p className="m-lead" style={{ marginTop: "1.2rem" }}>{c.text("subtitulo")}</p>
              <div style={{ marginTop: "2rem" }}><Rich text={c.text("intro")} /></div>
            </div>
            {c.text("foto") && <Ph style={{ minHeight: 380 }} image={c.text("foto")} alt="Atelier MON" />}
          </div>
        </section>
        <section className="m-sec">
          <h2>O que acontece</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("acontece")} /></div>
        </section>
        <section className="m-sec">
          <h2>Por que a agenda é restrita</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("agenda")} /></div>
        </section>
        <section className="m-sec">
          <h2>Investimento</h2>
          <p style={{ marginTop: "1.2rem", fontFamily: "var(--m-serif)", fontSize: "1.6rem" }}>{c.text("investimento")}</p>
          <Rich text={c.text("investimento_texto")} />
        </section>
        <section className="m-sec" id="solicitar">
          <h2>Solicitar uma sessão</h2>
          <p style={{ marginTop: "1.2rem" }}>Preencha abaixo e retornamos com as datas disponíveis. Se não houver agenda no período que você busca, avisamos quando abrir.</p>
          {form.sent ? (
            <div className="m-note" style={{ marginTop: "1.4rem" }}><b>Solicitação recebida.</b> {c.text("prazo_resposta")}</div>
          ) : (
            <form className="m-form" onSubmit={(e) => form.submit(e)} style={{ position: "relative" }}>
              <Honeypot />
              <div className="row">
                <div><label htmlFor="ap-name">Nome</label><input id="ap-name" name="name" required maxLength={120} /></div>
                <div><label htmlFor="ap-email">E-mail</label><input id="ap-email" name="email" type="email" required maxLength={200} /></div>
              </div>
              <div className="row">
                <div><label htmlFor="ap-phone">WhatsApp</label><input id="ap-phone" name="phone" type="tel" required maxLength={40} /></div>
                <div><label htmlFor="ap-cidade">Cidade</label><input id="ap-cidade" name="cidade" maxLength={80} /></div>
              </div>
              <div className="row">
                <div><label htmlFor="ap-periodo">Período desejado</label><input id="ap-periodo" name="periodo" placeholder="ex.: março, fins de semana" maxLength={120} /></div>
                <div><label htmlFor="ap-ocasiao">Ocasião</label><input id="ap-ocasiao" name="ocasiao" placeholder="ex.: presente, aniversário" maxLength={120} /></div>
              </div>
              <div><button className="m-btn" disabled={form.sending}>{form.sending ? "Enviando…" : "Solicitar sessão"}</button></div>
            </form>
          )}
          <p className="m-small" style={{ marginTop: "1rem" }}>Sem carrinho e sem calendário público. {c.text("prazo_resposta")}</p>
        </section>
        <section className="m-sec">
          <h2>Não está em Florianópolis? A experiência vai até você.</h2>
          <p style={{ marginTop: "1.1rem" }}>O Kit MON leva a criação de um perfume até a sua casa, com vídeo-guia e matérias-primas. Enviamos para todo o Brasil.</p>
          <div className="m-ctas"><Link to="/experiencias" className="m-btn">Ver os Kits MON</Link></div>
        </section>
      </div>
    </MonPage>
  );
}
