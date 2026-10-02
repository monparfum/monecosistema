import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";
import { Field, LostDialog, inputCls as input } from "@/components/crm-ui";
import {
  ACTIVITY, PAYLOAD_LABEL, STAGES, STAGE_LABEL, centsToInput, fmtDate, isOverdue, parseBRL, useAccounts, useTeam, waHref,
  type Lead, type Stage,
} from "@/lib/crm";

export const Route = createFileRoute("/_crm/crm/leads/$id")({
  head: () => ({ meta: [{ title: "Oportunidade — CRM" }] }),
  component: LeadPage,
});

const LOG_KINDS = ["nota", "whatsapp", "ligacao", "email", "reuniao"] as const;
const CRM_KEYS = ["crm-lead", "crm-leads", "crm-empresas", "crm-empresa", "crm-accounts", "crm-stats"];

function LeadPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: team = [] } = useTeam();
  const [losing, setLosing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-lead", id],
    queryFn: async () => {
      const [lead, acts] = await Promise.all([
        supabase.from("leads").select("*").eq("id", id).maybeSingle(),
        supabase.from("lead_activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      ]);
      if (lead.error) throw lead.error;
      const accountId = lead.data?.account_id;
      const [account, others] = accountId
        ? await Promise.all([
            supabase.from("corporate_accounts").select("id, name, segment, city").eq("id", accountId).maybeSingle(),
            supabase.from("leads").select("id, status, event_date, event_type, value_cents").eq("account_id", accountId).neq("id", id).order("created_at", { ascending: false }),
          ])
        : [{ data: null }, { data: [] }];
      return { lead: lead.data, activities: acts.data ?? [], account: account.data, others: others.data ?? [] };
    },
  });

  const refresh = () => CRM_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const update = async (patch: Partial<Lead>, ok?: string) => {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) return toast.error(error.message.includes("check") ? "Valor inválido em algum campo" : error.message), false;
    if (ok) toast.success(ok);
    refresh();
    return true;
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  const l = data?.lead;
  if (!l) return <EmptyState title="Oportunidade não encontrada." />;

  const setStage = (s: Stage) => (s === "perdido" ? setLosing(true) : update({ status: s }, s === "ganho" ? "Oportunidade ganha! Empresa atualizada." : undefined));
  const wa = waHref(l.phone);
  const payload = Object.entries((l.payload ?? {}) as Record<string, unknown>).filter(([, v]) => v != null && v !== "");

  return (
    <div className="space-y-8 max-w-[1300px]">
      <div>
        <Link to="/crm/leads" className="eyebrow text-muted-foreground hover:text-foreground">← Oportunidades</Link>
        <div className="flex flex-wrap justify-between items-end gap-4 mt-3">
          <div>
            <div className="eyebrow">{l.kind === "corporativo" ? "Proposta pelo site" : "Cadastro manual"} · {new Date(l.created_at).toLocaleString("pt-BR")}</div>
            <h1 className="font-display text-4xl mt-1">{l.company || l.name || l.email}</h1>
            <div className="text-muted-foreground">
              {[l.company && l.name, l.event_type, l.participants && `${l.participants} pessoas`, l.event_date && `evento ${fmtDate(l.event_date)}`].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="flex gap-2">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="border border-border px-4 py-2 text-xs">WhatsApp</a>}
            <a href={`mailto:${l.email}`} className="border border-border px-4 py-2 text-xs">E-mail</a>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="grid grid-cols-3 md:grid-cols-6 border border-border">
        {STAGES.map((s, i) => {
          const cur = STAGES.findIndex((x) => x.id === l.status);
          const active = s.id === l.status;
          const done = l.status !== "perdido" && i < cur && s.id !== "perdido";
          return (
            <button key={s.id} onClick={() => setStage(s.id)}
              className={`px-3 py-3 text-xs uppercase tracking-[0.12em] border-r border-border last:border-r-0 transition-colors ${active ? (s.id === "perdido" ? "bg-destructive text-background" : "bg-foreground text-background") : done ? "bg-[color:var(--muted)]" : "hover:bg-[color:var(--muted)]/50"}`}>
              {s.label}
            </button>
          );
        })}
      </div>
      {l.status === "perdido" && l.lost_reason && <p className="text-sm text-muted-foreground -mt-4">Motivo da perda: {l.lost_reason}</p>}

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-8">
          <NextAction lead={l} onSave={update} />
          <Composer leadId={id} stage={l.status} onDone={refresh} onAutoAdvance={() => update({ status: "em_contato" })} />
          <section>
            <h2 className="font-display text-2xl mb-4">Histórico</h2>
            <ol className="border-l-2 border-border pl-6 space-y-5">
              {data.activities.map((a) => (
                <li key={a.id} className="relative group">
                  <span className={`absolute -left-[31px] top-1 w-3 h-3 ${a.kind === "etapa" || a.kind === "sistema" ? "bg-border" : "bg-foreground"}`} />
                  <div className="eyebrow">{ACTIVITY[a.kind] ?? a.kind} · {new Date(a.created_at).toLocaleString("pt-BR")} · {team.find((t) => t.id === a.author_id)?.name ?? "Sistema"}</div>
                  <div className={`mt-1 whitespace-pre-wrap text-sm ${a.kind === "etapa" || a.kind === "sistema" ? "text-muted-foreground" : ""}`}>{a.body}</div>
                  {!["etapa", "sistema"].includes(a.kind) && (
                    <button onClick={async () => { if (!confirm("Apagar este registro?")) return; await supabase.from("lead_activities").delete().eq("id", a.id); refresh(); }}
                      className="text-xs text-muted-foreground underline opacity-0 group-hover:opacity-100">apagar</button>
                  )}
                </li>
              ))}
              <li className="relative">
                <span className="absolute -left-[31px] top-1 w-3 h-3 bg-[color:var(--gold)]" />
                <div className="eyebrow">Entrada · {new Date(l.created_at).toLocaleString("pt-BR")}</div>
                <div className="mt-1 text-sm">{l.kind === "manual" ? "Cadastrada manualmente" : "Pedido de proposta pelo site (Corporativo)"}</div>
              </li>
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <AccountBox lead={l} account={data.account} others={data.others} onLinked={refresh} />
          <Details lead={l} team={team} onSave={update} />

          {payload.length > 0 && (
            <section className="border border-border p-5">
              <div className="eyebrow mb-3">Pedido original (site)</div>
              <dl className="space-y-2 text-sm">
                {payload.map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{PAYLOAD_LABEL[k] ?? k}</dt>
                    <dd className="whitespace-pre-wrap">{k === "data_prevista" && typeof v === "string" ? fmtDate(v) : typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></div>
                ))}
              </dl>
            </section>
          )}

          <button onClick={async () => {
            if (!confirm("Excluir esta oportunidade e todo o histórico? Não dá para desfazer.")) return;
            const { error } = await supabase.from("leads").delete().eq("id", id);
            if (error) return toast.error(error.message);
            toast.success("Oportunidade excluída");
            refresh();
            navigate({ to: "/crm/leads" });
          }} className="text-xs text-destructive underline">Excluir oportunidade</button>
        </aside>
      </div>

      {losing && <LostDialog lead={l} onClose={() => setLosing(false)} onConfirm={async (reason) => { setLosing(false); await update({ status: "perdido", lost_reason: reason }); }} />}
    </div>
  );
}

