import { createFileRoute, Link } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { catalogQuery, FaqList, KitCard, kitName, useCatalog, Ph } from "@/components/mon/ui";
import { Inline, loadSite, Rich, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/experiencias")({
  loader: ({ context }) => Promise.all([loadSite(context.queryClient, "experiencias"), context.queryClient.ensureQueryData(catalogQuery).catch(() => null)]),
  head: () => ({ meta: [{ title: "Experiências de criação — MON PARFUM" }, { name: "description", content: "Escolha seu território, receba o kit em casa e componha seu próprio perfume." }] }),
  component: Experiencias,
});

function Experiencias() {
  const c = useSite("experiencias");
  const { kits } = useCatalog();
  const territorios = kits("criacao");
  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <div className="m-top">
            <div>
              <h1>{c.text("titulo")}</h1>
              <p className="m-lead" style={{ marginTop: "1.3rem" }}>{c.text("subtitulo")}</p>
            </div>
            <Ph image="/img/experiencias-topo.webp" alt="Aluna em casa sentindo uma fita olfativa com o kit MON aberto" />
          </div>
        </section>

        <section className="m-sec">
          <h2>{c.text("secao_titulo")}</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("secao_texto")} /></div>
          {territorios.length > 0 && (
            <>
              <h3 style={{ marginTop: "1.6rem", fontSize: "1rem", fontFamily: "var(--m-sans)", fontWeight: 600 }}>Territórios disponíveis</h3>
              <div className="m-grid m-g2" style={{ marginTop: "1rem" }}>
                {territorios.map((p) => <KitCard key={p.id} p={p} cta={`Ver o Kit ${kitName(p)}`} />)}
              </div>
            </>
          )}
          <div className="m-note row" style={{ marginTop: "1.5rem" }}>
            <div><b>Não sabe por onde começar?</b> Faça o quiz e descubra.</div>
            <Link to="/quiz" className="m-btn sm">Fazer o quiz</Link>
          </div>
        </section>

        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <div>
              <h2>O que vem no kit</h2>
              <ul className="m-clean">{c.list("kit_itens").map((i, k) => <li key={k}><Inline text={i.texto ?? ""} /></li>)}</ul>
            </div>
            <div>
              <h2>Como funciona</h2>
              <div className="m-steps c1">
                {c.list("passos").map((s, i) => <div key={i} className="m-step"><div className="n">{i + 1}</div><p>{s.texto}</p></div>)}
              </div>
              <p style={{ marginTop: "1.2rem" }}><Inline text={c.text("passos_nota")} /></p>
            </div>
          </div>
        </section>

        <section className="m-sec">
          <h2>Perguntas frequentes</h2>
          <FaqList items={c.list("faq")} />
        </section>

        <section className="m-sec">
          <h2>{c.text("jornada_titulo")}</h2>
          <div style={{ marginTop: "1.1rem" }}><Rich text={c.text("jornada_texto")} /></div>
          <div className="m-ctas"><Link to="/cursos" className="m-btn">Ver os cursos MON</Link></div>
        </section>

        <section className="m-sec">
          <div className="m-privebox">
            <h3>Atelier Privé</h3>
            <div style={{ marginTop: ".8rem", fontSize: ".95rem" }}><Rich text={c.text("prive_texto")} /></div>
            <p style={{ fontSize: ".95rem", color: "var(--m-ink-faint)" }}>Agenda restrita. Por solicitação.</p>
            <Link to="/atelier-prive" className="m-btn sm ghost">Saber mais sobre o Atelier Privé</Link>
          </div>
        </section>
      </div>
    </MonPage>
  );
}
