import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type FinAccount = Tables<"fin_accounts">;
export type FinCategory = Tables<"fin_categories">;
export type FinEntry = Tables<"fin_entries">;
export type FinRecurrence = Tables<"fin_recurrences">;

export const FREQUENCIES: Record<string, { label: string; perMonth: number }> = {
  weekly: { label: "Semanal", perMonth: 52 / 12 },
  biweekly: { label: "Quinzenal", perMonth: 26 / 12 },
  monthly: { label: "Mensal", perMonth: 1 },
  bimonthly: { label: "Bimestral", perMonth: 1 / 2 },
  quarterly: { label: "Trimestral", perMonth: 1 / 3 },
  semiannual: { label: "Semestral", perMonth: 1 / 6 },
  yearly: { label: "Anual", perMonth: 1 / 12 },
};

export const COST_CENTERS = ["Loja", "Corporativo", "Cursos", "Marketing", "Administrativo"] as const;
export const ACCOUNT_KINDS: Record<string, string> = { banco: "Banco", caixa: "Caixa", gateway: "Gateway de pagamento", cartao: "Cartão de crédito", investimento: "Investimento" };
export const PAYMENT_METHODS = ["Pix", "Boleto", "Cartão de crédito", "Cartão de débito", "Transferência", "Dinheiro", "Débito automático", "mercadopago", "stripe"];
export const SOURCE: Record<string, string> = { manual: "Manual", loja: "Loja (automático)", crm: "CRM (automático)", importacao: "Extrato importado" };

// Linhas do DRE na ordem de apresentação
export const DRE_GROUPS: { id: string; label: string; kind: "in" | "out" }[] = [
  { id: "receita", label: "Receita bruta", kind: "in" },
  { id: "deducoes", label: "(−) Deduções, impostos e taxas", kind: "out" },
  { id: "custos", label: "(−) Custos dos produtos e eventos", kind: "out" },
  { id: "pessoal", label: "(−) Pessoal", kind: "out" },
  { id: "administrativas", label: "(−) Despesas administrativas", kind: "out" },
  { id: "comerciais", label: "(−) Despesas comerciais e marketing", kind: "out" },
  { id: "receita_financeira", label: "(+) Receitas financeiras", kind: "in" },
  { id: "financeiras", label: "(−) Despesas financeiras", kind: "out" },
  { id: "investimentos", label: "(−) Investimentos", kind: "out" },
  { id: "nao_operacional", label: "Movimentos de sócios (aportes e retiradas)", kind: "in" },
];
export const DRE_LABEL = Object.fromEntries(DRE_GROUPS.map((g) => [g.id, g.label.replace(/^\(.\) /, "")]));

export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
export const isLate = (e: Pick<FinEntry, "status" | "due_date">) => e.status === "pendente" && e.due_date < today();
export const signed = (e: Pick<FinEntry, "kind" | "amount_cents">) => (e.kind === "in" ? e.amount_cents : -e.amount_cents);
export const fmtD = (d: string | null) => (d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—");
export const monthKey = (d: string) => d.slice(0, 7);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const monthLabel = (k: string) => `${MESES[Number(k.slice(5, 7)) - 1]}/${k.slice(2, 4)}`;
export const addMonths = (d: string, n: number) => {
  const [y, m, day] = d.split("-").map(Number);
  const last = new Date(y, m - 1 + n + 1, 0).getDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(day, last))).toISOString().slice(0, 10);
};

export function useFinanceBase() {
  return useQuery({
    queryKey: ["fin-base"],
    queryFn: async () => {
      const [accounts, categories] = await Promise.all([
        supabase.from("fin_accounts").select("*").order("created_at"),
        supabase.from("fin_categories").select("*").order("name"),
      ]);
      if (accounts.error) throw accounts.error;
      return { accounts: accounts.data, categories: categories.data ?? [] };
    },
  });
}

// Todos os lançamentos não cancelados (base de painel, fluxo e DRE)
export function useAllEntries() {
  return useQuery({
    queryKey: ["fin-all"],
    queryFn: async () => {
      const out: FinEntry[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("fin_entries").select("*").neq("status", "cancelado").order("due_date").range(from, from + 999);
        if (error) throw error;
        out.push(...data);
        if (data.length < 1000) break;
      }
      return out;
    },
  });
}

// Saldo por conta: inicial + tudo que foi efetivamente pago/recebido a partir da data inicial
export function balances(accounts: FinAccount[], entries: FinEntry[]) {
  return accounts.map((a) => ({
    ...a,
    balance: a.initial_balance_cents + entries
      .filter((e) => e.account_id === a.id && e.status === "pago" && (e.paid_at ?? "") >= a.initial_date)
      .reduce((s, e) => s + signed(e), 0),
  }));
}

// Extrato OFX (padrão dos bancos brasileiros): data, valor, identificador e descrição de cada transação
export function parseOfx(text: string) {
  const tag = (block: string, t: string) => block.match(new RegExp(`<${t}>([^<\\r\\n]*)`, "i"))?.[1]?.trim() ?? "";
  return [...text.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>))/gi)].map((m) => {
    const b = m[1];
    const raw = tag(b, "DTPOSTED");
    const amount = Number(tag(b, "TRNAMT").replace(",", "."));
    return {
      fitid: tag(b, "FITID"),
      date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
      amountCents: Math.round(amount * 100),
      memo: (tag(b, "MEMO") || tag(b, "NAME") || "Lançamento do extrato").slice(0, 200),
    };
  }).filter((t) => t.fitid && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && Number.isFinite(t.amountCents) && t.amountCents !== 0);
}
