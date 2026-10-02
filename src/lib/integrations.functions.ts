import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { INTEGRATIONS, MANAGED_KEYS, SECRET_KEYS } from "@/lib/integrations-catalog";
import { ensureSettings, env, invalidateSettings, settingSource } from "@/lib/settings.server";

async function assertAdmin(supabase: Pick<typeof supabaseAdmin, "rpc">, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Apenas administradores");
}

// Valor nunca sai do servidor: segredo vira "final …abcd"; campo comum mostra o valor (não é sensível)
const hint = (key: string) => {
  const v = env(key);
  if (!v) return null;
  return SECRET_KEYS.has(key) ? `…${v.slice(-4)}` : v;
};

export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    await ensureSettings(true);
    const keys = Object.fromEntries([...MANAGED_KEYS].map((k) => [k, { set: !!env(k), source: settingSource(k), hint: hint(k) }]));
    const has = (...names: string[]) => names.every((k) => !!process.env[k]);
    return {
      keys,
      // Fora do painel (o site precisa delas para ligar)
      supabase: has("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
      members: has("MEMBERS_AREA_API_URL", "MEMBERS_AREA_TOKEN"),
    };
  });

// values: chave → novo valor; "" ou null remove. Campos secretos vazios no formulário não são enviados (mantém o atual).
export const saveIntegrationKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { values: Record<string, string | null> }) => {
    const entries = Object.entries(d.values ?? {});
    if (!entries.length || entries.length > 20) throw new Error("Nada para salvar");
    for (const [k, v] of entries) {
      if (!MANAGED_KEYS.has(k)) throw new Error(`Chave não permitida: ${k}`);
      if (v !== null && (typeof v !== "string" || v.length > 4000)) throw new Error(`Valor inválido em ${k}`);
    }
    return { values: Object.fromEntries(entries.map(([k, v]) => [k, v?.trim() ? v.trim() : null])) as Record<string, string | null> };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const now = new Date().toISOString();
    const upserts = Object.entries(data.values).filter(([, v]) => v).map(([key, value]) => ({ key, value: value!, updated_at: now, updated_by: context.userId }));
    const removes = Object.entries(data.values).filter(([, v]) => !v).map(([k]) => k);
    if (upserts.length) {
      const { error } = await supabaseAdmin.from("integration_settings").upsert(upserts);
      if (error) throw new Error(error.message);
    }
    if (removes.length) {
      const { error } = await supabaseAdmin.from("integration_settings").delete().in("key", removes);
      if (error) throw new Error(error.message);
    }
    invalidateSettings();
    await supabaseAdmin.rpc("log_module_event", {
      _event_type: "integration.updated", _actor: context.userId, _subject_type: "integration", _subject_id: null as unknown as string,
      _payload: { chaves: Object.keys(data.values) }, // só os nomes, nunca valores
    });
    return { ok: true };
  });

// Teste real de conexão com cada serviço (chamada leve, sem efeito colateral)
export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!INTEGRATIONS.some((i) => i.id === d.id && i.testable)) throw new Error("Integração inválida");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ ok: boolean; message: string }> => {
    await assertAdmin(context.supabase, context.userId);
    await ensureSettings(true);
    const get = async (url: string, headers: Record<string, string>) => {
      const res = await fetch(url, { headers });
      const body = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, body: body as Record<string, any> };
    };
    try {
      switch (data.id) {
        case "mercadopago": {
          const token = env("MERCADOPAGO_ACCESS_TOKEN");
          if (!token) return { ok: false, message: "Access Token não configurado" };
          const r = await get("https://api.mercadopago.com/users/me", { Authorization: `Bearer ${token}` });
          if (!r.ok) return { ok: false, message: `Mercado Pago recusou o token (${r.status}${r.body?.message ? `: ${r.body.message}` : ""})` };
          return { ok: true, message: `Conectado à conta ${r.body.nickname ?? r.body.email ?? r.body.id} · ${token.startsWith("TEST-") ? "modo teste" : "produção"}` };
        }
        case "melhorenvio": {
          const token = env("MELHOR_ENVIO_TOKEN");
          if (!token) return { ok: false, message: "Token não configurado" };
          const prod = env("MELHOR_ENVIO_ENV") === "production";
          const base = prod ? "https://melhorenvio.com.br" : "https://sandbox.melhorenvio.com.br";
          const ua = `Mon Parfum (${env("MELHOR_ENVIO_EMAIL") || "contato@monparfum.com.br"})`;
          const r = await get(`${base}/api/v2/me`, { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": ua });
          if (!r.ok) return { ok: false, message: `Melhor Envio recusou o token (${r.status}). Confira se o token é do ambiente ${prod ? "de produção" : "sandbox"}.` };
          const bal = await get(`${base}/api/v2/me/balance`, { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": ua });
          const saldo = bal.ok && bal.body?.balance !== undefined ? ` · saldo R$ ${Number(bal.body.balance).toFixed(2).replace(".", ",")}` : "";
          return { ok: true, message: `Conectado como ${r.body.firstname ?? ""} ${r.body.lastname ?? ""}`.trim() + ` · ${prod ? "produção" : "sandbox"}${saldo}` };
        }
        case "resend": {
          const key = env("RESEND_API_KEY");
          if (!key) return { ok: false, message: "API Key não configurada" };
          const r = await get("https://api.resend.com/domains", { Authorization: `Bearer ${key}` });
          if (!r.ok) return { ok: false, message: `Resend recusou a chave (${r.status}${r.body?.message ? `: ${r.body.message}` : ""})` };
          const domains: { name: string; status: string }[] = r.body?.data ?? [];
          const from = env("EMAIL_FROM");
          const fromDomain = from.match(/@([^>\s]+)/)?.[1]?.toLowerCase();
          const d = domains.find((x) => x.name.toLowerCase() === fromDomain);
          if (!domains.length) return { ok: false, message: "Chave válida, mas nenhum domínio cadastrado no Resend (Domains › Add domain)" };
          if (fromDomain && (!d || d.status !== "verified")) return { ok: false, message: `Chave válida, mas o domínio do remetente (${fromDomain}) não está verificado no Resend` };
          return { ok: true, message: `Chave válida · domínios: ${domains.map((x) => `${x.name} (${x.status === "verified" ? "verificado" : x.status})`).join(", ")}` };
        }
        case "stripe": {
          const pk = env("STRIPE_PUBLISHABLE_KEY") || env("VITE_PAYMENTS_CLIENT_TOKEN");
          if (!pk) return { ok: false, message: "Chave publicável não configurada" };
          const live = pk.startsWith("pk_live_");
          const sk = env(live ? "STRIPE_LIVE_API_KEY" : "STRIPE_SANDBOX_API_KEY");
          if (!sk) return { ok: false, message: `Chave secreta ${live ? "de produção" : "de teste"} não configurada (a publicável é ${live ? "pk_live" : "pk_test"})` };
          const r = await get("https://api.stripe.com/v1/balance", { Authorization: `Bearer ${sk}` });
          if (!r.ok) return { ok: false, message: `Stripe recusou a chave secreta (${r.status}${r.body?.error?.message ? `: ${r.body.error.message}` : ""})` };
          return { ok: true, message: `Conectado · ${live ? "produção" : "modo teste"}` };
        }
      }
      return { ok: false, message: "Integração sem teste" };
    } catch (e) {
      return { ok: false, message: `Falha de rede: ${(e as Error).message}` };
    }
  });
