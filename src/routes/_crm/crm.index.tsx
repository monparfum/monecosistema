import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";
import { formatBRL } from "@/lib/format";
import { CRM_KINDS, OPEN_STAGES, STAGES, fmtDate, isOverdue, type Stage } from "@/lib/crm";

export const Route = createFileRoute("/_crm/crm/")({
  head: () => ({ meta: [{ title: "CRM — Mon Parfum" }] }),
  component: CrmDashboard,
});

function CrmDashboard() {
  const { data, error } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: async () => {
      const [leads, accounts] = await Promise.all([
        supabase.from("leads").select("*").in("kind", CRM_KINDS).order("created_at", { ascending: false }).limit(5000),
        supabase.from("corporate_accounts").select("id, name"),
      ]);
      if (leads.error) throw leads.error;
      const ls = leads.data;
      const accName = new Map((accounts.data ?? []).map((a) => [a.id, a.name]));
      const today = new Date().toISOString().slice(0, 10);
      const yearStart = `${today.slice(0, 4)}-01-01`;
      const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const open = ls.filter((l) => OPEN_STAGES.includes(l.status as Stage));
      const won = ls.filter((l) => l.status === "ganho");
      const lost = ls.filter((l) => l.status === "perdido");
      const wonYear = won.filter((l) => (l.closed_at ?? l.updated_at) >= yearStart);
      const revenueYear = wonYear.reduce((s, l) => s + (l.value_cents ?? 0), 0);
      const accountsWon = new Map<string, number>();
      won.forEach((l) => l.account_id && accountsWon.set(l.account_id, (accountsWon.get(l.account_id) ?? 0) + 1));
      return {
        newMonth: ls.filter((l) => l.created_at >= monthAgo).length,
        open,
        pipeline: open.reduce((s, l) => s + (l.value_cents ?? 0), 0),
        revenueYear,
        ticket: wonYear.length ? Math.round(revenueYear / wonYear.length) : null,
        conv: won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null,
        accounts: accName.size,
        recurring: [...accountsWon.values()].filter((n) => n >= 2).length,
        late: open.filter(isOverdue).length,
        events: won.filter((l) => l.event_date && l.event_date >= today).sort((a, b) => a.event_date!.localeCompare(b.event_date!)).slice(0, 8),
        agenda: open.filter((l) => l.next_action_at).sort((a, b) => a.next_action_at!.localeCompare(b.next_action_at!)).slice(0, 8),
        fresh: ls.filter((l) => l.status === "novo").slice(0, 8),
        byStage: STAGES.map((s) => {
          const items = ls.filter((l) => l.status === s.id);
          return { ...s, n: items.length, value: items.reduce((sum, l) => sum + (l.value_cents ?? 0), 0) };
        }),
        lostReasons: Object.entries(lost.reduce<Record<string, number>>((m, l) => {
          const r = l.lost_reason || "Sem motivo";
          return { ...m, [r]: (m[r] ?? 0) + 1 };
        }, {})).sort((a, b) => b[1] - a[1]),
        accName,
      };
    },
  });

  const title = (l: { company: string | null; name: string | null; email: string; account_id: string | null }) =>
    (l.account_id && data?.accName.get(l.account_id)) || l.company || l.name || l.email;

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader eyebrow="Módulo · CRM" title="Relacionamento corporativo"
        description="Propostas, empresas atendidas e eventos. Pedidos do formulário Corporativo e respostas do Quiz Olfativo entram sozinhos no funil." />
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <StatGrid>
        <StatCard label="Propostas (30 dias)" value={data?.newMonth ?? "—"} />
        <StatCard label="Em negociação" value={data?.open.length ?? "—"} hint={data ? formatBRL(data.pipeline) : undefined} />
        <StatCard label={`Receita ${new Date().getFullYear()}`} value={data ? formatBRL(data.revenueYear) : "—"} hint={data?.ticket ? `ticket médio ${formatBRL(data.ticket)}` : undefined} />
        <StatCard label="Conversão" value={data?.conv == null ? "—" : `${data.conv}%`} hint="ganhas ÷ encerradas" />
      </StatGrid>
      <StatGrid>
        <StatCard label="Empresas" value={data?.accounts ?? "—"} />
        <StatCard label="Recorrentes" value={data?.recurring ?? "—"} hint="2 ou mais eventos" />
        <StatCard label="Próximos eventos" value={data?.events.length ?? "—"} />
        <StatCard label="Follow-ups atrasados" value={data?.late ?? "—"} />
      </StatGrid>

      {data && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Panel title="Próximos eventos" link={{ to: "/crm/empresas", label: "Empresas" }} empty={!data.events.length && "Nenhum evento agendado."}>
            {data.events.map((l) => (
              <Row key={l.id} id={l.id} left={<>{title(l)}<span className="text-muted-foreground">{[l.event_type, l.participants && `${l.participants} pessoas`].filter(Boolean).map((x) => ` · ${x}`).join("")}</span></>}
                right={<span className="text-[color:var(--gold)]">{fmtDate(l.event_date)}</span>} />
            ))}
          </Panel>
          <Panel title="Agenda de follow-ups" link={{ to: "/crm/leads", label: "Funil" }} empty={!data.agenda.length && "Nenhum próximo passo agendado."}>
            {data.agenda.map((l) => (
              <Row key={l.id} id={l.id} left={<>{title(l)}{l.next_action && <span className="text-muted-foreground"> · {l.next_action}</span>}</>}
                right={<span className={isOverdue(l) ? "text-destructive" : "text-muted-foreground"}>{fmtDate(l.next_action_at)}</span>} />
            ))}
          </Panel>
          <Panel title="Novas, sem contato" empty={!data.fresh.length && "Todas as propostas já foram respondidas."}>
            {data.fresh.map((l) => (
              <Row key={l.id} id={l.id} left={<>{title(l)}{l.event_type && <span className="text-muted-foreground"> · {l.event_type}</span>}</>}
                right={<span className="text-muted-foreground">{fmtDate(l.created_at)}</span>} />
            ))}
          </Panel>
          <Panel title="Funil">
            {data.byStage.map((s) => {
              const max = Math.max(1, ...data.byStage.map((x) => x.n));
              return (
                <div key={s.id} className="flex items-center gap-3 text-sm py-1">
                  <span className="w-36 text-muted-foreground">{s.label}</span>
                  <div className="flex-1 bg-[color:var(--muted)] h-2"><div className={s.id === "perdido" ? "bg-destructive h-2" : "bg-foreground h-2"} style={{ width: `${(s.n / max) * 100}%` }} /></div>
                  <span className="w-8 text-right">{s.n}</span>
                  <span className="w-28 text-right text-xs text-muted-foreground">{s.value ? formatBRL(s.value) : ""}</span>
                </div>
              );
            })}
          </Panel>
          <Panel title="Motivos de perda" empty={!data.lostReasons.length && "Nenhuma perda registrada."}>
            {data.lostReasons.map(([k, n]) => (
              <div key={k} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0"><span>{k}</span><span>{n}</span></div>
            ))}
          </Panel>
        </div>
      )}
    </div>
  );
}

function Panel({ title, link, empty, children }: { title: string; link?: { to: "/crm/leads" | "/crm/empresas"; label: string }; empty?: string | false; children: React.ReactNode }) {
  return (
    <section className="border border-border p-6">
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="font-display text-2xl">{title}</h2>
        {link && <Link to={link.to} className="text-xs underline">{link.label}</Link>}
      </div>
      {empty ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="divide-y divide-border">{children}</div>}
    </section>
  );
}

function Row({ id, left, right }: { id: string; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <Link to="/crm/leads/$id" params={{ id }} className="flex justify-between gap-4 py-2 text-sm hover:underline">
      <span className="min-w-0">{left}</span>
      <span className="shrink-0">{right}</span>
    </Link>
  );
}
