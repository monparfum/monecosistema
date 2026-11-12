import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { QUIZ_INTERESSE, QUIZ_OBJETIVO } from "@/lib/mon-content";

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

// CRM = clientes corporativos (formulário Corporativo + cadastro manual) + leads do Quiz Olfativo (filtro de cliente)
export const CRM_KINDS = ["corporativo", "manual", "quiz"];

// Origem da oportunidade: rótulo + cor (quiz ganha destaque para a equipe identificar na hora)
export const ORIGIN: Record<string, { label: string; badge: string; accent: string }> = {
  corporativo: { label: "Site", badge: "bg-[color:var(--muted)]", accent: "" },
  manual: { label: "Manual", badge: "bg-[color:var(--muted)]", accent: "" },
  quiz: { label: "Quiz olfativo", badge: "bg-violet-600 text-white", accent: "border-l-4 border-l-violet-600" },
};
export const originOf = (l: Pick<Lead, "kind">) => ORIGIN[l.kind] ?? { label: l.kind, badge: "bg-[color:var(--muted)]", accent: "" };

// Valores do payload que vêm como chave (respostas do quiz) → nome legível. interesse/objetivo = quiz antigo (leads já gravados)
export const PAYLOAD_VALUE: Record<string, (v: string) => string> = {
  interesse: (v) => (QUIZ_INTERESSE as Record<string, { nome: string }>)[v]?.nome ?? v,
  objetivo: (v) => (QUIZ_OBJETIVO as Record<string, { nome: string }>)[v]?.nome ?? v,
  perfil: (v) => PERFIL_ANTIGO[v] ?? v,
  segunda_faceta: (v) => PERFIL_ANTIGO[v] ?? v,
  etapa: (v) => ({ inicio: "Começou e ainda não terminou", resultado: "Concluiu o quiz" })[v] ?? v,
};
// A primeira versão do quiz de personalidade gravava a letra do perfil; a atual grava o nome
const PERFIL_ANTIGO: Record<string, string> = { d: "Diplomático", c: "Comunicador", s: "Sistemático", m: "Dominante" };

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
  interesse: "Território olfativo", objetivo: "Objetivo declarado",
  perfil: "Perfil olfativo", segunda_faceta: "Segunda faceta", afinidades: "Mapa de afinidades",
  etapa: "Situação no quiz", pontos: "Pontuação (de 19)", consentimento: "Autorizou contato", quiz_id: "Código do quiz",
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