const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");

function NextAction({ lead: l, onSave }: { lead: Lead; onSave: (p: Partial<Lead>, ok?: string) => Promise<boolean> }) {
  const [text, setText] = useState(l.next_action ?? "");
  const [when, setWhen] = useState(toLocalInput(l.next_action_at));
  useEffect(() => { setText(l.next_action ?? ""); setWhen(toLocalInput(l.next_action_at)); }, [l.next_action, l.next_action_at]);
  const late = isOverdue(l);
  const plus = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(10, 0, 0, 0); setWhen(toLocalInput(d.toISOString())); };
  return (
    <section className={`border p-5 ${late ? "border-destructive" : "border-border"}`}>
      <div className="flex justify-between items-baseline mb-3">
        <div className="eyebrow">Próximo passo {late && <span className="text-destructive">· atrasado</span>}</div>
        <div className="flex gap-2 text-xs">{([[1, "amanhã"], [3, "+3 dias"], [7, "+1 semana"]] as const).map(([d, label]) => <button key={d} onClick={() => plus(d)} className="underline text-muted-foreground hover:text-foreground">{label}</button>)}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Ex.: Enviar proposta, confirmar data com o RH…" className={`${input} flex-1 min-w-[220px]`} />
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={input} />
        <button onClick={() => onSave({ next_action: text.trim() || null, next_action_at: when ? new Date(when).toISOString() : null }, "Próximo passo salvo")} className="bg-foreground text-background px-4 py-2 text-xs">Salvar</button>
        {(l.next_action || l.next_action_at) && (
          <button onClick={() => onSave({ next_action: null, next_action_at: null }, "Concluído")} className="border border-border px-4 py-2 text-xs">Concluído</button>
        )}
      </div>
    </section>
  );
}

