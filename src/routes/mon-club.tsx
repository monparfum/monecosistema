import { createFileRoute, Link } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { loadSite, Rich, useSite } from "@/lib/site-content";
import { MEMBERS_APP_URL } from "@/lib/members-app";

export const Route = createFileRoute("/mon-club")({
  loader: ({ context }) => loadSite(context.queryClient, "club"),
  head: () => ({ meta: [{ title: "MON Club — MON PARFUM" }, { name: "description", content: "A comunidade de continuidade da MON PARFUM para alunos e ex-alunos." }] }),
  component: Club,
});


function Club() {
  const c = useSite("club");
  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <h1>{c.text("titulo")}</h1>
          <p className="m-lead" style={{ marginTop: "1.2rem" }}>{c.text("subtitulo")}</p>
          <div style={{ marginTop: "1.8rem" }}><Rich text={c.text("texto")} /></div>
        </section>
        <section className="m-sec">
          <h2>O que acontece lá dentro</h2>
          <div className="m-grid m-g2" style={{ marginTop: "1.5rem" }}>
            {c.list("dentro").map((s, i) => <div key={i}><h3>{s.titulo}</h3><p style={{ marginTop: ".5rem" }}>{s.texto}</p></div>)}
          </div>
        </section>
        <section className="m-sec">
          <h2>Por que o Club existe</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("porque")} /></div>
        </section>
        <section className="m-sec">
          <h2>Como participar</h2>
          <div style={{ marginTop: "1.2rem" }}><Rich text={c.text("participar")} /></div>
          <div className="m-ctas">
            {MEMBERS_APP_URL && <a href={MEMBERS_APP_URL} className="m-btn">Entrar no MON Club</a>}
            <Link to="/cursos" className={MEMBERS_APP_URL ? "m-btn ghost" : "m-btn"}>Ver os cursos</Link>
          </div>
        </section>
      </div>
    </MonPage>
  );
}
