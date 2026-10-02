import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";
import { Field, Modal, inputCls as input } from "@/components/crm-ui";
import { formatBRL } from "@/lib/format";
import {
  ACTIVITY, OPEN_STAGES, SEGMENTS, SIZES, STAGE_LABEL, fmtDate, parseBRL, useTeam, waHref,
  type Account, type Contact, type Stage,
} from "@/lib/crm";

export const Route = createFileRoute("/_crm/crm/empresas/$id")({
  head: () => ({ meta: [{ title: "Empresa — CRM" }] }),
  component: EmpresaPage,
});

const NOTE_KINDS = ["nota", "reuniao", "ligacao", "whatsapp", "email"] as const;

function EmpresaPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: team = [] } = useTeam();
  const [newOpp, setNewOpp] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-empresa", id],
    queryFn: async () => {
      const [account, contacts, leads] = await Promise.all([
        supabase.from("corporate_accounts").select("*").eq("id", id).maybeSingle(),
        supabase.from("corporate_contacts").select("*").eq("account_id", id).order("is_primary", { ascending: false }).order("name"),
        supabase.from("leads").select("*").eq("account_id", id).order("created_at", { ascending: false }),
      ]);
      if (account.error) throw account.error;
      const leadIds = (leads.data ?? []).map((l) => l.id);
      const acts = await supabase.from("lead_activities").select("*")
        .or(leadIds.length ? `account_id.eq.${id},lead_id.in.(${leadIds.join(",")})` : `account_id.eq.${id}`)
        .order("created_at", { ascending: false }).limit(200);
      return { account: account.data, contacts: contacts.data ?? [], leads: leads.data ?? [], activities: acts.data ?? [] };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["crm-empresa", id] });
    qc.invalidateQueries({ queryKey: ["crm-empresas"] });
    qc.invalidateQueries({ queryKey: ["crm-accounts"] });
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  const a = data?.account;
  if (!a) return <EmptyState title="Empresa não encontrada." />;

  const today = new Date().toISOString().slice(0, 10);
  const won = data.leads.filter((l) => l.status === "ganho");
  const upcoming = won.filter((l) => l.event_date && l.event_date >= today).sort((x, y) => x.event_date!.localeCompare(y.event_date!));
  const done = won.filter((l) => !l.event_date || l.event_date < today).sort((x, y) => (y.event_date ?? "").localeCompare(x.event_date ?? ""));
  const open = data.leads.filter((l) => OPEN_STAGES.includes(l.status as Stage));
  const lost = data.leads.filter((l) => l.status === "perdido");
  const revenue = won.reduce((s, l) => s + (l.value_cents ?? 0), 0);
  const people = won.reduce((s, l) => s + (l.participants ?? 0), 0);
  const leadName = (leadId: string | null) => data.leads.find((l) => l.id === leadId);

  return (
    <div className="space-y-8 max-w-[1300px]">
      <div>
        <Link to="/crm/empresas" className="eyebrow text-muted-foreground hover:text-foreground">← Empresas</Link>
        <div className="flex flex-wrap justify-between items-end gap-4 mt-3">
          <div>
            <div className="eyebrow">{[a.segment, a.size, a.city].filter(Boolean).join(" · ") || "Empresa"}</div>
            <h1 className="font-display text-4xl mt-1">{a.name}</h1>
            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4">
              {a.cnpj && <span>CNPJ {a.cnpj}</span>}
              {a.website && <a href={/^https?:\/\//.test(a.website) ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" className="underline">{a.website}</a>}
              {a.domain && <span>@{a.domain}</span>}
            </div>
          </div>
          <button onClick={() => setNewOpp(true)} className="bg-foreground text-background px-5 py-2 text-xs uppercase tracking-[0.15em]">+ Nova oportunidade</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Eventos" value={won.length} />
        <Stat label="Receita" value={formatBRL(revenue)} />
        <Stat label="Ticket médio" value={won.length ? formatBRL(Math.round(revenue / won.length)) : "—"} />
        <Stat label="Pessoas atendidas" value={people || "—"} />
        <Stat label="Em negociação" value={open.length ? `${open.length} · ${formatBRL(open.reduce((s, l) => s + (l.value_cents ?? 0), 0))}` : "—"} />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="space-y-8">
          <Section title="Oportunidades em andamento" empty={!open.length && "Nenhuma oportunidade aberta."}>
            <OppTable rows={open} cols="stage" />
          </Section>
          <Section title="Próximos eventos" empty={!upcoming.length && "Nenhum evento agendado."}>
            <OppTable rows={upcoming} cols="event" />
          </Section>
          <Section title="Eventos realizados" empty={!done.length && "Nenhum evento realizado ainda."}>
            <OppTable rows={done} cols="event" />
          </Section>
          {lost.length > 0 && (
            <Section title="Oportunidades perdidas">
              <OppTable rows={lost} cols="lost" />
            </Section>
          )}

          <section>
            <h2 className="font-display text-2xl mb-4">Histórico</h2>
            <AccountNote accountId={id} onDone={refresh} />
            <ol className="border-l-2 border-border pl-6 space-y-5 mt-6">
              {data.activities.map((act) => {
                const opp = leadName(act.lead_id);
                return (
                  <li key={act.id} className="relative">
                    <span className={`absolute -left-[31px] top-1 w-3 h-3 ${act.kind === "etapa" || act.kind === "sistema" ? "bg-border" : "bg-foreground"}`} />
                    <div className="eyebrow">
                      {ACTIVITY[act.kind] ?? act.kind} · {new Date(act.created_at).toLocaleString("pt-BR")} · {team.find((t) => t.id === act.author_id)?.name ?? "Sistema"}
                      {opp && <> · <Link to="/crm/leads/$id" params={{ id: opp.id }} className="underline">{opp.event_type || opp.name || "oportunidade"}</Link></>}
                    </div>
                    <div className={`mt-1 whitespace-pre-wrap text-sm ${act.kind === "etapa" || act.kind === "sistema" ? "text-muted-foreground" : ""}`}>{act.body}</div>
                  </li>
                );
              })}
              {!data.activities.length && <li className="text-sm text-muted-foreground">Sem registros ainda.</li>}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <Contacts accountId={id} contacts={data.contacts} onChange={refresh} />
          <AccountDetails account={a} team={team} onSaved={refresh} />
          <button onClick={async () => {
            if (!confirm(`Excluir a empresa ${a.name} e seus contatos? As oportunidades continuam no funil, sem empresa.`)) return;
            const { error } = await supabase.from("corporate_accounts").delete().eq("id", id);
            if (error) return toast.error(error.message);
            toast.success("Empresa excluída");
            refresh();
            navigate({ to: "/crm/empresas" });
          }} className="text-xs text-destructive underline">Excluir empresa</button>
        </aside>
      </div>

      {newOpp && <NewOpportunity account={a} contacts={data.contacts} onClose={() => setNewOpp(false)} onCreated={(leadId) => {
        refresh();
        qc.invalidateQueries({ queryKey: ["crm-leads"] });
        navigate({ to: "/crm/leads/$id", params: { id: leadId } });
      }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-border bg-background p-4">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty?: string | false; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      {empty ? <p className="text-sm text-muted-foreground">{empty}</p> : children}
    </section>
  );
}

type LeadRow = { id: string; status: string; event_date: string | null; event_type: string | null; event_city: string | null; participants: number | null; value_cents: number | null; lost_reason: string | null; name: string | null; created_at: string };

function OppTable({ rows, cols }: { rows: LeadRow[]; cols: "stage" | "event" | "lost" }) {
  return (
    <div className="border border-border divide-y divide-border">
      {rows.map((l) => (
        <Link key={l.id} to="/crm/leads/$id" params={{ id: l.id }} className="grid grid-cols-[110px_1fr_auto] gap-4 p-3 text-sm items-center hover:bg-[color:var(--muted)]/40">
          <span className={cols === "event" ? "font-medium" : "text-muted-foreground"}>{cols === "event" ? fmtDate(l.event_date) : fmtDate(l.created_at)}</span>
          <span>
            {l.event_type || "Evento"}{l.participants ? ` · ${l.participants} pessoas` : ""}{l.event_city ? ` · ${l.event_city}` : ""}
            <span className="block text-xs text-muted-foreground">
              {cols === "stage" ? `${STAGE_LABEL[l.status]}${l.event_date ? ` · evento ${fmtDate(l.event_date)}` : ""}` : cols === "lost" ? `Motivo: ${l.lost_reason ?? "—"}` : l.name ?? ""}
            </span>
          </span>
          <span className="whitespace-nowrap">{l.value_cents != null ? formatBRL(l.value_cents) : "—"}</span>
        </Link>
      ))}
    </div>
  );
}

function AccountNote({ accountId, onDone }: { accountId: string; onDone: () => void }) {
  const [kind, setKind] = useState<(typeof NOTE_KINDS)[number]>("nota");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!body.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("lead_activities").insert({ account_id: accountId, kind, body: body.trim().slice(0, 4000), author_id: u.user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    onDone();
  };
  return (
    <div className="border border-border p-4">
      <div className="flex gap-1 mb-3 flex-wrap">
        {NOTE_KINDS.map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 text-xs border ${kind === k ? "border-foreground bg-foreground text-background" : "border-border"}`}>{ACTIVITY[k]}</button>
        ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(); }}
        placeholder="Preferências, quem decide, orçamento anual, datas importantes da empresa…" className={`${input} w-full`} />
      <div className="flex justify-end mt-2">
        <button onClick={save} disabled={busy || !body.trim()} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">Registrar</button>
      </div>
    </div>
  );
}

function Contacts({ accountId, contacts, onChange }: { accountId: string; contacts: Contact[]; onChange: () => void }) {
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const setPrimary = async (c: Contact) => {
    await supabase.from("corporate_contacts").update({ is_primary: false }).eq("account_id", accountId);
    const { error } = await supabase.from("corporate_contacts").update({ is_primary: true }).eq("id", c.id);
    if (error) toast.error(error.message);
    onChange();
  };
  return (
    <section className="border border-border p-5">
      <div className="flex justify-between items-baseline mb-3">
        <div className="eyebrow">Contatos</div>
        <button onClick={() => setEditing("new")} className="text-xs underline">+ Adicionar</button>
      </div>
      {!contacts.length && <p className="text-sm text-muted-foreground">Nenhum contato.</p>}
      <ul className="divide-y divide-border">
        {contacts.map((c) => {
          const wa = waHref(c.phone);
          return (
            <li key={c.id} className="py-3 text-sm">
              <div className="flex justify-between gap-2">
                <div>
                  <span className="font-medium">{c.name}</span>{c.is_primary && <span className="ml-2 text-[11px] text-[color:var(--gold)]">PRINCIPAL</span>}
                  {c.role && <div className="text-xs text-muted-foreground">{c.role}</div>}
                </div>
                <div className="flex gap-2 text-xs shrink-0">
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="underline">WhatsApp</a>}
                  {c.email && <a href={`mailto:${c.email}`} className="underline">E-mail</a>}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{[c.email, c.phone].filter(Boolean).join(" · ")}</div>
              {c.notes && <div className="text-xs mt-1">{c.notes}</div>}
              <div className="flex gap-3 text-xs mt-1 text-muted-foreground">
                <button onClick={() => setEditing(c)} className="underline">editar</button>
                {!c.is_primary && <button onClick={() => setPrimary(c)} className="underline">tornar principal</button>}
                <button onClick={async () => { if (!confirm(`Remover ${c.name}?`)) return; await supabase.from("corporate_contacts").delete().eq("id", c.id); onChange(); }} className="underline">remover</button>
              </div>
            </li>
          );
        })}
      </ul>
      {editing && <ContactForm accountId={accountId} contact={editing === "new" ? null : editing} first={!contacts.length} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChange(); }} />}
    </section>
  );
}

function ContactForm({ accountId, contact, first, onClose, onSaved }: { accountId: string; contact: Contact | null; first: boolean; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim() || null;
    const row = { name: s("name")!, role: s("role"), email: s("email")?.toLowerCase() ?? null, phone: s("phone"), notes: s("notes") };
    setBusy(true);
    const { error } = contact
      ? await supabase.from("corporate_contacts").update(row).eq("id", contact.id)
      : await supabase.from("corporate_contacts").insert({ ...row, account_id: accountId, is_primary: first });
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "Esse e-mail já está nos contatos" : error.message);
    onSaved();
  };
  return (
    <Modal title={contact ? "Editar contato" : "Novo contato"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome"><input name="name" required maxLength={120} defaultValue={contact?.name} className={`${input} w-full`} /></Field>
          <Field label="Cargo"><input name="role" maxLength={80} defaultValue={contact?.role ?? ""} placeholder="RH, Eventos, Compras…" className={`${input} w-full`} /></Field>
          <Field label="E-mail"><input name="email" type="email" maxLength={200} defaultValue={contact?.email ?? ""} className={`${input} w-full`} /></Field>
          <Field label="WhatsApp"><input name="phone" maxLength={40} defaultValue={contact?.phone ?? ""} className={`${input} w-full`} /></Field>
        </div>
        <Field label="Observação"><input name="notes" maxLength={500} defaultValue={contact?.notes ?? ""} placeholder="Ex.: decide o orçamento, prefere WhatsApp" className={`${input} w-full`} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
          <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

function AccountDetails({ account: a, team, onSaved }: { account: Account; team: { id: string; name: string }[]; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim() || null;
    setBusy(true);
    const { error } = await supabase.from("corporate_accounts").update({
      name: s("name")!, segment: s("segment"), size: s("size"), city: s("city"), cnpj: s("cnpj"), website: s("website"),
      owner_id: s("owner"), notes: s("notes"),
      tags: [...new Set((s("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 20),
    }).eq("id", a.id);
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "Já existe uma empresa com esse nome" : error.message);
    toast.success("Dados salvos");
    onSaved();
  };
  return (
    <form key={a.updated_at} onSubmit={submit} className="border border-border p-5 space-y-3">
      <div className="eyebrow">Dados da empresa</div>
      <Field label="Nome"><input name="name" required maxLength={160} defaultValue={a.name} className={`${input} w-full`} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Setor"><select name="segment" defaultValue={a.segment ?? ""} className={`${input} w-full`}><option value="">—</option>{[...new Set([...SEGMENTS, ...(a.segment ? [a.segment] : [])])].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Porte"><select name="size" defaultValue={a.size ?? ""} className={`${input} w-full`}><option value="">—</option>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Cidade"><input name="city" maxLength={80} defaultValue={a.city ?? ""} className={`${input} w-full`} /></Field>
        <Field label="CNPJ"><input name="cnpj" maxLength={20} defaultValue={a.cnpj ?? ""} className={`${input} w-full`} /></Field>
      </div>
      <Field label="Site"><input name="website" maxLength={200} defaultValue={a.website ?? ""} className={`${input} w-full`} /></Field>
      <Field label="Responsável">
        <select name="owner" defaultValue={a.owner_id ?? ""} className={`${input} w-full`}>
          <option value="">Ninguém</option>
          {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Tags (separe por vírgula)"><input name="tags" defaultValue={(a.tags ?? []).join(", ")} placeholder="ex.: fim de ano, diretoria, premium" className={`${input} w-full`} /></Field>
      <Field label="Perfil e preferências"><textarea name="notes" rows={4} maxLength={4000} defaultValue={a.notes ?? ""} placeholder="O que gostam, restrições, quem aprova, como faturar…" className={`${input} w-full`} /></Field>
      <button disabled={busy} className="w-full bg-foreground text-background py-2 text-xs disabled:opacity-40">{busy ? "Salvando…" : "Salvar dados"}</button>
    </form>
  );
}

function NewOpportunity({ account, contacts, onClose, onCreated }: { account: Account; contacts: Contact[]; onClose: () => void; onCreated: (id: string) => void }) {
  const withEmail = contacts.filter((c) => c.email);
  const [contactId, setContactId] = useState(withEmail.find((c) => c.is_primary)?.id ?? withEmail[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const c = contacts.find((x) => x.id === contactId);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim() || null;
    const value = parseBRL(s("value") ?? "");
    if (Number.isNaN(value)) return toast.error("Valor inválido");
    const participants = s("participants") ? Number(s("participants")) : null;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("leads").insert({
      kind: "manual", account_id: account.id, company: account.name,
      name: s("name"), email: (s("email") ?? "").toLowerCase(), phone: s("phone"),
      event_type: s("event_type"), event_date: s("event_date"), event_city: s("event_city"), participants,
      value_cents: value, owner_id: account.owner_id ?? u.user?.id ?? null, payload: s("mensagem") ? { mensagem: s("mensagem")! } : {},
    }).select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message.includes("check") ? "Confira e-mail e números" : error.message);
    toast.success("Oportunidade criada");
    onCreated(data.id);
  };
  return (
    <Modal title={`Nova oportunidade — ${account.name}`} onClose={onClose}>
      <form key={contactId} onSubmit={submit} className="space-y-3">
        {contacts.length > 0 && (
          <Field label="Contato">
            <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={`${input} w-full`}>
              <option value="">Outro (preencher abaixo)</option>
              {contacts.map((x) => <option key={x.id} value={x.id}>{x.name}{x.role ? ` — ${x.role}` : ""}</option>)}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome"><input name="name" required maxLength={120} defaultValue={c?.name ?? ""} className={`${input} w-full`} /></Field>
          <Field label="E-mail"><input name="email" type="email" required maxLength={200} defaultValue={c?.email ?? ""} className={`${input} w-full`} /></Field>
          <Field label="WhatsApp"><input name="phone" maxLength={40} defaultValue={c?.phone ?? ""} className={`${input} w-full`} /></Field>
          <Field label="Formato do evento"><input name="event_type" maxLength={120} placeholder="Workshop, team building…" className={`${input} w-full`} /></Field>
          <Field label="Data prevista"><input name="event_date" type="date" className={`${input} w-full`} /></Field>
          <Field label="Participantes"><input name="participants" type="number" min={1} max={100000} className={`${input} w-full`} /></Field>
          <Field label="Cidade"><input name="event_city" maxLength={80} defaultValue={account.city ?? ""} className={`${input} w-full`} /></Field>
          <Field label="Valor estimado (R$)"><input name="value" inputMode="decimal" placeholder="0,00" className={`${input} w-full`} /></Field>
        </div>
        <Field label="Observação"><textarea name="mensagem" rows={2} maxLength={2000} className={`${input} w-full`} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
          <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Salvando…" : "Criar oportunidade"}</button>
        </div>
      </form>
    </Modal>
  );
}
