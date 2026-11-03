import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { plainText } from "@/lib/post-body";

export type PostKind = "noticia" | "blog";
export const KINDS: Record<PostKind, { label: string; plural: string; base: "/noticias" | "/blog"; schema: string; intro: string }> = {
  noticia: { label: "Notícia", plural: "Notícias", base: "/noticias", schema: "NewsArticle", intro: "O que está acontecendo na MON PARFUM: turmas, eventos, parcerias e imprensa." },
  blog: { label: "Blog", plural: "Blog", base: "/blog", schema: "BlogPosting", intro: "Matérias-primas, técnica e carreira: perfumaria explicada por quem cria." },
};

export type PostCategory = { id: string; kind: PostKind; slug: string; name: string; description: string | null };
export type Post = {
  id: string; kind: PostKind; slug: string; title: string; excerpt: string | null; content: string;
  cover_url: string | null; cover_alt: string | null; category_id: string | null; tags: string[]; author: string | null;
  status: "rascunho" | "publicado"; published_at: string | null; updated_at: string;
  seo_title: string | null; seo_description: string | null;
  category: { slug: string; name: string } | null;
  gallery: GalleryItem[];
};
export type GalleryItem = { url: string; alt: string };

const COLS = "id, kind, slug, title, excerpt, content, cover_url, cover_alt, category_id, tags, author, status, published_at, updated_at, seo_title, seo_description, gallery, category:post_categories(slug, name)";

// Só o que está publicado e com data já alcançada (a equipe logada também veria rascunhos sem este filtro)
const published = () => supabase.from("posts").select(COLS).eq("status", "publicado").lte("published_at", new Date().toISOString());

export const postsQuery = (kind: PostKind, opts: { categoria?: string; limit?: number } = {}) =>
  queryOptions({
    queryKey: ["posts", kind, opts.categoria ?? "", opts.limit ?? 0],
    staleTime: 60_000,
    queryFn: async (): Promise<Post[]> => {
      let q = published().eq("kind", kind).order("published_at", { ascending: false });
      if (opts.categoria) {
        const { data: cat } = await supabase.from("post_categories").select("id").eq("kind", kind).eq("slug", opts.categoria).maybeSingle();
        if (!cat) return [];
        q = q.eq("category_id", cat.id);
      }
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
  });

export const postQuery = (kind: PostKind, slug: string) =>
  queryOptions({
    queryKey: ["post", kind, slug],
    staleTime: 60_000,
    queryFn: async (): Promise<Post | null> => {
      const { data, error } = await published().eq("kind", kind).eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data as unknown as Post | null;
    },
  });

export const categoriesQuery = (kind: PostKind) =>
  queryOptions({
    queryKey: ["post-categories", kind],
    staleTime: 60_000,
    queryFn: async (): Promise<PostCategory[]> => {
      const { data, error } = await supabase.from("post_categories").select("id, kind, slug, name, description").eq("kind", kind).order("name");
      if (error) throw error;
      return (data ?? []) as PostCategory[];
    },
  });

// Endereço público do site (canonical, Open Graph, sitemap). Vem do SITE_URL do servidor.
export const getSiteUrl = createServerFn({ method: "GET" }).handler(async () => {
  const { env } = await import("@/lib/settings.server");
  const { getRequest } = await import("@tanstack/react-start/server");
  return (env("SITE_URL") || new URL(getRequest().url).origin).replace(/\/$/, "");
});

export const postDescription = (p: Post) => p.seo_description || p.excerpt || plainText(p.content).slice(0, 160);

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }) : "";

const abs = (site: string, path: string | null) => (!path ? undefined : /^https?:\/\//.test(path) ? path : `${site}${path}`);

// <head> de listagem (Notícias, Blog, categoria)
export function listHead(site: string, kind: PostKind, cat?: PostCategory | null) {
  const k = KINDS[kind];
  const title = cat ? `${cat.name} — ${k.plural} | MON PARFUM` : `${k.plural} | MON PARFUM`;
  const description = cat?.description || k.intro;
  const url = `${site}${k.base}${cat ? `/categoria/${cat.slug}` : ""}`;
  return {
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:url", content: url }, { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

// <head> do artigo: título/descrição SEO, canonical, Open Graph de artigo e dados estruturados (JSON-LD)
export function postHead(site: string, p: Post) {
  const k = KINDS[p.kind];
  const title = `${p.seo_title || p.title}${p.seo_title ? "" : ` | ${k.plural} MON PARFUM`}`;
  const description = postDescription(p);
  const url = `${site}${k.base}/${p.slug}`;
  const image = abs(site, p.cover_url);
  const images = [image, ...(p.gallery ?? []).map((g) => abs(site, g.url))].filter(Boolean);
  const ld = [
    {
      "@context": "https://schema.org", "@type": k.schema, headline: p.title, description, url,
      mainEntityOfPage: url, image: images.length ? images : undefined, datePublished: p.published_at, dateModified: p.updated_at,
      articleSection: p.category?.name, keywords: p.tags.filter((t) => t !== "exemplo").join(", ") || undefined,
      author: { "@type": p.author && p.author !== "Equipe MON" ? "Person" : "Organization", name: p.author || "MON PARFUM" },
      publisher: { "@type": "Organization", name: "MON PARFUM", logo: { "@type": "ImageObject", url: `${site}/logo-mon.png` } },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${site}/` },
        { "@type": "ListItem", position: 2, name: k.plural, item: `${site}${k.base}` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];
  return {
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:type", content: "article" }, { property: "og:title", content: p.seo_title || p.title },
      { property: "og:description", content: description }, { property: "og:url", content: url },
      ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      ...(p.published_at ? [{ property: "article:published_time", content: p.published_at }] : []),
      { property: "article:modified_time", content: p.updated_at },
      ...(p.category ? [{ property: "article:section", content: p.category.name }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ld).replace(/</g, "\\u003c") }],
  };
}
