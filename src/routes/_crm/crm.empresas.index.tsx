import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Modal, inputCls as input } from "@/components/crm-ui";
import { formatBRL } from "@/lib/format";
import { CRM_KINDS, OPEN_STAGES, SEGMENTS, SIZES, fmtDate, useTeam, type Stage } from "@/lib/crm";

export const Route = createFileRoute("/_crm/crm/empresas/")({
  head: () => ({ meta: [{ title: "Empresas — CRM" }] }),
  component: Empresas,
});

type Sort = "receita" | "nome" | "recente" | "proximo";

function Empresas() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: team = [] } = useTeam();
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<Sort>("receita");
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-empresas"],
    queryFn: async () => {
      const [accounts, contacts, leads] = await Promise.all([
        supabase.from("corporate_accounts").select("*"),
        supabase.from("corporate_contacts").select("account_id, name, role, is_primary"),
        supabase.from("leads").select("account_id, status, value_cents, event_date, updated_at").in("kind", CRM_KINDS).not("account_id", "is", null),
      ]);
      if (accounts.error) throw accounts.error;
      const today = new Date().toISOString().slice(0, 10);
      return accounts.data.map((a) => {
        const ls = (leads.data ?? []).filter((l) => l.account_id === a.id);
        const won = ls.filter((l) => l.status === "ganho");
        const cs = (contacts.data ?? []).filter((c) => c.account_id === a.id);
        const past = won.filter((l) => l.event_date && l.event_date < today).map((l) => l.event_date!).sort();
        const next = won.filter((l) => l.event_date && l.event_date >= today).map((l) => l.event_date!).sort();
        return {
          ...a,
          contact: cs.find((c) => c.is_primary) ?? cs[0],
          contacts: cs.length,
          events: won.length,
          revenue: won.reduce((s, l) => s + (l.value_cents ?? 0), 0),
          open: ls.filter((l) => OPEN_STAGES.includes(l.status as Stage)).length,
          lastEvent: past.at(-1) ?? null,
          nextEvent: next[0] ?? null,
          activity: [a.updated_at, ...ls.map((l) => l.updated_at)].sort().at(-1)!,
        };
      });
    },
  });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = (data ?? []).filter((a) =>
      (!segment || a.segment === segment) &&
      (!status || (status === "clientes" ? a.events > 0 : status === "abertas" ? a.open > 0 : a.events === 0 && a.open === 0)) &&
      (!term || [a.name, a.city, a.cnpj, a.segment, a.contact?.name, ...(a.tags ?? [])].some((v) => v?.toLowerCase().includes(term))));
    const by: Record<Sort, (x: typeof rows[number], y: typeof rows[number]) => number> = {
      receita: (x, y) => y.revenue - x.revenue || x.name.localeCompare(y.name),
      nome: (x, y) => x.name.localeCompare(y.name, "pt-BR"),
      recente: (x, y) => y.activity.localeCompare(x.activity),
      proximo: (x, y) => (x.nextEvent ?? "9999").localeCompare(y.nextEvent ?? "9999"),
    };
    return rows.sort(by[sort]);
  }, [data, q, segment, status, sort]);

  const totals = useMemo(() => {
    const rows = data ?? [];
    const clients = rows.filter((a) => a.events > 0);
    const revenue = clients.reduce((s, a) => s + a.revenue, 0);
    return { accounts: rows.length, clients: clients.length, revenue, recurring: clients.filter((a) => a.events >= 2).length };
  }, [data]);

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="CRM" title="Empresas"
        description="Contas corporativas: contatos, eventos realizados, receita e oportunidades. Toda oportunidade ganha cria ou atualiza a empresa automaticamente."
        actions={<button onClick={() => setCreating(true)} className="bg-foreground text-background px-5 py-2 text-xs uppercase tracking-[0.15em]">+ Nova empresa</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Empresas" value={totals.accounts} />
        <Stat label="Já realizaram evento" value={totals.clients} />
        <Stat label="Recorrentes" value={totals.recurring} hint="2 ou mais eventos" />
        <Stat label="Receita total" value={formatBRL(totals.revenue)} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, contato, cidade, CNPJ, tag…" className={`${input} w-80`} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
          <option value="">Todas</option>
          <option value="clientes">Clientes (já fizeram evento)</option>
          <option value="abertas">Com oportunidade aberta</option>
          <option value="prospects">Sem negócio ativo</option>
        </select>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className={input}>
          <option value="">Todos os setores</option>
          {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${input} ml-auto`}>
          <option value="receita">Maior receita</option>
          <option value="proximo">Próximo evento</option>
          <option value="recente">Atividade recente</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !list.length ? (
        <EmptyState eyebrow="Empresas" title={data?.length ? "Nenhuma empresa com esses filtros." : "Nenhuma empresa ainda."}
          description={data?.length ? undefined : "Elas aparecem quando uma oportunidade é ganha, ou cadastre manualmente."} />
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr>{["Empresa", "Contato principal", "Eventos", "Receita", "Último evento", "Próximo evento", "Em aberto", "Responsável"].map((h) => <th key={h} className="p-3 font-normal whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((a) => (
                <tr key={a.id} onClick={() => navigate({ to: "/crm/empresas/$id", params: { id: a.id } })} className="cursor-pointer hover:bg-[color:var(--muted)]/40">
                  <td className="p-3">
                    <Link to="/crm/empresas/$id" params={{ id: a.id }} className="font-display text-lg hover:underline">{a.name}</Link>
                    <div className="text-xs text-muted-foreground">{[a.segment, a.city].filter(Boolean).join(" · ") || "—"}</div>
                  </td>
                  <td className="p-3">{a.contact ? <>{a.contact.name}{a.contact.role && <div className="text-xs text-muted-foreground">{a.contact.role}</div>}</> : "—"}{a.contacts > 1 && <div className="text-xs text-muted-foreground">+{a.contacts - 1} contato(s)</div>}</td>
                  <td className="p-3">{a.events || "—"}</td>
                  <td className="p-3 whitespace-nowrap">{a.revenue ? formatBRL(a.revenue) : "—"}</td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(a.lastEvent)}</td>
                  <td className="p-3 whitespace-nowrap">{a.nextEvent ? <span className="text-[color:var(--gold)]">{fmtDate(a.nextEvent)}</span> : "—"}</td>
                  <td className="p-3">{a.open || "—"}</td>
                  <td className="p-3">{team.find((t) => t.id === a.owner_id)?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <NewAccount onClose={() => setCreating(false)} onCreated={(id) => {
        qc.invalidateQueries({ queryKey: ["crm-empresas"] });
        qc.invalidateQueries({ queryKey: ["crm-accounts"] });
        navigate({ to: "/crm/empresas/$id", params: { id } });
      }} />}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="border border-border bg-background p-4">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function NewAccount({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim() || null;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("corporate_accounts").insert({
      name: s("name")!, segment: s("segment"), size: s("size"), city: s("city"), cnpj: s("cnpj"), website: s("website"), owner_id: u.user?.id ?? null,
    }).select("id").single();
    if (!error && s("contact_name")) {
      await supabase.from("corporate_contacts").insert({ account_id: data.id, name: s("contact_name")!, role: s("contact_role"), email: s("contact_email")?.toLowerCase() ?? null, phone: s("contact_phone"), is_primary: true });
    }
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "Já existe uma empresa com esse nome" : error.message);
    toast.success("Empresa cadastrada");
    onCreated(data.id);
  };
  return (
    <Modal title="Nova empresa" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome da empresa"><input name="name" required maxLength={160} className={`${input} w-full`} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Setor"><select name="segment" defaultValue="" className={`${input} w-full`}><option value="">—</option>{SEGMENTS.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Porte"><select name="size" defaultValue="" className={`${input} w-full`}><option value="">—</option>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Cidade"><input name="city" maxLength={80} className={`${input} w-full`} /></Field>
          <Field label="CNPJ"><input name="cnpj" maxLength={20} className={`${input} w-full`} /></Field>
        </div>
        <Field label="Site"><input name="website" maxLength={200} placeholder="empresa.com.br" className={`${input} w-full`} /></Field>
        <div className="eyebrow pt-2">Contato principal (opcional)</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome"><input name="contact_name" maxLength={120} className={`${input} w-full`} /></Field>
          <Field label="Cargo"><input name="contact_role" maxLength={80} placeholder="RH, Eventos, Diretoria…" className={`${input} w-full`} /></Field>
          <Field label="E-mail"><input name="contact_email" type="email" maxLength={200} className={`${input} w-full`} /></Field>
          <Field label="WhatsApp"><input name="contact_phone" maxLength={40} className={`${input} w-full`} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
          <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Salvando…" : "Cadastrar"}</button>
        </div>
      </form>
    </Modal>
  );
}
