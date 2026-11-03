import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/lib/settings.server";

// Áreas internas fora dos buscadores; aponta o mapa do site
const PRIVATE = ["/admin", "/studio", "/crm", "/ops", "/marketing", "/financeiro", "/administracao", "/checkout", "/carrinho", "/login", "/cadastro", "/api/", "/businessplan"];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const site = (env("SITE_URL") || new URL(request.url).origin).replace(/\/$/, "");
        const body = `User-agent: *\nAllow: /\n${PRIVATE.map((p) => `Disallow: ${p}`).join("\n")}\n\nSitemap: ${site}/sitemap.xml\n`;
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
      },
    },
  },
});
