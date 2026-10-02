import { createFileRoute } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { FaqList, Honeypot, Ph, useLeadForm } from "@/components/mon/ui";
import { loadSite, Rich, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/corporativo")({
  loader: ({ context }) => loadSite(context.queryClient, "corporativo"),
  head: () => ({ meta: [{ title: "Corporativo — MON PARFUM" }, { name: "description", content: "Workshop de criação de perfumes para empresas. Cada participante cria e leva o próprio perfume." }] }),
  component: Corporativo,
});

function Corporativo() {
  const c = useSite("corporativo");
  const form = useLeadForm("corporativo");
  const formatos = c.list("formatos").filter((f) => f.titulo?.trim());
  const depoimentos = c.list("depoimentos").filter((d) => d.texto?.trim());
  const toForm = () => document.getElementById("proposta")?.scrollIntoView({ behavior: "smooth" });

  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <div>
              <div className="m-small" style={{ letterSpacing: ".12em", marginBottom: "1rem" }}>MON CORPORATIVO · ESPECIALISTA EM TEAM BUILDING</div>
              <h1>{c.text("titulo")}</h1>
              <p className="m-lead" style={{ marginTop: "1.3rem" }}>{c.text("subtitulo")}</p>
              <div className="m-ctas"><button className="m-btn" onClick={toForm}>Solicitar proposta</button></div>
            </div>
            {c.text("foto") && <Ph style={{ minHeight: 360 }} image={c.text("foto")} alt="Workshop MON Corporativo" />}
          </div>
          <div style={{ marginTop: "2rem" }}><Rich text={c.text("texto")} /></div>
        </section>

        {c.list("clientes").length > 0 && (
          <section className="m-sec">
            <h2>Quem já viveu</h2>
            <div className="m-logos">{c.list("clientes").map((i, k) => <div key={k}>{i.texto}</div>)}</div>
          </section>
        )}

        <section className="m-sec">
          <h2>Por que o olfato cria memórias tão duradouras</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("olfato")} /></div>
        </section>

        {formatos.length > 0 && (
          <section className="m-sec">
            <h2>Formatos disponíveis</h2>
            <div className="m-grid m-g2" style={{ marginTop: "1.6rem" }}>
              {formatos.map((f) => (
                <div key={f.titulo} className="m-terr"><div className="body">
                  <h3>{f.titulo}</h3>
                  <p style={{ marginTop: ".6rem" }}>{f.texto}</p>
                  {f.indicado && <p className="m-small" style={{ margin: 0 }}><b>Indicado para:</b> {f.indicado}</p>}
                </div></div>
              ))}
            </div>
          </section>
        )}

        <section className="m-sec">
          <h2>Como funciona</h2>
          <div className="m-steps c5">
            {c.list("passos").map((s, i) => <div key={i} className="m-step"><div className="n">{i + 1}</div><h3>{s.titulo}</h3><p>{s.texto}</p></div>)}
          </div>
        </section>

        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <div>
              <h2>O que a MON leva</h2>
              <ul className="m-clean">{c.list("leva").map((i, k) => <li key={k}>{i.texto}</li>)}</ul>
            </div>
            {depoimentos.length > 0 && (
              <div>
                <h2>Empresas que já viveram o Atelier MON</h2>
                {depoimentos.map((d, i) => (
                  <div key={i} className="m-quote" style={{ marginTop: "1.2rem" }}>
                    <p>"{d.texto}"</p>
                    <p className="m-small">{d.nome}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="m-sec" id="proposta">
          <h2>Solicitar proposta</h2>
          {form.sent ? (
            <div className="m-note" style={{ marginTop: "1.4rem" }}><b>Pedido recebido.</b> {c.text("prazo_resposta")}</div>
          ) : (
            <form className="m-form" onSubmit={(e) => form.submit(e)} style={{ position: "relative" }}>
              <Honeypot />
              <div className="row">
                <div><label htmlFor="cp-name">Nome</label><input id="cp-name" name="name" required maxLength={120} /></div>
                <div><label htmlFor="cp-empresa">Empresa</label><input id="cp-empresa" name="empresa" required maxLength={120} /></div>
              </div>
              <div className="row">
                <div><label htmlFor="cp-email">E-mail corporativo</label><input id="cp-email" name="email" type="email" required maxLength={200} /></div>
                <div><label htmlFor="cp-phone">WhatsApp</label><input id="cp-phone" name="phone" type="tel" required maxLength={40} /></div>
              </div>
              <div className="row">
                <div><label htmlFor="cp-cidade">Cidade do evento</label><input id="cp-cidade" name="cidade" maxLength={80} /></div>
                <div><label htmlFor="cp-data">Data prevista</label><input id="cp-data" name="data_prevista" type="date" /></div>
              </div>
              <div className="row">
                <div><label htmlFor="cp-part">Nº estimado de participantes</label><input id="cp-part" name="participantes" type="number" min={1} max={10000} /></div>
                <div>
                  <label htmlFor="cp-tipo">Tipo de evento</label>
                  <select id="cp-tipo" name="tipo_evento" defaultValue="">
                    <option value="">Selecione</option>
                    {formatos.map((f) => <option key={f.titulo}>{f.titulo}</option>)}
                    <option>Outro</option>
                  </select>
                </div>
              </div>
              <div><label htmlFor="cp-msg">Mensagem</label><textarea id="cp-msg" name="mensagem" rows={4} maxLength={2000} /></div>
              <div><button className="m-btn" disabled={form.sending}>{form.sending ? "Enviando…" : "Solicitar proposta"}</button></div>
            </form>
          )}
          <p className="m-small" style={{ marginTop: "1rem" }}>{c.text("prazo_resposta")}</p>
        </section>

        <section className="m-sec">
          <h2>Perguntas frequentes</h2>
          <FaqList items={c.list("faq")} />
        </section>
      </div>
    </MonPage>
  );
}
