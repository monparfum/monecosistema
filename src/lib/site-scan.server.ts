// Leitura de sites públicos para achar contatos (e-mail, telefone, redes). Só servidor.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const PRIVATE = [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^::1$/, /^f[cd]/i, /^fe80/i, /^::ffff:(127|10|192\.168|169\.254)\./i];

// Só endereços públicos: evita usar o servidor para acessar a rede interna (SSRF)
async function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Endereço inválido");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Porta não permitida");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Endereço não permitido");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => PRIVATE.some((re) => re.test(a.address)))) throw new Error("Endereço não permitido");
  return url;
}

export async function fetchPage(raw: string): Promise<{ url: URL; html: string } | null> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, {
      redirect: "manual", signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MonParfumCRM/1.0)", Accept: "text/html" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString());
      continue;
    }
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html") || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < 1_500_000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return { url, html: new TextDecoder().decode(Buffer.concat(chunks)) };
  }
  return null;
}

const decode = (s: string) => s.replace(/&#64;|&#x40;/gi, "@").replace(/&amp;/g, "&").replace(/\s*(\[at\]|\(at\))\s*/gi, "@");

export function extract(html: string) {
  const text = decode(html);
  const emails = [...text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)].map((m) => m[0].toLowerCase())
    .filter((e) => !/\.(png|jpe?g|gif|webp|svg|css|js)$/.test(e) && !/(sentry|example|wixpress|domain\.com|email\.com|@2x|u00)/.test(e));
  const phones = [
    ...[...text.matchAll(/href=["']tel:([^"']+)/gi)].map((m) => m[1]),
    ...[...text.matchAll(/wa\.me\/(\d{10,13})/gi)].map((m) => m[1]),
    ...[...text.matchAll(/\(\d{2}\)\s?\d{4,5}[-\s]?\d{4}/g)].map((m) => m[0]),
  ].map((p) => p.replace(/[^\d+]/g, "")).filter((p) => p.replace(/\D/g, "").length >= 10);
  const social = [...text.matchAll(/https?:\/\/(?:www\.|br\.)?(linkedin\.com\/(?:company|in)\/[^"'\s?#<>]+|instagram\.com\/[^"'\s?#<>/]+)/gi)]
    .map((m) => `https://${m[1]}`.replace(/\/$/, "")).filter((s) => !/instagram\.com\/(p|reel|explore|accounts)$/i.test(s));
  const contactLinks = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi)]
    .filter((m) => /contat|contact|fale|atendimento|sobre/i.test(m[1] + m[2])).map((m) => m[1]);
  return { emails, phones, social, contactLinks };
}
