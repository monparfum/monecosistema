import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { env } from "@/lib/settings.server";

const STATIC = ["/", "/cursos", "/produtos", "/experiencias", "/corporativo", "/atelier-prive", "/mon-club", "/sobre", "/quiz", "/conteudos", "/noticias", "/blog"];
const BASE = { noticia: "/noticias", blog: "/blog" } as const;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Mapa do site para buscadores: páginas fixas, cursos, publicações e categorias (só o que está publicado)
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const site = (env("SITE_URL") || new URL(request.url).origin).replace(/\/$/, "");
        const now = new Date().toISOString();
        const [posts, cats, products] = await Promise.all([
          supabase.from("posts").select("kind, slug, updated_at").eq("status", "publicado").lte("published_at", now),
          supabase.from("post_categories").select("kind, slug"),
          supabase.from("products").select("slug, details").eq("active", true),
        ]);
        const urls: { loc: string; lastmod?: string }[] = STATIC.map((p) => ({ loc: p }));
        for (const p of products.data ?? []) {
          const kind = (p.details as { kind?: string } | null)?.kind;
          urls.push({ loc: kind === "curso" ? `/cursos/${p.slug}` : `/produtos/${p.slug}` });
        }
        for (const c of cats.data ?? []) urls.push({ loc: `${BASE[c.kind as keyof typeof BASE]}/categoria/${c.slug}` });
        for (const p of posts.data ?? []) urls.push({ loc: `${BASE[p.kind as keyof typeof BASE]}/${p.slug}`, lastmod: p.updated_at });
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${esc(site + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`)
          .join("\n")}\n</urlset>\n`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
