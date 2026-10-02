import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmail, emails } from "@/lib/email.server";
import { env } from "@/lib/settings.server";
import type { Json } from "@/integrations/supabase/types";

export const LEAD_KINDS = ["quiz", "atelier", "corporativo", "contato", "newsletter"] as const;
type LeadKind = (typeof LEAD_KINDS)[number];

const ORIGIN: Record<LeadKind, string> = { quiz: "Quiz", atelier: "Atelier Privé", corporativo: "Corporativo", contato: "Contato", newsletter: "Newsletter" };
const LABEL: Record<string, string> = {
  empresa: "Empresa", cidade: "Cidade", data_prevista: "Data prevista", participantes: "Participantes",
  tipo_evento: "Tipo de evento", mensagem: "Mensagem", assunto: "Assunto",
};
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Formulários públicos do site: valida, limita repetição e avisa a equipe (newsletter/quiz não avisam)
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((d: { kind: string; name?: string; email: string; phone?: string; payload?: Record<string, unknown> }) => {
    if (!LEAD_KINDS.includes(d.kind as LeadKind)) throw new Error("Formulário inválido");
    const email = String(d.email ?? "").trim().toLowerCase().slice(0, 200);
    if (!EMAIL.test(email)) throw new Error("E-mail inválido");
    const payload: Record<string, Json> = {};
    for (const [k, v] of Object.entries(d.payload ?? {}).slice(0, 30)) {
      if (!/^[a-z_]{1,40}$/.test(k)) continue;
      if (typeof v === "string" && v.trim()) payload[k] = v.trim().slice(0, 2000);
      else if (typeof v === "number" || typeof v === "boolean") payload[k] = v;
      else if (v && typeof v === "object") payload[k] = JSON.parse(JSON.stringify(v).slice(0, 4000)) as Json;
    }
    return {
      kind: d.kind as LeadKind, email, payload,
      name: String(d.name ?? "").trim().slice(0, 120) || null,
      phone: String(d.phone ?? "").trim().slice(0, 40) || null,
    };
  })
  .handler(async ({ data }) => {
    // Anti-spam: no máximo 5 envios do mesmo e-mail em 10 minutos
    const { count } = await supabaseAdmin.from("leads").select("id", { count: "exact", head: true })
      .ilike("email", data.email).gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString());
    if ((count ?? 0) >= 5) throw new Error("Muitos envios. Tente novamente em alguns minutos.");

    const company = typeof data.payload.empresa === "string" ? data.payload.empresa.slice(0, 120) : null;
    const { data: lead, error } = await supabaseAdmin.from("leads")
      .insert({ kind: data.kind, name: data.name, email: data.email, phone: data.phone, company, payload: data.payload })
      .select("id").single();
    if (error) throw new Error("Não foi possível enviar");

    if (data.kind !== "newsletter" && data.kind !== "quiz") {
      const { data: c } = await supabaseAdmin.from("company_settings").select("email").eq("singleton", true).maybeSingle();
      if (c?.email) {
        const site = env("SITE_URL").replace(/\/$/, "");
        const fields: [string, string][] = [["Nome", data.name ?? "—"], ["E-mail", data.email], ["WhatsApp", data.phone ?? "—"],
          ...Object.entries(data.payload).filter(([, v]) => typeof v === "string" || typeof v === "number").map(([k, v]) => [LABEL[k] ?? k, String(v)] as [string, string])];
        const m = emails.newLead(ORIGIN[data.kind], fields, site ? (data.kind === "corporativo" ? `${site}/crm/leads/${lead.id}` : `${site}/admin/contatos`) : null);
        await sendEmail(c.email, m.subject, m.html);
      }
    }
    return { ok: true };
  });
