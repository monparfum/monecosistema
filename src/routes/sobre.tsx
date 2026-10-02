import { createFileRoute, Link } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { Ph } from "@/components/mon/ui";
import { loadSite, Rich, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/sobre")({
  loader: ({ context }) => loadSite(context.queryClient, "sobre"),
  head: () => ({ meta: [{ title: "Sobre — MON PARFUM" }, { name: "description", content: "Plataforma brasileira de formação em perfumaria autoral, sediada em Florianópolis (SC)." }] }),
  component: Sobre,
});

function Sobre() {
  const c = useSite("sobre");
  const g = useSite("geral");
  const cargo = { marginTop: ".4rem", fontFamily: "var(--m-serif)", fontStyle: "italic", color: "var(--m-ink-soft)" } as const;
  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <h1>{c.text("titulo")}</h1>
          <div style={{ marginTop: "1.6rem" }}><Rich text={c.text("intro")} /></div>
        </section>
        <section className="m-sec">
          <h2>Por que a MON existe</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("porque")} /></div>
        </section>
        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <div>
              <h2>Daniela Bitelo</h2>
              <p style={cargo}>{c.text("daniela_cargo")}</p>
              <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("daniela_texto")} /></div>
            </div>
            <Ph style={{ minHeight: 300 }} image={c.text("daniela_foto")} alt="Daniela Bitelo" />
          </div>
        </section>
        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <Ph style={{ minHeight: 300 }} image={c.text("leticia_foto")} alt="Letícia Netto Zelaquett" />
            <div>
              <h2>Letícia Netto Zelaquett</h2>
              <p style={cargo}>{c.text("leticia_cargo")}</p>
              <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("leticia_texto")} /></div>
            </div>
          </div>
        </section>
        <section className="m-sec">
          <h2>Nosso método</h2>
          <div className="m-grid m-g3" style={{ marginTop: "1.5rem" }}>
            {c.list("metodo").map((s, i) => <div key={i}><h3>{s.titulo}</h3><p style={{ marginTop: ".5rem" }}>{s.texto}</p></div>)}
          </div>
        </section>
        <section className="m-sec">
          <div className="m-creds">
            <div><b>ISIPCA — Versailles</b><span>Formação da fundadora</span></div>
            <div><b>International Perfume Foundation</b><span>Paris, França</span></div>
            <div><b>Kit físico</b><span>Enviado para todo o Brasil</span></div>
            <div><b>Online e no seu ritmo</b><span>Você escolhe o formato</span></div>
            {c.text("nota_media") && <div className="score"><b>{c.text("nota_media")}</b><span>{c.text("nota_texto")}</span></div>}
          </div>
        </section>
        <section className="m-sec">
          <h2>Onde estamos</h2>
          <p style={{ marginTop: "1.2rem" }}><b>Atelier MON — Florianópolis</b><br />{g.text("endereco")}<br />{g.text("cidade")}</p>
          <p>As formações online e os Kits MON atendem todo o Brasil.</p>
          <div className="m-ctas">
            <Link to="/cursos" className="m-btn">Ver os cursos</Link>
            <Link to="/experiencias" className="m-btn ghost">Ver os Kits MON</Link>
          </div>
        </section>
      </div>
    </MonPage>
  );
}
