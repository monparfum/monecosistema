import { createFileRoute, Link } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { catalogQuery, CourseCard, Ph, useCatalog } from "@/components/mon/ui";
import { Inline, lines, loadSite, Rich, useSite, waLink } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  loader: ({ context }) => Promise.all([loadSite(context.queryClient, "home"), context.queryClient.ensureQueryData(catalogQuery).catch(() => null)]),
  head: () => ({
    meta: [
      { title: "MON PARFUM — Experiência Olfativa" },
      { name: "description", content: "Matérias-primas na sua casa, aulas com perfumistas experientes, e no final — uma fórmula que é só sua." },
    ],
  }),
  component: Home,
});

function Home() {
  const c = useSite("home");
  const g = useSite("geral");
  const { cursos } = useCatalog();
  const destaques = (cursos.some((p) => p.details.destaque) ? cursos.filter((p) => p.details.destaque) : cursos).slice(0, 3);
  const depoimentos = c.list("depoimentos").filter((d) => d.texto?.trim());

  return (
    <MonPage>
      <div className="m-wrap">
        <div className="m-hero">
          <div>
            <h1>{lines(c.text("hero_titulo")).map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</h1>
            <p className="m-lead" style={{ marginTop: "1.5rem" }}><Inline text={c.text("hero_texto")} /></p>
            <div className="m-ctas">
              <Link to="/cursos" className="m-btn">Ver os cursos</Link>
              <Link to="/quiz" className="m-btn ghost">Fazer o quiz</Link>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <Ph style={{ minHeight: 400 }} image={c.text("hero_foto")} art="vanille" alt="Fundadoras da MON PARFUM" />
            {c.text("citacao") && (
              <div className="m-quote">
                <p>{c.text("citacao")}</p>
                <p className="m-small" style={{ marginTop: ".6rem" }}><Inline text={c.text("citacao_autor")} /></p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="m-band">
        <div className="m-wrap inner">
          <div>
            <h2>{c.text("quiz_titulo")}</h2>
            <p style={{ marginTop: ".8rem" }}>{c.text("quiz_texto")}</p>
          </div>
          <div>
            <Link to="/quiz" className="m-btn">Fazer o quiz</Link>
            <div className="m-small" style={{ color: "#9A9089", marginTop: ".7rem" }}>Rápido e gratuito. Resultado personalizado na hora.</div>
          </div>
        </div>
      </div>

      <div className="m-wrap">
        <section className="m-sec">
          <div className="m-top">
            <div>
              <h2>{c.text("manifesto_titulo")}</h2>
              <div style={{ marginTop: "1.4rem" }}><Rich text={c.text("manifesto_texto")} /></div>
            </div>
            <Ph art="lavande" />
          </div>
        </section>

        <section className="m-sec">
          <h2>{c.text("jornada_titulo")}</h2>
          <div className="m-steps">
            {c.list("jornada").map((s, i) => <div key={i} className="m-step"><div className="n">{i + 1}</div><h3>{s.titulo}</h3><p>{s.texto}</p></div>)}
          </div>
        </section>

        <section className="m-sec">
          <h2>Por onde entrar</h2>
          <div className="m-paths">
            <div className="m-path primary">
              <h3>Cursos</h3>
              <dl><dt>Formato</dt><dd>Online ou gravado, sempre com kit</dd><dt>Você sai com</dt><dd>Técnica, repertório e fórmulas suas</dd></dl>
              <Link to="/cursos" className="m-btn sm">Ver cursos</Link>
            </div>
            <div className="m-path">
              <h3>Experiências</h3>
              <dl><dt>Formato</dt><dd>Kit com vídeo-guia, enviado para sua casa</dd><dt>Você sai com</dt><dd>Seu perfume, envasado e nomeado por você</dd></dl>
              <Link to="/experiencias" className="m-btn sm ghost">Ver experiências</Link>
            </div>
            <div className="m-path">
              <h3>Corporativo</h3>
              <dl><dt>Formato</dt><dd>Workshop no seu evento ou empresa</dd><dt>Você sai com</dt><dd>O perfume de cada participante e uma memória coletiva</dd></dl>
              <Link to="/corporativo" className="m-btn sm ghost">Solicitar proposta</Link>
            </div>
          </div>
        </section>

        {destaques.length > 0 && (
          <section className="m-sec">
            <h2>{c.text("destaques_titulo")}</h2>
            <p className="m-lead" style={{ marginTop: ".7rem" }}>{c.text("destaques_texto")}</p>
            <div className="m-grid m-g3" style={{ marginTop: "1.8rem" }}>
              {destaques.map((p) => <CourseCard key={p.id} p={p} />)}
            </div>
            <div className="m-ctas"><Link to="/cursos" className="m-btn ghost">Ver todos os cursos</Link></div>
          </section>
        )}

        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "center" }}>
            <div>
              <h2>{c.text("kit_titulo")}</h2>
              <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("kit_texto")} /></div>
              <div className="m-ctas"><Link to="/experiencias" className="m-btn">Ver os Kits MON</Link></div>
            </div>
            <Ph style={{ minHeight: 300 }} image={c.text("kit_foto")} art="kit" alt="Kit MON aberto" />
          </div>
        </section>

        <section className="m-sec">
          <div className="m-grid m-g2" style={{ alignItems: "center" }}>
            <Ph style={{ minHeight: 300 }} image={c.text("fundadoras_foto")} art="jasmin" alt="Daniela Bitelo na bancada" />
            <div>
              <h2>{c.text("fundadoras_titulo")}</h2>
              <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("fundadoras_texto")} /></div>
              <div className="m-ctas"><Link to="/sobre" className="m-btn ghost">Conhecer a MON</Link></div>
            </div>
          </div>
        </section>

        {depoimentos.length > 0 && (
          <section className="m-sec">
            <h2>Vozes da MON</h2>
            <div className="m-grid m-g3" style={{ marginTop: "1.6rem" }}>
              {depoimentos.map((d, i) => (
                <div key={i} className="m-terr"><div className="body">
                  <p style={{ fontFamily: "var(--m-serif)", fontStyle: "italic", fontSize: "1.1rem", color: "var(--m-ink)" }}>"{d.texto}"</p>
                  <p className="m-small" style={{ margin: 0 }}><b>{d.nome}</b>{d.curso && <><br />{d.curso}</>}</p>
                </div></div>
              ))}
            </div>
          </section>
        )}

        <section className="m-sec">
          <h2>{c.text("club_titulo")}</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("club_texto")} /></div>
          <div className="m-ctas"><Link to="/mon-club" className="m-btn ghost">Conhecer o MON Club</Link></div>
        </section>

        <section className="m-sec">
          <h2>{c.text("final_titulo")}</h2>
          <p style={{ marginTop: "1.1rem" }}>{c.text("final_texto")}</p>
          <div className="m-ctas">
            <Link to="/cursos" className="m-btn">Ver os cursos</Link>
            <a className="m-btn ghost" href={waLink(g.text("whatsapp_numero"))} target="_blank" rel="noopener noreferrer">Falar com a MON no WhatsApp</a>
          </div>
        </section>
      </div>
    </MonPage>
  );
}
