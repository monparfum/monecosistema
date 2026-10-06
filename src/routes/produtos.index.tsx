import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { MonPage } from "@/components/mon/page";
import { catalogQuery, useCatalog, ShopProduct } from "@/components/mon/ui";
import { loadSite, useSite } from "@/lib/site-content";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/produtos/")({
  loader: ({ context }) =>
    Promise.all([
      loadSite(context.queryClient, "produtos"),
      context.queryClient.ensureQueryData(catalogQuery).catch(() => null),
    ]),
  head: () => ({
    meta: [
      { title: "Produtos — MON PARFUM" },
      {
        name: "description",
        content:
          "Kits de criação, kits de treinamento olfativo, formações com kit e fragrâncias autorais — tudo o que a MON cria, enviado para a sua casa.",
      },
    ],
  }),
  component: Produtos,
});

type FilterCategory = "todos" | "cursos" | "treino" | "limitada";
type SortOption = "ordem" | "preco_asc" | "preco_desc" | "nome";

function Produtos() {
  const c = useSite("produtos");
  const { all } = useCatalog();
  const [filter, setFilter] = useState<FilterCategory>("todos");
  const [sort, setSort] = useState<SortOption>("ordem");

  // Apenas produtos ativos
  const activeProducts = useMemo(() => {
    return all.filter((p) => p.active);
  }, [all]);

  // Contagens
  const counts = useMemo(() => {
    const cursos = activeProducts.filter((p) => p.details?.kind === "curso").length;
    const treino = activeProducts.filter((p) => p.details?.grupo === "treino").length;
    const limitada = activeProducts.filter((p) => p.details?.grupo === "limitada").length;
    return {
      todos: activeProducts.length,
      cursos,
      treino,
      limitada,
    };
  }, [activeProducts]);

  // Filtragem e ordenação
  const displayedProducts = useMemo(() => {
    let list = activeProducts;

    if (filter === "cursos") {
      list = list.filter((p) => p.details?.kind === "curso");
    } else if (filter === "treino") {
      list = list.filter((p) => p.details?.grupo === "treino");
    } else if (filter === "limitada") {
      list = list.filter((p) => p.details?.grupo === "limitada");
    }

    return [...list].sort((a, b) => {
      if (sort === "preco_asc") return a.price_cents - b.price_cents;
      if (sort === "preco_desc") return b.price_cents - a.price_cents;
      if (sort === "nome") return a.name.localeCompare(b.name);
      const orderA = a.details?.order ?? 999;
      const orderB = b.details?.order ?? 999;
      return orderA - orderB;
    });
  }, [activeProducts, filter, sort]);

  return (
    <MonPage>
      <div className="m-wrap" style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}>
        {/* Cabeçalho da página */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, marginBottom: "0.8rem" }}>
            {c.text("titulo") || "Produtos"}
          </h1>
          <p
            className="m-lead"
            style={{ margin: "0 auto", maxWidth: "60ch", fontSize: "1.05rem", color: "var(--m-ink-soft)" }}
          >
            {c.text("subtitulo") ||
              "Kits de criação, kits de treinamento olfativo, formações com kit e fragrâncias autorais — tudo o que a MON cria, enviado para a sua casa."}
          </p>
        </div>

        {/* Barra de Filtros e Ordenação */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            paddingBottom: "1.2rem",
            borderBottom: "1px solid var(--m-rule)",
            marginBottom: "2.5rem",
          }}
        >
          {/* Abas / Filtros */}
          <div className="m-filter" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              aria-pressed={filter === "todos"}
              onClick={() => setFilter("todos")}
              style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}
            >
              Todos ({counts.todos})
            </button>
            <button
              aria-pressed={filter === "cursos"}
              onClick={() => setFilter("cursos")}
              style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}
            >
              Cursos & Formações ({counts.cursos})
            </button>
            <button
              aria-pressed={filter === "treino"}
              onClick={() => setFilter("treino")}
              style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}
            >
              Kits de Treinamento ({counts.treino})
            </button>
            {counts.limitada > 0 && (
              <button
                aria-pressed={filter === "limitada"}
                onClick={() => setFilter("limitada")}
                style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}
              >
                Edições Limitadas ({counts.limitada})
              </button>
            )}
          </div>

          {/* Seletor de Ordenação */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <label htmlFor="sort-select" style={{ fontSize: "0.82rem", color: "var(--m-ink-faint)" }}>
              Ordenar por:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              style={{
                font: "inherit",
                fontSize: "0.82rem",
                padding: "0.4rem 0.8rem",
                border: "1px solid var(--m-rule)",
                background: "#fff",
                color: "var(--m-ink)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="ordem">Classificar por padrão</option>
              <option value="preco_asc">Menor preço</option>
              <option value="preco_desc">Maior preço</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Grade de Produtos: 4 colunas no Desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "2.2rem 1.6rem",
          }}
        >
          {displayedProducts.map((p) => (
            <ProductCatalogCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </MonPage>
  );
}

function ProductCatalogCard({ p }: { p: ShopProduct }) {
  const isCourse = p.details?.kind === "curso";
  const targetTo = isCourse ? "/cursos/$slug" : "/produtos/$slug";
  const badge = p.details?.badge;
  const isOutOfStock = badge === "FORA DE ESTOQUE" || (!p.coming_soon && p.stock <= 0 && p.price_cents > 0);

  return (
    <Link
      to={targetTo}
      params={{ slug: p.slug }}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
        textDecoration: "none",
        color: "inherit",
        position: "relative",
      }}
      className="group"
    >
      {/* Container da Imagem Quadrada */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "100%", // 1:1 Aspect Ratio
          overflow: "hidden",
          backgroundColor: "#FAF8F5",
          border: "1px solid #EBE7DF",
          marginBottom: "0.85rem",
        }}
      >
        {/* Badge Flutuante */}
        {badge && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 10,
              padding: "3px 8px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              backgroundColor: badge === "FORA DE ESTOQUE" ? "#ffffff" : "#111111",
              color: badge === "FORA DE ESTOQUE" ? "#333333" : "#ffffff",
              border: badge === "FORA DE ESTOQUE" ? "1px solid #d4cfc5" : "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {badge}
          </span>
        )}

        {/* Imagem do Produto */}
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease-out",
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              backgroundColor: "#F2EFE9",
              color: "#999",
              fontSize: "0.8rem",
            }}
          >
            MON PARFUM
          </div>
        )}
      </div>

      {/* Nome do Produto */}
      <h3
        style={{
          fontFamily: "var(--m-sans)",
          fontSize: "0.98rem",
          fontWeight: 400,
          lineHeight: 1.35,
          color: "#1a1a1a",
          minHeight: "2.7em",
          marginBottom: "0.3rem",
          paddingInline: "0.2rem",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {p.name}
      </h3>

      {/* Preço */}
      <div style={{ fontSize: "0.92rem", color: "#222", marginTop: "auto" }}>
        {isOutOfStock && badge === "FORA DE ESTOQUE" ? (
          <div>
            <span style={{ color: "#777", marginRight: "0.3rem" }}>{formatBRL(p.price_cents)}</span>
          </div>
        ) : p.compare_at_cents && p.compare_at_cents > p.price_cents ? (
          <div>
            <s style={{ color: "#8a8a8a", marginRight: "0.4rem" }}>{formatBRL(p.compare_at_cents)}</s>
            <span style={{ fontWeight: 500, color: "#111" }}>{formatBRL(p.price_cents)}</span>
          </div>
        ) : p.price_cents > 0 ? (
          <span style={{ fontWeight: 400 }}>{formatBRL(p.price_cents)}</span>
        ) : (
          <span style={{ color: "#888" }}>Em breve</span>
        )}
      </div>
    </Link>
  );
}
