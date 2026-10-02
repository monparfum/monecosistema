import { createFileRoute, Link } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { BuyButton, catalogQuery, Ph, Price, useCatalog, artFor } from "@/components/mon/ui";
import { Inline, lines, loadSite, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/cursos/$slug")({
  loader: async ({ context, params }) => {
    const [, catalog] = await Promise.all([loadSite(context.queryClient, "cursos"), context.queryClient.ensureQueryData(catalogQuery).catch(() => [])]);
    const p = catalog.find((x) => x.slug === params.slug);
    return { title: p?.name, description: p?.description };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "Curso"} — MON PARFUM` }, ...(loaderData?.description ? [{ name: "description", content: loaderData.description }] : [])],
  }),
  component: Curso,
});

function Curso() {
  const { slug } = Route.useParams();
  const { bySlug, isLoading } = useCatalog();
  const c = useSite("cursos");
  const p = bySlug(slug);

  if (!p) {
    return (
      <MonPage><div className="m-wrap"><section className="m-sec">
        <h1>{isLoading ? "Carregando…" : "Curso não encontrado"}</h1>
        <div className="m-ctas"><Link to="/cursos" className="m-btn">Ver todos os cursos</Link></div>
      </section></div></MonPage>
    );
  }
  const d = p.details;
  const aprende = lines(d.aprende ?? "");

  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <Link to="/cursos" className="m-back">← Voltar para os cursos</Link>
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <div>
              <div className="m-kick">{[d.estagio, d.formato].filter(Boolean).join(" · ")}</div>
              <h1>{p.name}</h1>
              {d.dor && <p className="m-lead" style={{ marginTop: "1.2rem", fontFamily: "var(--m-serif)", fontStyle: "italic", fontSize: "1.35rem" }}>{d.dor}</p>}
              <p style={{ marginTop: "1rem" }}>{d.sub || p.description}</p>
            </div>
            <Ph style={{ minHeight: 320 }} image={p.image_url} art={artFor(p.name, "kit")} alt={p.name} />
          </div>

          <div className="m-kpis">
            {d.nota && <div><b>{d.nota}</b><span>Média das avaliações</span></div>}
            {d.formato && <div><b>{d.formato}</b><span>Formato</span></div>}
            <div><b>Kit incluso</b><span>Enviado antes da 1ª aula</span></div>
            {d.estagio && <div><b>{d.estagio}</b><span>Estágio</span></div>}
          </div>

          <div className="m-buy">
            <div className="m-price"><Price p={p} /></div>
            <p className="m-small" style={{ marginTop: ".4rem" }}>{d.turma ? `Próxima turma: ${d.turma} · ` : ""}Pix, boleto ou cartão</p>
            <div className="m-ctas" style={{ marginTop: "1.2rem" }}><BuyButton p={p} label="Garantir minha vaga" /></div>
          </div>
        </section>

        {(d.prereq || d.naoE || aprende.length > 0) && (
          <section className="m-sec">
            <div className="m-grid m-g2" style={{ alignItems: "start" }}>
              <div>
                <h2>Para quem é este curso</h2>
                {d.prereq && <p style={{ marginTop: "1.2rem" }}><b>Pré-requisito:</b> {d.prereq}</p>}
                {d.naoE && <p><b>Este curso não é para você se:</b> {d.naoE}</p>}
              </div>
              {aprende.length > 0 && (
                <div>
                  <h2>O que você vai aprender</h2>
                  <ul className="m-clean">{aprende.map((a) => <li key={a}>{a}</li>)}</ul>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="m-sec">
          <h2>Como funciona</h2>
          <ul className="m-clean" style={{ maxWidth: "70ch" }}>{c.list("como_funciona").map((i, k) => <li key={k}><Inline text={i.texto ?? ""} /></li>)}</ul>
          <p className="m-small" style={{ marginTop: "1.2rem" }}>{c.text("aviso_vagas")}</p>
          <div className="m-ctas"><BuyButton p={p} label="Garantir minha vaga" /></div>
        </section>
      </div>
    </MonPage>
  );
}
