import { createFileRoute } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { ContactBlock, FaqList, Honeypot, useLeadForm } from "@/components/mon/ui";
import { loadSite, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/conteudos")({
  loader: ({ context }) => loadSite(context.queryClient, "conteudos"),
  head: () => ({ meta: [{ title: "Perguntas frequentes e contato — MON PARFUM" }, { name: "description", content: "Tire suas dúvidas sobre cursos, kits e envio. Fale com a MON." }] }),
  component: Conteudos,
});

function Conteudos() {
  const c = useSite("conteudos");
  const form = useLeadForm("contato");
  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <h1>Perguntas frequentes</h1>
          <div style={{ marginTop: "2rem" }}><FaqList items={c.list("faq")} /></div>
        </section>
        <section className="m-sec" id="contato">
          <h2>Fale com a MON</h2>
          <div className="m-grid m-g2" style={{ marginTop: "1.5rem", alignItems: "start" }}>
            <div><ContactBlock /></div>
            <div>
              {form.sent ? (
                <div className="m-note"><b>Mensagem recebida.</b> Respondemos no horário de atendimento.</div>
              ) : (
                <form className="m-form" style={{ marginTop: 0, position: "relative" }} onSubmit={(e) => form.submit(e)}>
                  <Honeypot />
                  <div><label htmlFor="ct-name">Nome</label><input id="ct-name" name="name" required maxLength={120} /></div>
                  <div className="row">
                    <div><label htmlFor="ct-email">E-mail</label><input id="ct-email" name="email" type="email" required maxLength={200} /></div>
                    <div><label htmlFor="ct-phone">WhatsApp</label><input id="ct-phone" name="phone" type="tel" maxLength={40} /></div>
                  </div>
                  <div><label htmlFor="ct-assunto">Assunto</label><input id="ct-assunto" name="assunto" maxLength={120} /></div>
                  <div><label htmlFor="ct-msg">Mensagem</label><textarea id="ct-msg" name="mensagem" rows={5} required maxLength={2000} /></div>
                  <div><button className="m-btn" disabled={form.sending}>{form.sending ? "Enviando…" : "Enviar mensagem"}</button></div>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </MonPage>
  );
}
