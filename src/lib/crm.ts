import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Lead = Tables<"leads">;
export type Account = Tables<"corporate_accounts">;
export type Contact = Tables<"corporate_contacts">;

export const STAGES = [
  { id: "novo", label: "Novo" },
  { id: "em_contato", label: "Em contato" },
  { id: "proposta", label: "Proposta enviada" },
  { id: "negociacao", label: "Negociação" },
  { id: "ganho", label: "Ganho" },
  { id: "perdido", label: "Perdido" },
] as const;
export type Stage = (typeof STAGES)[number]["id"];
export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label])) as Record<string, string>;
export const OPEN_STAGES: Stage[] = ["novo", "em_contato", "proposta", "negociacao"];

// CRM = só clientes corporativos (formulário Corporativo + cadastro manual)
export const CRM_KINDS = ["corporativo", "manual"];

export const ACTIVITY: Record<string, string> = {
  nota: "Nota", ligacao: "Ligação", whatsapp: "WhatsApp", email: "E-mail", reuniao: "Reunião", etapa: "Etapa", sistema: "Sistema",
};

export const LOST_REASONS = ["Preço", "Sem orçamento", "Data indisponível", "Escolheu concorrente", "Sem resposta", "Desistiu do evento", "Outro"];

export const SEGMENTS = ["Tecnologia", "Financeiro", "Saúde", "Indústria", "Varejo", "Moda e beleza", "Agro", "Educação", "Jurídico", "Imobiliário", "Hotelaria e turismo", "Agência / eventos", "Setor público", "Outro"];
export const SIZES = ["Até 50 pessoas", "51–200", "201–1.000", "Mais de 1.000"];

export { parseBRLInput as parseBRL, centsInput as centsToInput } from "@/lib/format";
export const fmtDate = (d: string | null) => (d ? new Date(d.length === 10 ? d + "T12:00" : d).toLocaleDateString("pt-BR") : "—");

export const PAYLOAD_LABEL: Record<string, string> = {
  empresa: "Empresa (informada)", cidade: "Cidade do evento", data_prevista: "Data prevista", participantes: "Participantes",
  tipo_evento: "Tipo de evento", mensagem: "Mensagem", assunto: "Assunto",
};

export const isOverdue = (l: Pick<Lead, "next_action_at" | "status">) =>
  !!l.next_action_at && OPEN_STAGES.includes(l.status as Stage) && new Date(l.next_action_at) < new Date();

export const waHref = (phone: string | null) => {
  const d = (phone ?? "").replace(/\D/g, "");
  return d ? `https://wa.me/${d.length <= 11 ? "55" + d : d}` : null;
};

export function useAccounts() {
  return useQuery({
    queryKey: ["crm-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("corporate_accounts").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Equipe (admins) para atribuir responsável
export function useTeam() {
  return useQuery({
    queryKey: ["crm-team"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return ids.map((id) => ({ id, name: data?.find((p) => p.id === id)?.full_name || "Sem nome" }));
    },
  });
}
