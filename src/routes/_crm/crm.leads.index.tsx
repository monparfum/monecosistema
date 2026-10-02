import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { formatBRL } from "@/lib/format";
import { Field, LostDialog, Modal, inputCls as input } from "@/components/crm-ui";
import { CRM_KINDS, OPEN_STAGES, STAGES, STAGE_LABEL, centsToInput, fmtDate, isOverdue, parseBRL, useAccounts, useTeam, waHref, type Lead, type Stage } from "@/lib/crm";

export const Route = createFileRoute("/_crm/crm/leads/")({
  head: () => ({ meta: [{ title: "Oportunidades — CRM" }] }),
  component: Leads,
});


function Leads() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: team = [] } = useTeam();
  const [view, setView] = useState<"funil" | "lista">("funil");
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("");
  const [onlyLate, setOnlyLate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [losing, setLosing] = useState<Lead | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").in("kind", CRM_KINDS).order("created_at", { ascending: false }).limit(2000);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) =>
      (!owner || (owner === "me" ? l.owner_id === me : owner === "none" ? !l.owner_id : l.owner_id === owner)) &&
      (!onlyLate || isOverdue(l)) &&
      (!term || [l.name, l.email, l.phone, l.company, l.event_type, l.event_city, ...(l.tags ?? [])].some((v) => v?.toLowerCase().includes(term))));
  }, [leads, q, owner, onlyLate, me]);

  const stats = useMemo(() => {
    const open = filtered.filter((l) => OPEN_STAGES.includes(l.status as Stage));
    const won = filtered.filter((l) => l.status === "ganho").length, lost = filtered.filter((l) => l.status === "perdido").length;
    return {
      open: open.length,
      pipeline: open.reduce((s, l) => s + (l.value_cents ?? 0), 0),
      late: filtered.filter(isOverdue).length,
      conv: won + lost ? Math.round((won / (won + lost)) * 100) : null,
      wonValue: filtered.filter((l) => l.status === "ganho").reduce((s, l) => s + (l.value_cents ?? 0), 0),
    };
  }, [filtered]);

  const move = async (lead: Lead, status: Stage, lost_reason?: string) => {
    if (lead.status === status) return;
    if (status === "perdido" && !lost_reason) { setLosing(lead); return; }
    qc.setQueryData<Lead[]>(["crm-leads"], (old) => old?.map((l) => (l.id === lead.id ? { ...l, status, lost_reason: lost_reason ?? l.lost_reason } : l)));
    const { error } = await supabase.from("leads").update({ status, ...(lost_reason ? { lost_reason } : {}) }).eq("id", lead.id);
    if (error) toast.error(error.message);
    else if (status === "ganho") toast.success(`${lead.company || lead.name || lead.email}: ganho! Empresa atualizada.`);
    ["crm-leads", "crm-empresas", "crm-accounts"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };

  const exportCsv = () => {
    const name = (id: string | null) => team.find((t) => t.id === id)?.name ?? "";
    const rows = filtered.map((l) => [new Date(l.created_at).toLocaleString("pt-BR"), l.kind === "corporativo" ? "Site" : "Manual", STAGE_LABEL[l.status] ?? l.status, l.company ?? "", l.name ?? "", l.email, l.phone ?? "",
      l.event_type ?? "", l.event_date ? fmtDate(l.event_date) : "", l.participants ?? "", l.event_city ?? "", centsToInput(l.value_cents), name(l.owner_id), l.next_action ?? "",
      l.next_action_at ? fmtDate(l.next_action_at) : "", l.lost_reason ?? "", (l.tags ?? []).join(", ")]);
    const csv = [["criado", "origem", "etapa", "empresa", "contato", "email", "telefone", "formato", "data do evento", "participantes", "cidade", "valor", "responsável", "próximo passo", "data", "motivo perda", "tags"], ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `oportunidades-mon-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="CRM corporativo" title="Oportunidades"
        description="Pedidos de proposta do site entram aqui automaticamente. Arraste os cartões entre as etapas; ao ganhar, a empresa é criada ou atualizada."
        actions={<button onClick={() => setCreating(true)} className="bg-foreground text-background px-5 py-2 text-xs uppercase tracking-[0.15em]">+ Nova oportunidade</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Em aberto" value={stats.open} />
        <Stat label="Valor no funil" value={formatBRL(stats.pipeline)} />
        <Stat label="Ganho" value={formatBRL(stats.wonValue)} />
        <Stat label="Conversão" value={stats.conv == null ? "—" : `${stats.conv}%`} hint="ganhos ÷ fechados" />
        <Stat label="Follow-ups atrasados" value={stats.late} alert={stats.late > 0} onClick={() => setOnlyLate(!onlyLate)} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, contato, formato, cidade, tag…" className={`${input} w-72`} />
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className={input}>
          <option value="">Todos os responsáveis</option>
          <option value="me">Minhas oportunidades</option>
          <option value="none">Sem responsável</option>
          {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm px-2"><input type="checkbox" checked={onlyLate} onChange={(e) => setOnlyLate(e.target.checked)} /> Só atrasados</label>
        <div className="ml-auto flex gap-2">
          <div className="flex border border-border">
            {(["funil", "lista"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-xs uppercase tracking-[0.15em] ${view === v ? "bg-foreground text-background" : ""}`}>{v}</button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={!filtered.length} className="border border-border px-4 py-2 text-xs disabled:opacity-40">Exportar CSV</button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : view === "funil" ? (
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 overflow-x-auto pb-4">
          {STAGES.map((s) => {
            const items = filtered.filter((l) => l.status === s.id);
            const total = items.reduce((sum, l) => sum + (l.value_cents ?? 0), 0);
            return (
              <div key={s.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { const l = leads.find((x) => x.id === dragId); if (l) move(l, s.id); setDragId(null); }}
                className={`border border-border bg-[color:var(--muted)]/30 flex flex-col min-h-[420px] ${dragId ? "outline-dashed outline-1 outline-border" : ""}`}>
                <div className="p-3 border-b border-border">
                  <div className="flex justify-between items-baseline"><span className="eyebrow">{s.label}</span><span className="text-xs text-muted-foreground">{items.length}</span></div>
                  {total > 0 && <div className="text-xs text-muted-foreground mt-1">{formatBRL(total)}</div>}
                </div>
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[70vh]">
                  {items.map((l) => (
                    <Card key={l.id} lead={l} owner={team.find((t) => t.id === l.owner_id)?.name}
                      onDragStart={() => setDragId(l.id)} onDragEnd={() => setDragId(null)}
                      onOpen={() => navigate({ to: "/crm/leads/$id", params: { id: l.id } })} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr>{["Empresa", "Evento", "Etapa", "Valor", "Responsável", "Próximo passo", "Entrada"].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-[color:var(--muted)]/40">
                  <td className="p-3"><Link to="/crm/leads/$id" params={{ id: l.id }} className="font-medium hover:underline">{l.company || l.name || l.email}</Link><div className="text-xs text-muted-foreground">{l.company ? l.name : l.email}</div></td>
                  <td className="p-3">{l.event_type || "—"}<div className="text-xs text-muted-foreground">{[l.event_date && fmtDate(l.event_date), l.participants && `${l.participants} pessoas`].filter(Boolean).join(" · ")}</div></td>
                  <td className="p-3">
                    <select value={l.status} onChange={(e) => move(l, e.target.value as Stage)} className="border border-border bg-background px-2 py-1 text-xs">
                      {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="p-3">{l.value_cents != null ? formatBRL(l.value_cents) : "—"}</td>
                  <td className="p-3">{team.find((t) => t.id === l.owner_id)?.name ?? "—"}</td>
                  <td className={`p-3 ${isOverdue(l) ? "text-destructive" : ""}`}>{l.next_action_at ? `${fmtDate(l.next_action_at)}${l.next_action ? ` · ${l.next_action}` : ""}` : "—"}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(l.created_at)} · {l.kind === "corporativo" ? "site" : "manual"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p className="p-6 text-sm text-muted-foreground">Nenhuma oportunidade com esses filtros.</p>}
        </div>
      )}

      {creating && <NewLead team={team} me={me ?? null} onClose={() => setCreating(false)} onCreated={(id) => { qc.invalidateQueries({ queryKey: ["crm-leads"] }); navigate({ to: "/crm/leads/$id", params: { id } }); }} />}
      {losing && <LostDialog lead={losing} onClose={() => setLosing(null)} onConfirm={(reason) => { move(losing, "perdido", reason); setLosing(null); }} />}
    </div>
  );
}

function Stat({ label, value, hint, alert, onClick }: { label: string; value: React.ReactNode; hint?: string; alert?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="border border-border bg-background p-4 text-left disabled:cursor-default">
      <div className="eyebrow">{label}</div>
      <div className={`font-display text-2xl mt-1 ${alert ? "text-destructive" : ""}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </button>
  );
}

function Card({ lead: l, owner, onDragStart, onDragEnd, onOpen }: { lead: Lead; owner?: string; onDragStart: () => void; onDragEnd: () => void; onOpen: () => void }) {
  const late = isOverdue(l);
  const wa = waHref(l.phone);
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onOpen}
      className="bg-background border border-border p-3 cursor-pointer hover:border-foreground transition-colors space-y-1.5">
      <div className="flex justify-between gap-2">
        <div className="font-medium text-sm leading-tight">{l.company || l.name || l.email}</div>
        {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-[color:var(--gold)] shrink-0" title="WhatsApp">WA</a>}
      </div>
      {l.company && l.name && <div className="text-xs text-muted-foreground">{l.name}</div>}
      {(l.event_type || l.event_date || l.participants) && (
        <div className="text-xs">{[l.event_type, l.participants && `${l.participants} pessoas`, l.event_date && fmtDate(l.event_date)].filter(Boolean).join(" · ")}</div>
      )}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {l.value_cents != null && <span className="border border-border px-1.5">{formatBRL(l.value_cents)}</span>}
        {(l.tags ?? []).slice(0, 2).map((t) => <span key={t} className="bg-[color:var(--muted)] px-1.5">{t}</span>)}
      </div>
      {l.next_action_at && (
        <div className={`text-xs ${late ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {late ? "Atrasado · " : ""}{fmtDate(l.next_action_at)}{l.next_action ? ` · ${l.next_action}` : ""}
        </div>
      )}
      {l.status === "perdido" && l.lost_reason && <div className="text-xs text-muted-foreground">Motivo: {l.lost_reason}</div>}
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{owner ?? "Sem responsável"}</span>
        <span>{l.kind === "corporativo" ? "site" : "manual"} · {new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
      </div>
    </div>
  );
}

function NewLead({ team, me, onClose, onCreated }: { team: { id: string; name: string }[]; me: string | null; onClose: () => void; onCreated: (id: string) => void }) {
  const { data: accounts = [] } = useAccounts();
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const value = parseBRL(s("value"));
    if (Number.isNaN(value)) return toast.error("Valor inválido");
    const company = s("company");
    const account = accounts.find((a) => a.name.toLowerCase() === company.toLowerCase());
    setBusy(true);
    const { data, error } = await supabase.from("leads").insert({
      kind: "manual", name: s("name") || null, email: s("email").toLowerCase(), phone: s("phone") || null,
      company: account?.name ?? (company || null), account_id: account?.id ?? null,
      event_type: s("event_type") || null, event_date: s("event_date") || null, event_city: s("event_city") || null,
      participants: s("participants") ? Number(s("participants")) : null,
      value_cents: value, owner_id: s("owner") || null, payload: s("mensagem") ? { mensagem: s("mensagem") } : {},
      tags: s("origem") ? [s("origem")] : [],
    }).select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message.includes("check") ? "Confira o e-mail e os números" : error.message);
    toast.success("Oportunidade criada");
    onCreated(data.id);
  };
  return (
    <Modal title="Nova oportunidade" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Empresa">
          <input name="company" list="crm-accounts" required maxLength={120} placeholder="Digite ou escolha uma empresa cadastrada" className={`${input} w-full`} />
          <datalist id="crm-accounts">{accounts.map((a) => <option key={a.id} value={a.name} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contato (nome)"><input name="name" required maxLength={120} className={`${input} w-full`} /></Field>
          <Field label="E-mail"><input name="email" type="email" required maxLength={200} className={`${input} w-full`} /></Field>
          <Field label="WhatsApp"><input name="phone" maxLength={40} className={`${input} w-full`} /></Field>
          <Field label="Como chegou">
            <select name="origem" className={`${input} w-full`} defaultValue="">
              <option value="">—</option>
              {["Indicação", "Instagram", "LinkedIn", "WhatsApp", "Telefone", "Evento", "E-mail", "Cliente recorrente"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Formato do evento"><input name="event_type" maxLength={120} placeholder="Workshop, team building…" className={`${input} w-full`} /></Field>
          <Field label="Data prevista"><input name="event_date" type="date" className={`${input} w-full`} /></Field>
          <Field label="Participantes"><input name="participants" type="number" min={1} max={100000} className={`${input} w-full`} /></Field>
          <Field label="Cidade"><input name="event_city" maxLength={80} className={`${input} w-full`} /></Field>
          <Field label="Valor estimado (R$)"><input name="value" inputMode="decimal" placeholder="0,00" className={`${input} w-full`} /></Field>
          <Field label="Responsável">
            <select name="owner" defaultValue={me ?? ""} className={`${input} w-full`}>
              <option value="">Ninguém</option>
              {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
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
