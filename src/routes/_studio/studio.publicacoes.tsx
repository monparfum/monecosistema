import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, KINDS, type PostKind } from "@/lib/posts";

export const Route = createFileRoute("/_studio/studio/publicacoes")({ component: PublicacoesRoute });

function PublicacoesRoute() {
  const location = useLocation();
  if (location.pathname !== "/studio/publicacoes") return <Outlet />;
  return <PostsAdminList />;
}

function PostsAdminList() {
  const [kind, setKind] = useState<PostKind>("noticia");
  const [q, setQ] = useState("");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["studio-posts", kind],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts")
        .select("id, slug, title, status, published_at, updated_at, tags, category:post_categories(name)")
        .eq("kind", kind).order("published_at", { ascending: false, nullsFirst: true });
      if (error) throw error;
      return data as unknown as { id: string; slug: string; title: string; status: string; published_at: string | null; updated_at: string; tags: string[]; category: { name: string } | null }[];
    },
  });
  const rows = data.filter((p) => !q || p.title.toLowerCase().includes(q.toLowerCase()));
  const now = Date.now();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="eyebrow mb-3">Studio</div>
          <h1 className="font-display text-5xl">Notícias e Blog</h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">Notícias contam o que acontece na MON (turmas, eventos, imprensa). O Blog ensina e atrai visitas pelo Google. No site, Notícias aparecem primeiro e o Blog depois.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/studio/categorias" className="text-xs px-3 py-2 border border-border">Categorias</Link>
          <Link to="/studio/publicacoes/$id" params={{ id: kind === "noticia" ? "nova-noticia" : "novo-blog" }} className="text-xs px-3 py-2 bg-foreground text-background">
            + {kind === "noticia" ? "Nova notícia" : "Novo post do blog"}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border">
        {(["noticia", "blog"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`py-3 text-sm border-b-2 -mb-px ${kind === k ? "border-foreground" : "border-transparent text-muted-foreground"}`}>{KINDS[k].plural}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo título" className="ml-auto border border-border bg-background px-3 py-1.5 text-sm mb-2" aria-label="Buscar publicação" />
      </div>

      {error && <p className="text-sm text-destructive">Não foi possível carregar: {(error as Error).message}. A tabela de publicações já foi criada no banco?</p>}
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : !rows.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left eyebrow text-muted-foreground border-b border-border">
            <th className="py-2 font-normal">Título</th><th className="font-normal">Categoria</th><th className="font-normal">Situação</th><th className="font-normal">Data</th><th />
          </tr></thead>
          <tbody>
            {rows.map((p) => {
              const scheduled = p.status === "publicado" && p.published_at && new Date(p.published_at).getTime() > now;
              return (
                <tr key={p.id} className="border-b border-border">
                  <td className="py-3 pr-4">
                    <Link to="/studio/publicacoes/$id" params={{ id: p.id }} className="hover:underline">{p.title}</Link>
                    {p.tags.includes("exemplo") && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5">exemplo</span>}
                  </td>
                  <td className="pr-4 text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="pr-4">{scheduled ? "Agendado" : p.status === "publicado" ? "Publicado" : "Rascunho"}</td>
                  <td className="pr-4 text-muted-foreground">{formatDate(p.published_at) || "—"}</td>
                  <td className="text-right whitespace-nowrap">
                    <Link to="/studio/publicacoes/$id" params={{ id: p.id }} className="text-xs editorial-link">Editar</Link>
                    {p.status === "publicado" && !scheduled && <a href={`${KINDS[kind].base}/${p.slug}`} target="_blank" rel="noreferrer" className="text-xs editorial-link ml-4">Ver →</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
