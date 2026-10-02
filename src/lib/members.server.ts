// Integração com a área de membros (projeto isanetflix, plataforma "MON Parfum" em Plataformas de venda).
// Env: MEMBERS_AREA_API_URL (https://<projeto>.supabase.co/functions/v1), MEMBERS_AREA_TOKEN (token gerado lá).
// - Venda: POST {API}/sales-webhook/monparfum, corpo assinado (X-Mon-Signature = HMAC-SHA256 hex). Lá a conta é
//   criada, os cursos do produto são liberados e o e-mail de acesso (criar senha) é enviado.
// - Catálogo: GET/POST {API}/monparfum-catalog com Bearer token (lista cursos / cadastra produto com cursos).

const api = () => process.env.MEMBERS_AREA_API_URL?.replace(/\/$/, "");
const token = () => process.env.MEMBERS_AREA_TOKEN;
export const membersEnabled = () => !!api() && !!token();

export type MemberCourse = { id: string; name: string; status: string };

async function catalog<T>(init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  if (!membersEnabled()) throw new Error("Área de membros não configurada (MEMBERS_AREA_API_URL / MEMBERS_AREA_TOKEN)");
  const res = await fetch(`${api()}/monparfum-catalog`, {
    method: init.method,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Área de membros: ${json?.error ?? res.status}`);
  return json as T;
}

export const listCourses = () => catalog<{ courses: MemberCourse[] }>({ method: "GET" }).then((r) => r.courses);

export const syncProduct = (p: { id: string; name: string; active: boolean; courseIds: string[] }) =>
  catalog({ method: "POST", body: { product_id: p.id, name: p.name, active: p.active, course_ids: p.courseIds } });

export type OrderNotice = {
  event: "order.paid" | "order.cancelled";
  order: { id: string; number: string; amount_cents: number; payment_method: string | null; paid_at: string };
  customer: { email: string; name: string; phone: string | null };
  products: { id: string; name: string }[];
};

// Nunca lança: falha fica no log (e a área de membros também registra o que recebeu)
export async function notifyOrder(notice: OrderNotice) {
  if (!membersEnabled()) {
    console.log(`[membros] não configurado — ${notice.event} do pedido ${notice.order.number} não enviado`);
    return false;
  }
  const body = JSON.stringify(notice);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(token()!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Buffer.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)))).toString("hex");
  try {
    const res = await fetch(`${api()}/sales-webhook/monparfum`, { method: "POST", headers: { "Content-Type": "application/json", "X-Mon-Signature": sig }, body });
    if (!res.ok) console.error("[membros] webhook falhou", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[membros] webhook erro", e);
    return false;
  }
}
