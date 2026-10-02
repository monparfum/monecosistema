import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "@/lib/format";
import { ACCOUNT_KINDS, addMonths, balances, fmtD, isLate, monthKey, monthLabel, today, useAllEntries, useFinanceBase, type FinEntry } from "@/lib/finance";

export const Route = createFileRoute("/_financeiro/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro — Mon Parfum" }] }),
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { data: base } = useFinanceBase();
  const { data: entries = [], isLoading, error } = useAllEntries();
  const t = today();
  const in30 = addMonths(t, 1);
  const month = t.slice(0, 7);
  const isTransfer = (e: FinEntry) => base?.categories.find((c) => c.id === e.category_id)?.dre_group === "transferencia";

  const accs = base ? balances(base.accounts.filter((a) => a.active), entries) : [];
  const total = accs.reduce((s, a) => s + a.balance, 0);
  const open = entries.filter((e) => e.status === "pendente");
  const recv30 = open.filter((e) => e.kind === "in" && e.due_date <= in30);
  const pay30 = open.filter((e) => e.kind === "out" && e.due_date <= in30);
  const lateIn = open.filter((e) => e.kind === "in" && isLate(e));
  const lateOut = open.filter((e) => e.kind === "out" && isLate(e));
  const paidMonth = entries.filter((e) => e.status === "pago" && e.paid_at?.startsWith(month) && !isTransfer(e));
  const inMonth = paidMonth.filter((e) => e.kind === "in").reduce((s, e) => s + e.amount_cents, 0);
  const outMonth = paidMonth.filter((e) => e.kind === "out").reduce((s, e) => s + e.amount_cents, 0);
  const sum = (xs: FinEntry[]) => xs.reduce((s, e) => s + e.amount_cents, 0);

  const months = Array.from({ length: 6 }, (_, i) => addMonths(`${month}-01`, i - 5).slice(0, 7));
  const chart = months.map((m) => {
    const xs = entries.filter((e) => e.status === "pago" && e.paid_at && monthKey(e.paid_at) === m && !isTransfer(e));
    return { mes: monthLabel(m), Entradas: sum(xs.filter((e) => e.kind === "in")) / 100, Saídas: sum(xs.filter((e) => e.kind === "out")) / 100 };
  });
  const byCat = new Map<string, number>();
  entries.filter((e) => e.kind === "out" && e.competence_date.startsWith(month) && !isTransfer(e))
    .forEach((e) => { const n = base?.categories.find((c) => c.id === e.category_id)?.name ?? "Sem categoria"; byCat.set(n, (byCat.get(n) ?? 0) + e.amount_cents); });
  const upcoming = open.filter((e) => e.due_date <= addMonths(t, 1)).slice(0, 10);

  return (
    <div className="space-y-10 max-w-[1200px]">
      <div>
        <div className="eyebrow mb-2">Módulo · Financeiro</div>
        <h1 className="font-display text-4xl">Visão financeira</h1>
        <p className="text-sm text-muted-foreground mt-1">Vendas pagas da loja e oportunidades ganhas no CRM entram aqui sozinhas. O resto você lança ou importa do extrato.</p>
      </div>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Kpi label="Saldo em contas" value={formatBRL(total)} bad={total < 0} />
        <Kpi label="A receber (30 dias)" value={formatBRL(sum(recv30))} hint={lateIn.length ? `${lateIn.length} atrasado(s) · ${formatBRL(sum(lateIn))}` : undefined} />
        <Kpi label="A pagar (30 dias)" value={formatBRL(sum(pay30))} hint={lateOut.length ? `${lateOut.length} atrasado(s) · ${formatBRL(sum(lateOut))}` : undefined} />
        <Kpi label={`Resultado de caixa · ${monthLabel(month)}`} value={formatBRL(inMonth - outMonth)} bad={inMonth - outMonth < 0}
          hint={`entrou ${formatBRL(inMonth)} · saiu ${formatBRL(outMonth)}`} />
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : (
        <>
          <section className="border border-border p-6">
            <h2 className="font-display text-2xl mb-4">Entradas × saídas (pagas)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                  <Tooltip formatter={(v: number) => formatBRL(Math.round(v * 100))} />
                  <Legend />
                  <Bar dataKey="Entradas" fill="#B89B5E" />
                  <Bar dataKey="Saídas" fill="#1A1A1A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            <Panel title="Saldo por conta" link={{ to: "/financeiro/cadastros", label: "Contas" }}>
              {accs.map((a) => (
                <div key={a.id} className="flex justify-between py-2 text-sm">
                  <span>{a.name} <span className="text-xs text-muted-foreground">· {ACCOUNT_KINDS[a.kind] ?? a.kind}</span></span>
                  <span className={a.balance < 0 ? "text-destructive" : ""}>{formatBRL(a.balance)}</span>
                </div>
              ))}
            </Panel>
            <Panel title="Vencimentos (próximos 30 dias)" link={{ to: "/financeiro/a-pagar", label: "A pagar" }}>
              {upcoming.length ? upcoming.map((e) => (
                <div key={e.id} className="flex justify-between gap-4 py-2 text-sm">
                  <span className="min-w-0 truncate"><span className={isLate(e) ? "text-destructive" : "text-muted-foreground"}>{fmtD(e.due_date)}</span> · {e.description}</span>
                  <span className={e.kind === "in" ? "text-[color:var(--gold)] shrink-0" : "shrink-0"}>{e.kind === "in" ? "+" : "−"} {formatBRL(e.amount_cents)}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground py-2">Nada vencendo.</p>}
            </Panel>
            <Panel title={`Despesas de ${monthLabel(month)} por categoria`} link={{ to: "/financeiro/dre", label: "DRE" }}>
              {byCat.size ? [...byCat].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, v]) => (
                <div key={n} className="flex justify-between py-2 text-sm"><span>{n}</span><span>{formatBRL(v)}</span></div>
              )) : <p className="text-sm text-muted-foreground py-2">Nenhuma despesa lançada neste mês.</p>}
            </Panel>
            <Panel title="Atalhos" link={{ to: "/financeiro/lancamentos", label: "Lançamentos" }}>
              <Link to="/financeiro/lancamentos" className="block py-2 text-sm hover:underline">Lançar receita ou despesa →</Link>
              <Link to="/financeiro/lancamentos" className="block py-2 text-sm hover:underline">Importar extrato do banco (OFX) →</Link>
              <Link to="/financeiro/recorrencias" className="block py-2 text-sm hover:underline">Cadastrar receitas e despesas fixas →</Link>
              <Link to="/financeiro/a-receber" className="block py-2 text-sm hover:underline">Cobranças corporativas em aberto →</Link>
              <Link to="/financeiro/fluxo-de-caixa" className="block py-2 text-sm hover:underline">Projeção de caixa →</Link>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint, bad }: { label: string; value: React.ReactNode; hint?: string; bad?: boolean }) {
  return (
    <div className="bg-background p-6">
      <div className="eyebrow">{label}</div>
      <div className={`font-display text-3xl mt-2 ${bad ? "text-destructive" : ""}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Panel({ title, link, children }: { title: string; link: { to: "/financeiro/cadastros" | "/financeiro/a-pagar" | "/financeiro/dre" | "/financeiro/lancamentos"; label: string }; children: React.ReactNode }) {
  return (
    <section className="border border-border p-6">
      <div className="flex justify-between items-baseline mb-3"><h2 className="font-display text-2xl">{title}</h2><Link to={link.to} className="text-xs underline">{link.label}</Link></div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}
