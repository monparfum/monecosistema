import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { formatBRL } from "@/lib/format";
import { addMonths, balances, monthKey, monthLabel, today, useAllEntries, useFinanceBase, type FinEntry } from "@/lib/finance";

export const Route = createFileRoute("/_financeiro/financeiro/fluxo-de-caixa")({
  head: () => ({ meta: [{ title: "Fluxo de caixa — Financeiro" }] }),
  component: Fluxo,
});

// Meses passados: o que efetivamente entrou/saiu (data de pagamento).
// Mês atual e futuros: realizado + em aberto pelo vencimento (atrasados entram no mês atual).
function Fluxo() {
  const { data: base } = useFinanceBase();
  const { data: entries = [], isLoading } = useAllEntries();
  const [ahead, setAhead] = useState(6);
  const t = today();
  const cur = t.slice(0, 7);
  const months = Array.from({ length: 3 + ahead }, (_, i) => addMonths(`${cur}-01`, i - 3).slice(0, 7));
  const isTransfer = (e: FinEntry) => base?.categories.find((c) => c.id === e.category_id)?.dre_group === "transferencia";
  const sum = (xs: FinEntry[]) => xs.reduce((s, e) => s + e.amount_cents, 0);

  const nowBalance = base ? balances(base.accounts.filter((a) => a.active), entries).reduce((s, a) => s + a.balance, 0) : 0;
  const rows = months.map((m) => {
    const real = entries.filter((e) => e.status === "pago" && e.paid_at && monthKey(e.paid_at) === m && !isTransfer(e));
    const open = m < cur ? [] : entries.filter((e) => e.status === "pendente" && !isTransfer(e) && (m === cur ? monthKey(e.due_date) <= cur : monthKey(e.due_date) === m));
    return {
      m, inReal: sum(real.filter((e) => e.kind === "in")), outReal: sum(real.filter((e) => e.kind === "out")),
      inOpen: sum(open.filter((e) => e.kind === "in")), outOpen: sum(open.filter((e) => e.kind === "out")),
    };
  });
  // Saldo projetado: parte do saldo real de hoje e soma só o que ainda está em aberto
  let running = nowBalance;
  const projected = rows.map((r) => {
    if (r.m < cur) return null;
    running += r.inOpen - r.outOpen;
    return running;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="eyebrow mb-2">Financeiro</div>
          <h1 className="font-display text-4xl">Fluxo de caixa</h1>
          <p className="text-sm text-muted-foreground mt-1">Saldo hoje em contas: <b>{formatBRL(nowBalance)}</b>. Transferências entre contas não entram.</p>
        </div>
        <select value={ahead} onChange={(e) => setAhead(Number(e.target.value))} className="border border-border bg-background px-3 py-2 text-sm">
          {[3, 6, 12].map((n) => <option key={n} value={n}>Projetar {n} meses</option>)}
        </select>
      </div>
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="eyebrow text-muted-foreground border-b border-border">
              <tr><th className="p-3 text-left font-normal" />{rows.map((r) => <th key={r.m} className={`p-3 text-right font-normal capitalize ${r.m === cur ? "text-foreground" : ""}`}>{monthLabel(r.m)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              <Line label="Recebido" values={rows.map((r) => r.inReal)} />
              <Line label="A receber" values={rows.map((r) => (r.m < cur ? null : r.inOpen))} muted />
              <Line label="Pago" values={rows.map((r) => -r.outReal)} />
              <Line label="A pagar" values={rows.map((r) => (r.m < cur ? null : -r.outOpen))} muted />
              <Line label="Resultado do mês" values={rows.map((r) => r.inReal - r.outReal + (r.m < cur ? 0 : r.inOpen - r.outOpen))} strong />
              <Line label="Saldo projetado" values={projected} strong />
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Contas atrasadas aparecem no mês atual. Para a projeção ficar fiel, lance as despesas fixas como “Repetir todo mês”.</p>
    </div>
  );
}

function Line({ label, values, muted, strong }: { label: string; values: (number | null)[]; muted?: boolean; strong?: boolean }) {
  return (
    <tr className={strong ? "font-medium bg-[color:var(--muted)]/30" : ""}>
      <td className={`p-3 whitespace-nowrap ${muted ? "text-muted-foreground" : ""}`}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`p-3 text-right whitespace-nowrap ${v == null ? "text-muted-foreground" : v < 0 ? (strong ? "text-destructive" : "") : ""} ${muted ? "text-muted-foreground" : ""}`}>
          {v == null ? "—" : v === 0 ? "—" : formatBRL(v)}
        </td>
      ))}
    </tr>
  );
}
