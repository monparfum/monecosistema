import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { searchPlaces } from "@/lib/google-places.server";
import { extract, fetchPage } from "@/lib/site-scan.server";
import type { Json } from "@/integrations/supabase/types";

async function assertAdmin(supabase: Pick<typeof supabaseAdmin, "rpc">, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Apenas administradores");
}

const clip = (s: string | null | undefined, n: number) => (s ? s.trim().slice(0, n) || null : null);

// ---------- 1. Buscar empresas (Google Maps) ----------

export const searchCompanies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { segment: string; city: string; pageToken?: string }) => {
    const segment = String(d.segment ?? "").trim().slice(0, 100);
    const city = String(d.city ?? "").trim().slice(0, 80);
    if (segment.length < 2 || city.length < 2) throw new Error("Informe o segmento e a cidade");
    return { segment, city, pageToken: d.pageToken ? String(d.pageToken).slice(0, 2000) : undefined };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const search = `${data.segment} em ${data.city}`;
    const { places, nextPageToken } = await searchPlaces(search, data.pageToken);
    if (places.length) {
      // Já existentes mantêm status/notas (descartados não voltam como novos)
      const { error } = await supabaseAdmin.from("prospects").upsert(places.map((p) => ({
        source: "google", external_id: `google:${p.placeId}`, name: clip(p.name, 200)!, category: clip(p.category, 200),
        address: clip(p.address, 300), city: clip(p.city, 80), state: clip(p.state, 40), phone: clip(p.phone, 40),
        website: clip(p.website, 300), rating: p.rating, reviews: p.reviews, search: search.slice(0, 200),
        extra: { maps_url: p.mapsUrl } as Json, created_by: context.userId,
      })), { onConflict: "external_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    return { found: places.length, ids: places.map((p) => `google:${p.placeId}`), nextPageToken };
  });

// ---------- 2. Consultar CNPJ (Receita Federal via BrasilAPI, sem chave) ----------

type BrasilApiCnpj = {
  cnpj: string; razao_social: string; nome_fantasia: string | null; cnae_fiscal_descricao: string | null; porte: string | null;
  descricao_situacao_cadastral: string | null; municipio: string | null; uf: string | null; logradouro: string | null; numero: string | null;
  bairro: string | null; cep: string | null; ddd_telefone_1: string | null; email: string | null; data_inicio_atividade: string | null;
  capital_social: number | null; qsa?: { nome_socio: string; qualificacao_socio: string }[];
};

const fmtPhone = (d: string | null) => {
  const x = (d ?? "").replace(/\D/g, "");
  return x.length >= 10 ? `(${x.slice(0, 2)}) ${x.slice(2, -4)}-${x.slice(-4)}` : null;
};
const titleCase = (s: string | null) => s?.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) ?? null;

export const lookupCnpjs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { cnpjs: string[] }) => {
    const cnpjs = [...new Set((d.cnpjs ?? []).map((c) => String(c).replace(/\D/g, "")).filter((c) => c.length === 14))];
    if (!cnpjs.length) throw new Error("Nenhum CNPJ válido (14 dígitos)");
    if (cnpjs.length > 20) throw new Error("Máximo de 20 CNPJs por vez");
    return { cnpjs };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const ok: string[] = [];
    const errors: string[] = [];
    for (const cnpj of data.cnpjs) {
      try {
        // Sem User-Agent a BrasilAPI responde 403
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
          headers: { "User-Agent": "MonParfumCRM/1.0 (contato@monparfum.com.br)", Accept: "application/json" },
          signal: AbortSignal.timeout(15_000),
        });
        if (res.status === 404) { errors.push(`${cnpj}: não encontrado na Receita`); continue; }
        if (!res.ok) { errors.push(`${cnpj}: consulta falhou (${res.status})`); continue; }
        const r = (await res.json()) as BrasilApiCnpj;
        const row = {
          source: "cnpj", cnpj, external_id: `cnpj:${cnpj}`,
          name: clip(titleCase(r.nome_fantasia || r.razao_social), 200)!,
          legal_name: clip(r.razao_social, 200), category: clip(r.cnae_fiscal_descricao, 200), size: clip(r.porte, 60),
          address: clip([r.logradouro, r.numero, r.bairro, r.cep].filter(Boolean).join(", "), 300),
          city: clip(titleCase(r.municipio), 80), state: clip(r.uf, 40),
          phone: fmtPhone(r.ddd_telefone_1), email: clip(r.email?.toLowerCase(), 200),
          extra: {
            situacao: r.descricao_situacao_cadastral, abertura: r.data_inicio_atividade, capital_social: r.capital_social,
            // Quadro societário é público na Receita: só nome e qualificação (sem CPF)
            socios: (r.qsa ?? []).slice(0, 10).map((s) => ({ nome: titleCase(s.nome_socio), cargo: s.qualificacao_socio })),
          } as Json,
          created_by: context.userId,
        };
        const { data: existing } = await supabaseAdmin.from("prospects").select("id, extra").eq("cnpj", cnpj).maybeSingle();
        const { error } = existing
          ? await supabaseAdmin.from("prospects").update({ ...row, source: undefined, external_id: undefined, created_by: undefined,
              extra: { ...(existing.extra as object), ...(row.extra as object) } as Json }).eq("id", existing.id)
          : await supabaseAdmin.from("prospects").insert(row);
        if (error) errors.push(`${cnpj}: ${error.message}`);
        else ok.push(`cnpj:${cnpj}`);
      } catch (e) {
        errors.push(`${cnpj}: ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 400)); // gentileza com a API pública
    }
    return { ids: ok, errors };
  });

// ---------- 3. Buscar contatos no site da empresa ----------

export const scanWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.id)) throw new Error("id inválido");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: p } = await supabaseAdmin.from("prospects").select("id, website, email, phone, extra").eq("id", data.id).maybeSingle();
    if (!p) throw new Error("Prospect não encontrado");
    if (!p.website) throw new Error("Empresa sem site cadastrado");
    const start = /^https?:\/\//i.test(p.website) ? p.website : `https://${p.website}`;

    const first = await fetchPage(start).catch((e: Error) => { throw new Error(`Não consegui abrir o site: ${e.message}`); });
    if (!first) throw new Error("O site não respondeu com uma página");
    const found = extract(first.html);
    // Visita até 2 páginas de contato do mesmo domínio
    const extraPages = [...new Set(found.contactLinks.map((h) => { try { return new URL(h, first.url).toString(); } catch { return null; } }))]
      .filter((u): u is string => !!u && new URL(u).hostname === first.url.hostname && u !== first.url.toString()).slice(0, 2);
    for (const u of extraPages) {
      const page = await fetchPage(u).catch(() => null);
      if (page) {
        const f = extract(page.html);
        found.emails.push(...f.emails); found.phones.push(...f.phones); found.social.push(...f.social);
      }
    }
    const host = first.url.hostname.replace(/^www\./, "");
    const emails = [...new Set(found.emails)].sort((a, b) => Number(b.endsWith(host)) - Number(a.endsWith(host))).slice(0, 10);
    const phones = [...new Set(found.phones)].slice(0, 6);
    const social = [...new Set(found.social)].slice(0, 6);

    const { error } = await supabaseAdmin.from("prospects").update({
      email: p.email ?? emails[0] ?? null,
      phone: p.phone ?? (phones[0] ? phones[0] : null),
      extra: { ...(p.extra as object), site: { emails, phones, social, verificado_em: new Date().toISOString() } } as Json,
    }).eq("id", p.id);
    if (error) throw new Error(error.message);
    return { emails, phones, social };
  });
