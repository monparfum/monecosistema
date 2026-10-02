import { env } from "@/lib/settings.server";
// Email transacional via Resend (https://resend.com). Só a RESEND_API_KEY é obrigatória;
// EMAIL_FROM precisa ser de um domínio verificado no Resend. Sem chave, apenas registra no log.
const DEFAULT_FROM = "MON PARFUM <contato@monparfum.com.br>";

export async function sendEmail(to: string, subject: string, html: string) {
  const key = env("RESEND_API_KEY");
  if (!key) {
    console.log(`[email] RESEND_API_KEY ausente — pulando "${subject}" para ${to}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env("EMAIL_FROM") || DEFAULT_FROM, to, subject, html: layout(subject, html) }),
    });
    if (!res.ok) console.error("[email] falha", res.status, await res.text());
  } catch (e) {
    console.error("[email] erro", e);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Moldura com a identidade da MON (tabelas e estilos inline: compatível com Gmail/Outlook)
function layout(title: string, body: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#FAFAF8;font-family:Georgia,'Times New Roman',serif;color:#1A1A1A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E5E0D8">
<tr><td style="padding:24px 32px;border-bottom:1px solid #E5E0D8">${env("SITE_URL")
    ? `<img src="${esc(env("SITE_URL").replace(/\/$/, ""))}/logo-mon.png" alt="MON Parfum" height="48" style="height:48px;width:auto;display:block;border:0">`
    : `<span style="font-size:18px;letter-spacing:6px;text-transform:uppercase">MON PARFUM</span>`}</td></tr>
<tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#4A4A4A">${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E5E0D8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8A8A8A">
MON PARFUM Experiência Olfativa · CNPJ 43.958.026/0001-50<br>Shopping Trindade — Rua Lauro Linhares, 2123, sala 603, Torre B — Florianópolis/SC<br>WhatsApp (48) 98486-5885</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:28px 0"><a href="${esc(href)}" style="background:#1A1A1A;color:#FAFAF8;text-decoration:none;padding:14px 26px;font-size:13px;letter-spacing:2px;text-transform:uppercase;display:inline-block">${esc(label)}</a></p>`;

export const emails = {
  paid: (orderNumber: string, total: string) => ({
    subject: `Pedido ${orderNumber} confirmado — MON PARFUM`,
    html: `<p style="font-size:22px;font-family:Georgia,serif;color:#1A1A1A;margin:0 0 16px">Merci. Seu pagamento foi confirmado.</p>
<p>Pedido <strong>${esc(orderNumber)}</strong> · ${esc(total)}</p>
<p>Itens físicos: avisamos quando forem enviados, com o código de rastreio.<br>Cursos e conteúdos digitais: o acesso chega em outro e-mail, da área de membros.</p>`,
  }),
  shipped: (orderNumber: string, trackingCode: string) => ({
    subject: `Pedido ${orderNumber} enviado — MON PARFUM`,
    html: `<p style="font-size:22px;font-family:Georgia,serif;color:#1A1A1A;margin:0 0 16px">Seu pedido está a caminho.</p>
<p>Pedido <strong>${esc(orderNumber)}</strong><br>Código de rastreio: <strong>${esc(trackingCode)}</strong></p>
${button(`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(trackingCode)}`, "Acompanhar entrega")}`,
  }),
  cancelled: (orderNumber: string) => ({
    subject: `Pedido ${orderNumber} cancelado — MON PARFUM`,
    html: `<p>Seu pedido <strong>${esc(orderNumber)}</strong> foi cancelado.</p><p>Se houve pagamento, o estorno já foi solicitado e aparece na sua fatura ou conta em alguns dias.</p>`,
  }),
};
