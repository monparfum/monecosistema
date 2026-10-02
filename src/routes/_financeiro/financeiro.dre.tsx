import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { formatBRL } from "@/lib/format";
import { DRE_GROUPS, monthLabel, today, useAllEntries, useFinanceBase, type FinEntry } from "@/lib/finance";

export const Route = createFileRoute("/_financeiro/financeiro/dre")({
  head: () => ({ meta: [{ title: "DRE — Financeiro" }] }),
  component: Dre,
});

// DRE gerencial por competência (o mês a que a receita/despesa pertence), pagos e em aberto
function Dre() {
  const { data: base } = useFinanceBase();
  const { data: entries = [], isLoading } = useAllEntries();
  const [year, setYear] = useState(Number(today().slice(0, 4)));
  const [open, setOpen] = useState<Set<string>>(new Set());
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const cats = base?.categories ?? [];
  const group = (e: FinEntry) => cats.find((c) => c.id === e.category_id)?.dre_group ?? (e.kind === "in" ? "receita" : "administrativas");
  const inYear = entries.filter((e) => e.competence_date.startsWith(String(year)));

  const cell = (g: string, m: string | null, catId?: string | null) =>
    inYear.filter((e) => group(e) === g && (!m || e.competence_date.startsWith(m)) && (catId === undefined || (e.category_id ?? null) === catId))
      .reduce((s, e) => s + (e.kind === "in" ? e.amount_cents : -e.amount_cents), 0);
  const total = (gs: string[], m: string | null) => gs.reduce((s, g) => s + cell(g, m), 0);

  const RESULTS: { after: string; label: string; groups: string[] }[] = [
    { after: "deducoes", label: "= Receita líquida", groups: ["receita", "deducoes"] },
    { after: "custos", label: "= Lucro bruto", groups: ["receita", "deducoes", "custos"] },
    { after: "comerciais", label: "= Resultado operacional", groups: ["receita", "deducoes", "custos", "pessoal", "administrativas", "comerciais"] },
    { after: "financeiras", label: "= Resultado líquido", groups: ["receita", "deducoes", "custos", "pessoal", "administrativas", "comerciais", "receita_financeira", "financeiras"] },
    { after: "investimentos", label: "= Resultado após investimentos", groups: ["receita", "deducoes", "custos", "pessoal", "administrativas", "comerciais", "receita_financeira", "financeiras", "investimentos"] },
  ];
  const cols = [...months, null];
  const uncategorized = inYear.filter((e) => !e.category_id).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="eyebrow mb-2">Financeiro</div>
          <h1 className="font-display text-4xl">DRE gerencial</h1>
          <p className="text-sm text-muted-foreground mt-1">Por competência, incluindo valores em aberto. Clique numa linha para ver as categorias.</p>
          {uncategorized > 0 && <p className="text-xs text-destructive mt-1">{uncategorized} lançamento(s) sem categoria em {year} (contados como receita bruta ou despesa administrativa).</p>}
        </div>
        <div className="flex items-center border border-border">
          <button onClick={() => setYear(year - 1)} className="px-3 py-2">‹</button><span className="px-3 text-sm">{year}</span><button onClick={() => setYear(year + 1)} className="px-3 py-2">›</button>
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="eyebrow text-muted-foreground border-b border-border">
              <tr><th className="p-2 text-left font-normal min-w-56" />{cols.map((m) => <th key={m ?? "t"} className="p-2 text-right font-normal capitalize">{m ? monthLabel(m) : "Total"}</th>)}</tr>
            </thead>
            <tbody>
              {DRE_GROUPS.map((g) => {
                const res = RESULTS.find((r) => r.after === g.id);
                const catsInGroup = cats.filter((c) => c.dre_group === g.id);
                const expanded = open.has(g.id);
                return (
                  <Fragment key={g.id}>
                    <tr className="border-t border-border cursor-pointer hover:bg-[color:var(--muted)]/30" onClick={() => { const n = new Set(open); if (expanded) n.delete(g.id); else n.add(g.id); setOpen(n); }}>
                      <td className="p-2">{expanded ? "▾" : "▸"} {g.label}</td>
                      {cols.map((m) => <Num key={m ?? "t"} v={cell(g.id, m)} />)}
                    </tr>
                    {expanded && catsInGroup.map((c) => (
                      <tr key={c.id} className="text-muted-foreground">
                        <td className="p-2 pl-7">{c.name}</td>
                        {cols.map((m) => <Num key={m ?? "t"} v={cell(g.id, m, c.id)} />)}
                      </tr>
                    ))}
                    {res && (
                      <tr className="border-t border-foreground font-medium bg-[color:var(--muted)]/30">
                        <td className="p-2">{res.label}</td>
                        {cols.map((m) => <Num key={m ?? "t"} v={total(res.groups, m)} strong />)}
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Num({ v, strong }: { v: number; strong?: boolean }) {
  return <td className={`p-2 text-right whitespace-nowrap ${v < 0 && strong ? "text-destructive" : ""}`}>{v === 0 ? "—" : formatBRL(v)}</td>;
}
