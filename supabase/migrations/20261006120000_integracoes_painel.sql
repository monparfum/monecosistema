-- Chaves de integração (Mercado Pago, Melhor Envio, Resend, Stripe) configuradas pelo painel.
-- RLS ligado e NENHUMA policy + REVOKE: navegador nunca lê nem grava, nem logado como admin.
-- Só o servidor (service role) acessa, por funções que exigem papel admin e nunca devolvem o valor.
CREATE TABLE IF NOT EXISTS public.integration_settings (
  key text PRIMARY KEY CHECK (key ~ '^[A-Z][A-Z0-9_]{2,60}$'),
  value text NOT NULL CHECK (char_length(value) BETWEEN 1 AND 4000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_settings FROM anon, authenticated;
GRANT ALL ON public.integration_settings TO service_role;
