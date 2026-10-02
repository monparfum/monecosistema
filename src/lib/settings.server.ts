// Chaves de integração: o que foi salvo no painel (tabela integration_settings) vale primeiro;
// variável de ambiente do servidor é a reserva. Cache curto para não consultar o banco a cada requisição.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TTL_MS = 30_000;
let cache = new Map<string, string>();
let loadedAt = 0;
let inflight: Promise<void> | null = null;

export async function ensureSettings(force = false) {
  if (!force && Date.now() - loadedAt < TTL_MS) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabaseAdmin.from("integration_settings").select("key, value");
      if (error) throw error;
      cache = new Map((data ?? []).map((r) => [r.key, r.value]));
      loadedAt = Date.now();
    } catch (e) {
      // Tabela ainda não criada ou banco fora: segue com as variáveis de ambiente
      console.error("[settings] não foi possível ler integration_settings:", (e as Error).message);
      loadedAt = Date.now() - TTL_MS + 5_000;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export const invalidateSettings = () => { loadedAt = 0; };

// Valor atual da chave (painel → ambiente). Requer ensureSettings() antes (feito no middleware do servidor).
export const env = (name: string): string => cache.get(name) || process.env[name] || "";

export const settingSource = (name: string): "painel" | "servidor" | null =>
  cache.get(name) ? "painel" : process.env[name] ? "servidor" : null;