function Composer({ leadId, stage, onDone, onAutoAdvance }: { leadId: string; stage: string; onDone: () => void; onAutoAdvance: () => void }) {
  const [kind, setKind] = useState<(typeof LOG_KINDS)[number]>("nota");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!body.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("lead_activities").insert({ lead_id: leadId, kind, body: body.trim().slice(0, 4000), author_id: u.user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    // Primeiro contato registrado tira a oportunidade de "Novo"
    if (stage === "novo" && kind !== "nota") onAutoAdvance();
    onDone();
  };
  return (
    <section className="border border-border p-5">
      <div className="flex gap-1 mb-3 flex-wrap">
        {LOG_KINDS.map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 text-xs border ${kind === k ? "border-foreground bg-foreground text-background" : "border-border"}`}>{ACTIVITY[k]}</button>
        ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(); }}
        placeholder={kind === "nota" ? "Anotação interna…" : `Resumo do(a) ${ACTIVITY[kind].toLowerCase()}…`} className={`${input} w-full`} />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">Ctrl+Enter para registrar</span>
        <button onClick={save} disabled={busy || !body.trim()} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">Registrar</button>
      </div>
    </section>
  );
}

function Details({ lead: l, team, onSave }: { lead: Lead; team: { id: string; name: string }[]; onSave: (p: Partial<Lead>, ok?: string) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const value = parseBRL(s("value"));
    if (Number.isNaN(value)) return toast.error("Valor inválido");
    setBusy(true);
    await onSave({
      name: s("name") || null, email: s("email").toLowerCase(), phone: s("phone") || null,
      value_cents: value, owner_id: s("owner") || null,
      event_type: s("event_type") || null, event_date: s("event_date") || null, event_city: s("event_city") || null,
      participants: s("participants") ? Number(s("participants")) : null,
      tags: [...new Set(s("tags").split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 20),
    }, "Dados salvos");
    setBusy(false);
  };
  return (
    <form key={l.updated_at} onSubmit={submit} className="border border-border p-5 space-y-3">
      <div className="eyebrow">Contato</div>
      <Field label="Nome"><input name="name" defaultValue={l.name ?? ""} maxLength={120} className={`${input} w-full`} /></Field>
      <Field label="E-mail"><input name="email" type="email" required defaultValue={l.email} maxLength={200} className={`${input} w-full`} /></Field>
      <Field label="WhatsApp"><input name="phone" defaultValue={l.phone ?? ""} maxLength={40} className={`${input} w-full`} /></Field>
      <div className="eyebrow pt-2">Evento</div>
      <Field label="Formato"><input name="event_type" maxLength={120} defaultValue={l.event_type ?? ""} placeholder="Workshop, team building, presente…" className={`${input} w-full`} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input name="event_date" type="date" defaultValue={l.event_date ?? ""} className={`${input} w-full`} /></Field>
        <Field label="Participantes"><input name="participants" type="number" min={1} max={100000} defaultValue={l.participants ?? ""} className={`${input} w-full`} /></Field>
      </div>
      <Field label="Cidade"><input name="event_city" maxLength={80} defaultValue={l.event_city ?? ""} className={`${input} w-full`} /></Field>
      <div className="eyebrow pt-2">Negócio</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor (R$)"><input name="value" inputMode="decimal" defaultValue={centsToInput(l.value_cents)} placeholder="0,00" className={`${input} w-full`} /></Field>
        <Field label="Responsável">
          <select name="owner" defaultValue={l.owner_id ?? ""} className={`${input} w-full`}>
            <option value="">Ninguém</option>
            {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Tags (separe por vírgula)"><input name="tags" defaultValue={(l.tags ?? []).join(", ")} placeholder="ex.: fim de ano, diretoria" className={`${input} w-full`} /></Field>
      <button disabled={busy} className="w-full bg-foreground text-background py-2 text-xs disabled:opacity-40">{busy ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}

function AccountBox({ lead: l, account, others, onLinked }: {
  lead: Lead;
  account: { id: string; name: string; segment: string | null; city: string | null } | null;
  others: { id: string; status: string; event_date: string | null; event_type: string | null; value_cents: number | null }[];
  onLinked: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const [pick, setPick] = useState("");
  const link = async (accountId: string, name?: string) => {
    const { error } = await supabase.from("leads").update({ account_id: accountId, ...(name ? { company: name } : {}) }).eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Empresa vinculada");
    onLinked();
  };
  const create = async () => {
    const name = (l.company || "").trim() || prompt("Nome da empresa")?.trim();
    if (!name) return;
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("corporate_accounts").insert({ name, city: l.event_city, owner_id: l.owner_id ?? u.user?.id ?? null }).select("id").single();
    if (error) return toast.error(error.code === "23505" ? "Já existe empresa com esse nome: vincule pela lista" : error.message);
    await link(data.id, name);
  };

  if (account) return (
    <section className="border border-border p-5">
      <div className="eyebrow mb-2">Empresa</div>
      <Link to="/crm/empresas/$id" params={{ id: account.id }} className="font-display text-xl hover:underline">{account.name}</Link>
      <div className="text-xs text-muted-foreground">{[account.segment, account.city].filter(Boolean).join(" · ")}</div>
      {others.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border text-xs space-y-1">
          <div className="text-muted-foreground mb-1">Outras oportunidades desta empresa</div>
          {others.map((o) => (
            <Link key={o.id} to="/crm/leads/$id" params={{ id: o.id }} className="flex justify-between gap-2 hover:underline">
              <span>{o.event_type || "Evento"} · {STAGE_LABEL[o.status]}</span><span>{fmtDate(o.event_date)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <section className="border border-border p-5 space-y-3">
      <div className="eyebrow">Empresa</div>
      <p className="text-sm text-muted-foreground">{l.company ? `"${l.company}" ainda não está cadastrada.` : "Sem empresa vinculada."} Ao marcar como ganho, a empresa é criada automaticamente.</p>
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={`${input} flex-1 min-w-0`}>
          <option value="">Vincular a empresa existente…</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button disabled={!pick} onClick={() => link(pick, accounts.find((a) => a.id === pick)?.name)} className="border border-border px-3 text-xs disabled:opacity-40">Vincular</button>
      </div>
      <button onClick={create} className="text-xs underline">Cadastrar {l.company ? `"${l.company}"` : "nova empresa"}</button>
    </section>
  );
}
