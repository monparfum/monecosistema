import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MonPage } from "@/components/mon/page";
import { catalogQuery, CourseCard, ESTAGIOS, FaqList, Ph, useCatalog } from "@/components/mon/ui";
import { Inline, loadSite, Rich, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/cursos/")({
  loader: ({ context }) => Promise.all([loadSite(context.queryClient, "cursos"), context.queryClient.ensureQueryData(catalogQuery).catch(() => null)]),
  head: () => ({ meta: [{ title: "Cursos — MON PARFUM" }, { name: "description", content: "Da primeira matéria-prima à fórmula autoral. Todo curso inclui kit enviado à sua casa." }] }),
  component: Cursos,
});

const TEXTOS: Record<string, string> = {
  Iniciante: "Você gosta de perfume e quer entender como um é construído.",
  Intermediário: "Você já tem base e quer criar de verdade.",
  Avançado: "Você cria bem e quer viver disso.",
};

function Filter({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="m-small" style={{ marginBottom: ".6rem" }}>{label}</div>
      <div className="m-filter">
        {values.map((v) => <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>{v}</button>)}
      </div>
    </div>
  );
}

function Cursos() {
  const c = useSite("cursos");
  const { cursos } = useCatalog();
  const [formato, setFormato] = useState("Todos");
  const [estagio, setEstagio] = useState("Todos");
  const formatos = ["Todos", ...Array.from(new Set(cursos.map((p) => p.details.formato).filter(Boolean) as string[]))];
  const list = cursos.filter((p) => (formato === "Todos" || p.details.formato === formato) && (estagio === "Todos" || p.details.estagio === estagio));
  const grupos = [...ESTAGIOS, "Outros"].map((e) => ({ e, cs: list.filter((p) => (ESTAGIOS as readonly string[]).includes(p.details.estagio ?? "") ? p.details.estagio === e : e === "Outros") }));

  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <div className="m-top">
            <div>
              <h1>{c.text("titulo")}</h1>
              <p className="m-lead" style={{ marginTop: "1.3rem" }}>{c.text("subtitulo")}</p>
              <div style={{ marginTop: "1.6rem" }}><Rich text={c.text("texto")} /></div>
            </div>
            <Ph image="/img/cursos-topo.webp" alt="Aluna estudando com o kit MON aberto, caderno e fitas olfativas" />
          </div>
          <div className="m-note row" style={{ marginTop: "1.6rem" }}>
            <div><b>Ainda não sabe qual escolher?</b> Faça o quiz e receba uma recomendação personalizada.</div>
            <Link to="/quiz" className="m-btn sm">Fazer o quiz</Link>
          </div>

          <div style={{ marginTop: "2.2rem", display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
            {formatos.length > 2 && <Filter label="Formato" values={formatos} value={formato} onChange={setFormato} />}
            <Filter label="Estágio" values={["Todos", ...ESTAGIOS]} value={estagio} onChange={setEstagio} />
          </div>

          <div style={{ marginTop: "2rem" }}>
            {!list.length ? (
              <p className="m-note">Nenhum curso com essa combinação agora. Tire o filtro ou responda o quiz para ver o que faz sentido para você.</p>
            ) : grupos.filter((g) => g.cs.length).map(({ e, cs }) => (
              <div key={e} style={{ marginTop: "2.2rem" }}>
                <h3 style={{ fontSize: "1.6rem" }}>{e}</h3>
                {TEXTOS[e] && <p className="m-small" style={{ marginTop: ".3rem" }}>{TEXTOS[e]}</p>}
                <div className="m-grid m-g3" style={{ marginTop: "1.2rem" }}>
                  {cs.map((p) => <CourseCard key={p.id} p={p} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="m-sec">
          <h2>{c.text("kit_titulo")}</h2>
          <p style={{ marginTop: "1.2rem" }}>{c.text("kit_texto")}</p>
          <div className="m-grid m-g2" style={{ marginTop: "1.2rem", alignItems: "start" }}>
            <ul className="m-clean">{c.list("kit_itens").map((i, k) => <li key={k}><Inline text={i.texto ?? ""} /></li>)}</ul>
            <Ph style={{ minHeight: 300 }} image={c.text("kit_foto")} art="kit" alt="Kit do curso aberto" />
          </div>
        </section>

        <section className="m-sec">
          <h2>{c.text("incluso_titulo")}</h2>
          <ul className="m-clean" style={{ maxWidth: "70ch" }}>{c.list("incluso").map((i, k) => <li key={k}><Inline text={i.texto ?? ""} /></li>)}</ul>
          {c.text("incluso_nota") && <div className="m-note" style={{ marginTop: "1.5rem" }}><Inline text={c.text("incluso_nota")} /></div>}
        </section>

        <section className="m-sec">
          <h2>{c.text("faq_titulo")}</h2>
          <FaqList items={c.list("faq")} />
        </section>
      </div>
    </MonPage>
  );
}
