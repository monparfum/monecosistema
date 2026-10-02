import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { MonPage } from "@/components/mon/page";
import { BuyButton, catalogQuery, kitName, Ph, Price, useCatalog, artFor } from "@/components/mon/ui";
import { loadSite, useSite } from "@/lib/site-content";

export const Route = createFileRoute("/produtos/$slug")({
  loader: async ({ context, params }) => {
    const [, catalog] = await Promise.all([loadSite(context.queryClient, "produtos"), context.queryClient.ensureQueryData(catalogQuery).catch(() => [])]);
    const p = catalog.find((x) => x.slug === params.slug);
    if (p?.details?.kind === "curso") throw redirect({ to: "/cursos/$slug", params: { slug: params.slug } });
    return { title: p ? kitName(p) : undefined, description: p?.details?.desc || p?.description };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "Produto"} — MON PARFUM` }, ...(loaderData?.description ? [{ name: "description", content: loaderData.description }] : [])],
  }),
  component: Produto,
});

function Produto() {
  const { slug } = Route.useParams();
  const { bySlug, isLoading } = useCatalog();
  const c = useSite("produtos");
  const p = bySlug(slug);

  if (!p) {
    return (
      <MonPage><div className="m-wrap"><section className="m-sec">
        <h1>{isLoading ? "Carregando…" : "Produto não encontrado"}</h1>
        <div className="m-ctas"><Link to="/produtos" className="m-btn">Ver os produtos</Link></div>
      </section></div></MonPage>
    );
  }

  const d = p.details;
  const nome = kitName(p);
  const criacao = d.grupo === "criacao";

  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <Link to="/produtos" className="m-back">← Voltar para os produtos</Link>
          <div className="m-grid m-g2" style={{ alignItems: "start" }}>
            <div>
              {criacao && <div className="m-kick">Kit {nome} · Experiência olfativa em casa</div>}
              {d.grupo === "limitada" && <div className="m-kick">Edição limitada</div>}
              <h1>{nome}</h1>
              <p className="m-lead" style={{ marginTop: "1.2rem" }}>{d.desc || d.resumo || p.description}</p>
              {(d.topo || d.coracao || d.fundo) && (
                <>
                  <h3 style={{ marginTop: "1.6rem" }}>Notas do território</h3>
                  <ul className="m-clean">
                    {d.topo && <li><b>Topo</b> — {d.topo}</li>}
                    {d.coracao && <li><b>Coração</b> — {d.coracao}</li>}
                    {d.fundo && <li><b>Fundo</b> — {d.fundo}</li>}
                  </ul>
                </>
              )}
              {!d.kind && p.notes && <p><b>Notas:</b> {p.notes}</p>}
              <div className="m-buy">
                <div className="m-price"><Price p={p} /></div>
                <p className="m-small" style={{ marginTop: ".4rem" }}>Enviamos para todo o Brasil · Pix, boleto ou cartão</p>
                <div className="m-ctas" style={{ marginTop: "1.2rem" }}><BuyButton p={p} label={criacao ? "Comprar meu kit" : "Comprar"} /></div>
              </div>
              {d.grupo === "limitada" && <p className="m-small" style={{ marginTop: "1rem" }}>Edição limitada. Produzida uma única vez. Quando acaba, não volta.</p>}
            </div>
            <Ph style={{ minHeight: 420 }} image={p.image_url} art={artFor(`${nome} ${d.cor ?? ""}`, "kit")} alt={nome} />
          </div>
        </section>

        {criacao && (
          <section className="m-sec">
            <div className="m-grid m-g2" style={{ alignItems: "start" }}>
              <div>
                <h2>No kit você recebe</h2>
                <ul className="m-clean">{c.list("kit_itens").map((i, k) => <li key={k}>{i.texto}</li>)}</ul>
                <p className="m-small">{c.text("kit_assinatura")}</p>
              </div>
              <div>
                <h2>Quer ir além deste território?</h2>
                <p style={{ marginTop: "1.2rem" }}>Aprenda a compor com estas matérias-primas na Jornada MON.</p>
                <div className="m-ctas"><Link to="/cursos" className="m-btn ghost">Ver os cursos</Link></div>
              </div>
            </div>
          </section>
        )}
      </div>
    </MonPage>
  );
}
