// Integrações configuráveis pelo painel (Administração › Integrações). Arquivo sem segredos: só nomes e textos.
export type IntegrationField = {
  key: string; label: string; secret: boolean; placeholder?: string; help?: string;
  options?: [value: string, label: string][];
};
export type Integration = {
  id: "mercadopago" | "melhorenvio" | "resend" | "stripe" | "site";
  group: string; name: string; description: string; docs: string; docsLabel: string;
  required: string[]; // chaves mínimas para "Conectado"
  fields: IntegrationField[];
  testable: boolean;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "mercadopago", group: "Pagamentos", name: "Mercado Pago", testable: true,
    description: "Pix, boleto e cartão em até 12x (Checkout Pro). Pagamentos aprovados liberam o pedido sozinhos.",
    docs: "https://www.mercadopago.com.br/developers/panel/app", docsLabel: "Suas integrações › aplicação › Credenciais",
    required: ["MERCADOPAGO_ACCESS_TOKEN"],
    fields: [
      { key: "MERCADOPAGO_ACCESS_TOKEN", label: "Access Token", secret: true, placeholder: "TEST-… (teste) ou APP_USR-… (produção)" },
      { key: "MERCADOPAGO_WEBHOOK_SECRET", label: "Assinatura secreta do webhook", secret: true, help: "Em Webhooks, com a URL https://SEU_DOMINIO/api/public/payments/mercadopago e o evento “Pagamentos”. Opcional, recomendado em produção." },
    ],
  },
  {
    id: "stripe", group: "Pagamentos", name: "Stripe (cartão)", testable: true,
    description: "Opcional: cartão de crédito pelo checkout embutido do Stripe. O modo (teste/produção) segue a chave pública.",
    docs: "https://dashboard.stripe.com/apikeys", docsLabel: "Desenvolvedores › Chaves de API",
    required: ["STRIPE_PUBLISHABLE_KEY"],
    fields: [
      { key: "STRIPE_PUBLISHABLE_KEY", label: "Chave publicável", secret: false, placeholder: "pk_test_… ou pk_live_…" },
      { key: "STRIPE_SANDBOX_API_KEY", label: "Chave secreta (teste)", secret: true, placeholder: "sk_test_…" },
      { key: "PAYMENTS_SANDBOX_WEBHOOK_SECRET", label: "Webhook secret (teste)", secret: true, placeholder: "whsec_…", help: "Webhook: https://SEU_DOMINIO/api/public/payments/webhook?env=sandbox" },
      { key: "STRIPE_LIVE_API_KEY", label: "Chave secreta (produção)", secret: true, placeholder: "sk_live_…" },
      { key: "PAYMENTS_LIVE_WEBHOOK_SECRET", label: "Webhook secret (produção)", secret: true, placeholder: "whsec_…", help: "Webhook: https://SEU_DOMINIO/api/public/payments/webhook?env=live" },
    ],
  },
  {
    id: "melhorenvio", group: "Transportadoras", name: "Melhor Envio", testable: true,
    description: "Cotação de frete no checkout, compra de etiqueta e rastreio. Sem ele, o frete é fixo (R$ 25, grátis acima de R$ 350). Etiquetas são pagas com o saldo da carteira Melhor Envio.",
    docs: "https://melhorenvio.com.br/painel/gerenciar/tokens", docsLabel: "Integrações › Permissões de acesso › Gerar token",
    required: ["MELHOR_ENVIO_TOKEN"],
    fields: [
      { key: "MELHOR_ENVIO_TOKEN", label: "Token", secret: true, help: "Gere com todas as permissões. Token de teste: sandbox.melhorenvio.com.br" },
      { key: "MELHOR_ENVIO_ENV", label: "Ambiente", secret: false, options: [["sandbox", "Teste (sandbox)"], ["production", "Produção"]] },
      { key: "MELHOR_ENVIO_EMAIL", label: "E-mail de contato técnico", secret: false, placeholder: "voce@monparfum.com.br" },
    ],
  },
  {
    id: "resend", group: "Mensageria", name: "E-mail transacional (Resend)", testable: true,
    description: "Confirmação de pagamento, aviso de envio com rastreio e cancelamento. O domínio do remetente precisa estar verificado no Resend.",
    docs: "https://resend.com/api-keys", docsLabel: "API Keys (e Domains para verificar o domínio)",
    required: ["RESEND_API_KEY"],
    fields: [
      { key: "RESEND_API_KEY", label: "API Key", secret: true, placeholder: "re_…" },
      { key: "EMAIL_FROM", label: "Remetente", secret: false, placeholder: "MON PARFUM <contato@monparfum.com.br>" },
    ],
  },
  {
    id: "site", group: "Site", name: "Endereço do site", testable: false,
    description: "Endereço público usado no logo dos e-mails e em links enviados aos clientes.",
    docs: "", docsLabel: "",
    required: ["SITE_URL"],
    fields: [{ key: "SITE_URL", label: "Endereço (URL)", secret: false, placeholder: "https://monparfum.com.br" }],
  },
];

export const MANAGED_KEYS = new Set(INTEGRATIONS.flatMap((i) => i.fields.map((f) => f.key)));
export const SECRET_KEYS = new Set(INTEGRATIONS.flatMap((i) => i.fields.filter((f) => f.secret).map((f) => f.key)));
