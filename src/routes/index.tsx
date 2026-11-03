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

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

function Home() {
  const c = useSite("home");
  const g = useSite("geral");
  const { cursos } = useCatalog();
  const escolhidos = c.text("destaques_cursos").split(",").map((s) => s.trim()).filter(Boolean)
    .map((id) => cursos.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const destaques = escolhidos.length ? escolhidos : (cursos.some((p) => p.details.destaque) ? cursos.filter((p) => p.details.destaque) : cursos).slice(0, 3);
  const depoimentos = c.list("depoimentos").filter((d) => d.texto?.trim());

  return (
    <MonPage overlay>
      <section className="m-banner" style={c.text("hero_foto") ? { backgroundImage: `url(${c.text("hero_foto")})` } : undefined} aria-label="Abertura">
        <div className="m-wrap m-banner-in">
          <div className="m-kick m-reveal">{c.text("hero_kick")}</div>
          <h1 className="m-reveal" style={delay(1)}>{lines(c.text("hero_titulo")).map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</h1>
        </div>
      </section>

      <div className="m-wrap">
        <section className="m-mission">
          <div className="m-hero-row">
            <div className="m-reveal">
              <div className="m-kick">Nossa missão</div>
              <p className="m-lead"><Inline text={c.text("hero_texto")} /></p>
              <div className="m-ctas">
                <Link to="/cursos" className="m-btn">Ver os cursos</Link>
                <Link to="/quiz" className="m-btn ghost">Fazer o quiz</Link>
              </div>
            </div>
            {c.text("citacao") && (
              <div className="m-quote m-reveal" style={delay(1)}>
                <p>{c.text("citacao")}</p>
                <p className="m-small" style={{ marginTop: ".6rem" }}><Inline text={c.text("citacao_autor")} /></p>
              </div>
            )}
          </div>
        </section>

        <div className="m-band m-reveal">
          <div className="inner">
            <div>
              <div className="m-kick">Quiz olfativo</div>
              <h2>{c.text("quiz_titulo")}</h2>
              <p style={{ marginTop: ".8rem" }}>{c.text("quiz_texto")}</p>
            </div>
            <div>
              <Link to="/quiz" className="m-btn">Fazer o quiz</Link>
              <div className="m-small" style={{ color: "var(--m-on-surface-soft)", marginTop: ".7rem" }}>Rápido e gratuito. Resultado personalizado na hora.</div>
            </div>
          </div>
        </div>

        <section className="m-sec m-reveal">
          <div className="m-top">
            <div>
              <div className="m-kick">Manifesto</div>
              <h2>{c.text("manifesto_titulo")}</h2>
              <div style={{ marginTop: "1.4rem" }}><Rich text={c.text("manifesto_texto")} /></div>
            </div>
            <Ph style={{ minHeight: 420 }} image={c.text("manifesto_foto") || "/img/manifesto.jpg"} alt="Aluna sentindo três fitas olfativas com frascos abertos na mesa" />
          </div>
        </section>

        <section className="m-sec m-reveal">
          <div className="m-kick">A jornada</div>
          <h2>{c.text("jornada_titulo")}</h2>
          <div className="m-steps">
            {c.list("jornada").map((s, i) => <div key={i} className="m-step"><div className="n">{i + 1}</div><h3>{s.titulo}</h3><p>{s.texto}</p></div>)}
          </div>
        </section>

        <section className="m-sec m-reveal">
          <div className="m-kick">Por onde entrar</div>
          <h2>Três caminhos para a sua perfumaria</h2>
          <div className="m-bento">
            <Link to="/cursos" className="m-cell c6">
              <div className="m-idx">01 — Cursos</div>
              <h3>Aprenda com perfumistas</h3>
              <dl><dt>Formato</dt><dd>Online ou gravado, sempre com kit</dd><dt>Você sai com</dt><dd>Técnica, repertório e fórmulas suas</dd></dl>
              <span className="m-btn sm">Ver cursos</span>
              <div className="art" style={{ backgroundImage: "url(/img/fougere.webp)" }} aria-hidden="true" />
            </Link>
            <Link to="/experiencias" className="m-cell c3 tint">
              <div className="m-idx">02 — Experiências</div>
              <h3>Crie em casa</h3>
              <dl><dt>Formato</dt><dd>Kit com vídeo-guia, enviado para sua casa</dd><dt>Você sai com</dt><dd>Seu perfume, envasado e nomeado por você</dd></dl>
              <span className="m-btn sm ghost">Ver experiências</span>
            </Link>
            <Link to="/corporativo" className="m-cell c3 dark">
              <div className="m-idx">03 — Corporativo</div>
              <h3>Workshop na sua empresa</h3>
              <dl><dt>Formato</dt><dd>No seu evento ou escritório</dd><dt>Você sai com</dt><dd>O perfume de cada participante e uma memória coletiva</dd></dl>
              <span className="m-btn sm">Solicitar proposta</span>
            </Link>
          </div>
        </section>

        {destaques.length > 0 && (
          <section className="m-sec m-reveal">
            <div className="m-kick">Em destaque</div>
            <h2>{c.text("destaques_titulo")}</h2>
            <p className="m-lead" style={{ marginTop: ".7rem" }}>{c.text("destaques_texto")}</p>
            <div className="m-grid m-g3" style={{ marginTop: "1.8rem" }}>
              {destaques.map((p) => <CourseCard key={p.id} p={p} />)}
            </div>
            <div className="m-ctas"><Link to="/cursos" className="m-btn ghost">Ver todos os cursos</Link></div>
          </section>
        )}

        <section className="m-sec m-reveal">
          <div className="m-grid m-g2" style={{ alignItems: "center", gap: "clamp(2rem, 5vw, 4rem)" }}>
            <div>
              <div className="m-kick">Kits MON</div>
              <h2>{c.text("kit_titulo")}</h2>
              <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("kit_texto")} /></div>
              <div className="m-ctas"><Link to="/experiencias" className="m-btn">Ver os Kits MON</Link></div>
            </div>
            <Ph style={{ minHeight: 320 }} image={c.text("kit_foto")} art="kit" alt="Kit MON aberto" />
          </div>
        </section>

        <section className="m-sec m-reveal">
          <div className="m-grid m-g2" style={{ alignItems: "center", gap: "clamp(2rem, 5vw, 4rem)" }}>
            <Ph style={{ minHeight: 320 }} image={c.text("fundadoras_foto")} art="jasmin" alt="Daniela Bitelo e Letícia Netto Zelaquett, fundadoras da MON" />
            <div>
              <div className="m-kick">Quem faz</div>
              <h2>{c.text("fundadoras_titulo")}</h2>
              <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("fundadoras_texto")} /></div>
              <div className="m-ctas"><Link to="/sobre" className="m-btn ghost">Conhecer a MON</Link></div>
            </div>
          </div>
        </section>

        {depoimentos.length > 0 && (
          <section className="m-sec m-reveal">
            <div className="m-kick">Vozes da MON</div>
            <h2>Quem já passou pela bancada</h2>
            <div className="m-grid m-g3" style={{ marginTop: "1.8rem" }}>
              {depoimentos.map((d, i) => (
                <div key={i} className="m-terr"><div className="body">
                  <p style={{ fontSize: "1.05rem", color: "var(--m-ink)", letterSpacing: "-.01em", lineHeight: 1.55 }}>"{d.texto}"</p>
                  <p className="m-mono" style={{ margin: 0, color: "var(--m-ink-faint)" }}>{d.nome}{d.curso && <><br />{d.curso}</>}</p>
                </div></div>
              ))}
            </div>
          </section>
        )}

        <section className="m-sec m-reveal">
          <div className="m-kick">MON Club</div>
          <h2>{c.text("club_titulo")}</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("club_texto")} /></div>
          <div className="m-ctas"><Link to="/mon-club" className="m-btn ghost">Conhecer o MON Club</Link></div>
        </section>

        <section className="m-sec m-reveal">
          <div className="m-band">
            <div className="inner">
              <div>
                <div className="m-kick">Começar</div>
                <h2>{c.text("final_titulo")}</h2>
                <p style={{ marginTop: "1.1rem" }}>{c.text("final_texto")}</p>
              </div>
              <div className="m-ctas" style={{ marginTop: 0 }}>
                <Link to="/cursos" className="m-btn">Ver os cursos</Link>
                <a className="m-btn" href={waLink(g.text("whatsapp_numero"))} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MonPage>
  );
}
