import { createFileRoute, Link } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { catalogQuery, KitCard, Price, useCatalog } from "@/components/mon/ui";
import { loadSite, Rich, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/produtos/")({
  loader: ({ context }) => Promise.all([loadSite(context.queryClient, "produtos"), context.queryClient.ensureQueryData(catalogQuery).catch(() => null)]),
  head: () => ({ meta: [{ title: "Produtos — MON PARFUM" }, { name: "description", content: "Kits de criação, kits de treinamento olfativo e fragrâncias autorais — tudo o que a MON cria, enviado para a sua casa." }] }),
  component: Produtos,
});

function Produtos() {
  const c = useSite("produtos");
  const { kits, outros } = useCatalog();
  const grupos = [
    { g: "criacao" as const, titulo: c.text("criacao_titulo"), texto: c.text("criacao_texto"), cols: "m-g2", cta: "Conhecer o kit", price: false },
    { g: "treino" as const, titulo: c.text("treino_titulo"), texto: c.text("treino_texto"), cols: "m-g3", cta: "Ver o kit", price: true },
    { g: "limitada" as const, titulo: c.text("limitada_titulo"), texto: c.text("limitada_texto"), cols: "m-g2", cta: "Conhecer", price: false },
  ];

  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <h1>{c.text("titulo")}</h1>
          <p className="m-lead" style={{ marginTop: "1.3rem" }}>{c.text("subtitulo")}</p>
        </section>

        {grupos.map(({ g, titulo, texto, cols, cta, price }) => kits(g).length > 0 && (
          <section key={g} className="m-sec">
            <h2>{titulo}</h2>
            <div style={{ marginTop: "1.2rem" }}><Rich text={texto} /></div>
            <div className={`m-grid ${cols}`} style={{ marginTop: "1.8rem" }}>
              {kits(g).map((p) => <KitCard key={p.id} p={p} cta={cta} showPrice={price} />)}
            </div>
            {g === "limitada" && <p className="m-small" style={{ marginTop: "1.2rem" }}>{c.text("limitada_nota")}</p>}
          </section>
        ))}

        {outros.length > 0 && (
          <section className="m-sec">
            <h2>{c.text("outros_titulo")}</h2>
            <div className="m-grid m-g3" style={{ marginTop: "1.8rem" }}>
              {outros.map((p) => (
                <div key={p.id} className="m-terr">
                  <div className="field f-bois" style={p.image_url ? { backgroundImage: `linear-gradient(transparent 40%, rgba(0,0,0,.45)), url(${p.image_url})` } : undefined}><span>{p.name}</span></div>
                  <div className="body">
                    <p>{p.description}</p>
                    <div className="kprice"><Price p={p} /></div>
                    <Link to="/produtos/$slug" params={{ slug: p.slug }} className="m-btn sm">Ver produto</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </MonPage>
  );
}
