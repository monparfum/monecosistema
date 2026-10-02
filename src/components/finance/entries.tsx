import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RecurrenceForm } from "@/components/finance/recurrence-form";
import { centsInput, formatBRL, parseBRLInput } from "@/lib/format";
import {
  COST_CENTERS, PAYMENT_METHODS, SOURCE, addMonths, fmtD, isLate, monthLabel, parseOfx, signed, today, useFinanceBase,
  type FinAccount, type FinCategory, type FinEntry,
} from "@/lib/finance";

const input = "border border-border bg-background px-3 py-2 text-sm";
type Preset = "todos" | "pagar" | "receber";

export function EntriesPage({ preset }: { preset: Preset }) {
  const qc = useQueryClient();
  const { data: base } = useFinanceBase();
  const pending = preset !== "todos";
  const [month, setMonth] = useState(today().slice(0, 7));
  const [kind, setKind] = useState(preset === "pagar" ? "out" : preset === "receber" ? "in" : "");
  const [status, setStatus] = useState(pending ? "abertos" : "");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const [center, setCenter] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<FinEntry | { kind: "in" | "out" } | null>(null);
  const [importing, setImporting] = useState(false);
  const [paying, setPaying] = useState<FinEntry[] | null>(null);
  const [recurring, setRecurring] = useState<"in" | "out" | null>(null);

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ["fin-entries", pending ? "abertos" : month],
    queryFn: async () => {
      let query = supabase.from("fin_entries").select("*").order("due_date").limit(5000);
      // Em "a pagar/receber" vale tudo que está em aberto; nos lançamentos, o mês (por vencimento ou pagamento)
      if (pending) query = query.eq("status", "pendente");
      else {
        const start = `${month}-01`, end = addMonths(start, 1);
        query = query.or(`and(due_date.gte.${start},due_date.lt.${end}),and(paid_at.gte.${start},paid_at.lt.${end})`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const cat = (id: string | null) => base?.categories.find((c) => c.id === id);
  const acc = (id: string | null) => base?.accounts.find((a) => a.id === id);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entries.filter((e) =>
      (!kind || e.kind === kind) &&
      (!status || (status === "abertos" ? e.status === "pendente" : status === "atrasados" ? isLate(e) : status === "sem_categoria" ? !e.category_id && e.status !== "cancelado" : e.status === status)) &&
      (!account || e.account_id === account) && (!category || e.category_id === category) && (!center || e.cost_center === center) &&
      (!term || [e.description, e.counterpart, e.document, e.notes].some((v) => v?.toLowerCase().includes(term))));
  }, [entries, kind, status, account, category, center, q]);

  const live = list.filter((e) => e.status !== "cancelado");
  const sumIn = live.filter((e) => e.kind === "in").reduce((s, e) => s + e.amount_cents, 0);
  const sumOut = live.filter((e) => e.kind === "out").reduce((s, e) => s + e.amount_cents, 0);
  const late = live.filter(isLate);

  const refresh = () => { setSelected(new Set()); ["fin-entries", "fin-dash", "fin-flow", "fin-dre", "fin-all"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); };

  const reopen = async (e: FinEntry) => {
    const { error } = await supabase.from("fin_entries").update({ status: "pendente", paid_at: null }).eq("id", e.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const bulkCategory = async (categoryId: string) => {
    const { error } = await supabase.from("fin_entries").update({ category_id: categoryId }).in("id", [...selected]);
    if (error) return toast.error(error.message);
    toast.success("Categoria aplicada");
    refresh();
  };

  const exportCsv = () => {
    const rows = list.map((e) => [e.kind === "in" ? "Entrada" : "Saída", e.description, e.counterpart ?? "", cat(e.category_id)?.name ?? "", e.cost_center ?? "",
      acc(e.account_id)?.name ?? "", fmtD(e.competence_date), fmtD(e.due_date), fmtD(e.paid_at), e.status, (signed(e) / 100).toFixed(2).replace(".", ","), e.document ?? "", e.installment ?? ""]);
    const csv = [["tipo", "descrição", "cliente/fornecedor", "categoria", "centro de custo", "conta", "competência", "vencimento", "pagamento", "status", "valor", "documento", "parcela"], ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `financeiro-${pending ? preset : month}.csv`;
    a.click();
  };

  const title = preset === "pagar" ? "Contas a pagar" : preset === "receber" ? "Contas a receber" : "Lançamentos";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="eyebrow mb-2">Financeiro</div>
          <h1 className="font-display text-4xl">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {preset !== "pagar" && <button onClick={() => setEditing({ kind: "in" })} className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.12em]">+ Receita</button>}
          {preset !== "receber" && <button onClick={() => setEditing({ kind: "out" })} className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.12em]">+ Despesa</button>}
          {preset === "todos" && <button onClick={() => setImporting(true)} className="border border-border px-4 py-2 text-xs">Importar extrato (OFX)</button>}
          <button onClick={exportCsv} disabled={!list.length} className="border border-border px-4 py-2 text-xs disabled:opacity-40">Exportar CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Kpi label="Entradas" value={formatBRL(sumIn)} />
        <Kpi label="Saídas" value={formatBRL(sumOut)} />
        <Kpi label="Saldo" value={formatBRL(sumIn - sumOut)} tone={sumIn - sumOut < 0 ? "bad" : undefined} />
        <Kpi label="Atrasados" value={`${late.length} · ${formatBRL(late.reduce((s, e) => s + e.amount_cents, 0))}`} tone={late.length ? "bad" : undefined} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {!pending && (
          <div className="flex items-center border border-border">
            <button onClick={() => setMonth(addMonths(`${month}-01`, -1).slice(0, 7))} className="px-3 py-2 text-sm">‹</button>
            <span className="px-3 text-sm capitalize min-w-24 text-center">{monthLabel(month)}</span>
            <button onClick={() => setMonth(addMonths(`${month}-01`, 1).slice(0, 7))} className="px-3 py-2 text-sm">›</button>
          </div>
        )}
        {preset === "todos" && (
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
            <option value="">Entradas e saídas</option><option value="in">Entradas</option><option value="out">Saídas</option>
          </select>
        )}
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
          {!pending && <option value="">Todos os status</option>}
          <option value="abertos">Em aberto</option><option value="atrasados">Atrasados</option>
          {!pending && <><option value="pago">Pagos / recebidos</option><option value="cancelado">Cancelados</option><option value="sem_categoria">Sem categoria</option></>}
        </select>
        <select value={account} onChange={(e) => setAccount(e.target.value)} className={input}>
          <option value="">Todas as contas</option>{base?.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
          <option value="">Todas as categorias</option>{base?.categories.filter((c) => !kind || c.kind === kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={center} onChange={(e) => setCenter(e.target.value)} className={input}>
          <option value="">Centros de custo</option>{COST_CENTERS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className={`${input} w-48`} />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-xs border border-border p-2">
          <span>{selected.size} selecionado(s)</span>
          <button onClick={() => setPaying(list.filter((e) => selected.has(e.id) && e.status === "pendente"))} className="border border-border px-3 py-1.5">Baixar (pagar/receber)</button>
          <select defaultValue="" onChange={(e) => e.target.value && bulkCategory(e.target.value)} className="border border-border bg-background px-2 py-1.5">
            <option value="">Aplicar categoria…</option>{base?.categories.map((c) => <option key={c.id} value={c.id}>{c.kind === "in" ? "↑" : "↓"} {c.name}</option>)}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !list.length ? (
        <p className="text-sm text-muted-foreground border border-border p-6">Nenhum lançamento{pending ? " em aberto" : " neste mês"}.</p>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3 w-8"><input type="checkbox" checked={list.every((e) => selected.has(e.id))} onChange={(ev) => setSelected(ev.target.checked ? new Set(list.map((e) => e.id)) : new Set())} /></th>
                {["Vencimento", "Descrição", "Categoria", "Conta", "Valor", "Situação", ""].map((h, i) => <th key={i} className="p-3 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((e) => (
                <tr key={e.id} className={`align-top ${e.status === "cancelado" ? "opacity-50" : ""}`}>
                  <td className="p-3"><input type="checkbox" checked={selected.has(e.id)} onChange={(ev) => { const n = new Set(selected); if (ev.target.checked) n.add(e.id); else n.delete(e.id); setSelected(n); }} /></td>
                  <td className={`p-3 whitespace-nowrap ${isLate(e) ? "text-destructive" : ""}`}>{fmtD(e.due_date)}</td>
                  <td className="p-3">
                    <button onClick={() => setEditing(e)} className="text-left hover:underline font-medium">{e.description}</button>
                    {e.attachment_path && <Paperclip className="inline size-3 ml-1 text-muted-foreground" />}
                    <div className="text-xs text-muted-foreground">
                      {[e.counterpart, e.cost_center, e.installment && `parcela ${e.installment}`, e.source_ref?.startsWith("rec:") && "fixa/recorrente", e.source !== "manual" && SOURCE[e.source]].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="p-3 text-xs">{cat(e.category_id)?.name ?? <span className="text-destructive">sem categoria</span>}</td>
                  <td className="p-3 text-xs">{acc(e.account_id)?.name ?? "—"}</td>
                  <td className={`p-3 whitespace-nowrap font-medium ${e.kind === "in" ? "text-[color:var(--gold)]" : ""}`}>{e.kind === "in" ? "+" : "−"} {formatBRL(e.amount_cents)}</td>
                  <td className="p-3 text-xs whitespace-nowrap">
                    {e.status === "pago" ? <span>{e.kind === "in" ? "Recebido" : "Pago"} {fmtD(e.paid_at)}</span>
                      : e.status === "cancelado" ? "Cancelado"
                      : isLate(e) ? <span className="text-destructive">Atrasado</span> : "Em aberto"}
                  </td>
                  <td className="p-3 text-xs whitespace-nowrap">
                    {e.status === "pendente" && <button onClick={() => setPaying([e])} className="border border-foreground px-2 py-1">{e.kind === "in" ? "Receber" : "Pagar"}</button>}
                    {e.status === "pago" && <button onClick={() => reopen(e)} className="underline text-muted-foreground">desfazer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && base && <EntryForm entry={"id" in editing ? editing : null} kind={editing.kind as "in" | "out"} accounts={base.accounts} categories={base.categories}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} onRecurring={(k) => { setEditing(null); setRecurring(k); }} />}
      {recurring && base && <RecurrenceForm rec={null} kind={recurring} accounts={base.accounts} categories={base.categories}
        onClose={() => setRecurring(null)} onSaved={() => { setRecurring(null); refresh(); }} />}
      {paying && base && <PayDialog entries={paying} accounts={base.accounts} onClose={() => setPaying(null)} onDone={() => { setPaying(null); refresh(); }} />}
      {importing && base && <ImportOfx accounts={base.accounts} onClose={() => setImporting(false)} onDone={() => { setImporting(false); setStatus("sem_categoria"); refresh(); }} />}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "bad" }) {
  return <div className="bg-background p-5"><div className="eyebrow">{label}</div><div className={`font-display text-2xl mt-1 ${tone === "bad" ? "text-destructive" : ""}`}>{value}</div></div>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-background border border-border w-full ${wide ? "max-w-2xl" : "max-w-md"} p-6 max-h-[92vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-2xl mb-4">{title}</div>
        {children}
      </div>
    </div>
  );
}

const F = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={`block ${className}`}><span className="block text-xs text-muted-foreground mb-1">{label}</span>{children}</label>
);

function PayDialog({ entries, accounts, onClose, onDone }: { entries: FinEntry[]; accounts: FinAccount[]; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(today());
  const [account, setAccount] = useState(entries[0]?.account_id ?? accounts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const total = entries.reduce((s, e) => s + signed(e), 0);
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("fin_entries").update({ status: "pago", paid_at: date, account_id: account || null }).in("id", entries.map((e) => e.id));
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Baixa registrada");
    onDone();
  };
  return (
    <Modal title={entries.length === 1 ? (entries[0].kind === "in" ? "Registrar recebimento" : "Registrar pagamento") : `Baixar ${entries.length} lançamentos`} onClose={onClose}>
      <p className="text-sm mb-4">{entries.length === 1 ? entries[0].description : "Total"}: <b>{formatBRL(Math.abs(total))}</b></p>
      <div className="space-y-3">
        <F label="Data do pagamento"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} w-full`} /></F>
        <F label="Conta"><select value={account} onChange={(e) => setAccount(e.target.value)} className={`${input} w-full`}>{accounts.filter((a) => a.active).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></F>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
        <button onClick={save} disabled={busy || !date || !entries.length} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">Confirmar</button>
      </div>
    </Modal>
  );
}

function EntryForm({ entry: e, kind: initialKind, accounts, categories, onClose, onSaved, onRecurring }: {
  entry: FinEntry | null; kind: "in" | "out"; accounts: FinAccount[]; categories: FinCategory[]; onClose: () => void; onSaved: () => void; onRecurring: (k: "in" | "out") => void;
}) {
  const [kind, setKind] = useState<"in" | "out">(e?.kind as "in" | "out" ?? initialKind);
  const [paid, setPaid] = useState(e ? e.status === "pago" : false);
  const [repeat, setRepeat] = useState<"none" | "installments">("none");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const auto = e && e.source !== "manual" && e.source !== "importacao";

  const openAttachment = async () => {
    const { data, error } = await supabase.storage.from("finance").createSignedUrl(e!.attachment_path!, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const amount = parseBRLInput(s("amount"));
    if (!amount || Number.isNaN(amount)) return toast.error("Informe o valor");
    const times = repeat === "none" ? 1 : Math.max(2, Math.min(60, Number(s("times")) || 2));
    setBusy(true);
    try {
      let attachment_path = e?.attachment_path ?? null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Comprovante até 10 MB");
        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
        const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("finance").upload(path, file, { contentType: file.type || undefined });
        if (up.error) throw up.error;
        attachment_path = path;
      }
      const { data: u } = await supabase.auth.getUser();
      const baseRow = {
        kind, description: s("description"), account_id: s("account") || null, category_id: s("category") || null,
        cost_center: s("center") || null, counterpart: s("counterpart") || null, payment_method: s("method") || null,
        document: s("document") || null, notes: s("notes") || null, attachment_path,
      };
      const due = s("due"), comp = s("competence") || due;
      if (e) {
        const { error } = await supabase.from("fin_entries").update({
          ...baseRow, amount_cents: amount, due_date: due, competence_date: comp,
          status: paid ? "pago" : e.status === "cancelado" ? "cancelado" : "pendente", paid_at: paid ? s("paid_at") || today() : null,
        }).eq("id", e.id);
        if (error) throw error;
      } else {
        const rid = times > 1 ? crypto.randomUUID() : null;
        const per = Math.floor(amount / times);
        const rows = Array.from({ length: times }, (_, i) => ({
          ...baseRow,
          amount_cents: i === times - 1 ? amount - per * (times - 1) : per,
          due_date: addMonths(due, i), competence_date: addMonths(comp, i),
          status: paid && i === 0 ? "pago" : "pendente", paid_at: paid && i === 0 ? s("paid_at") || today() : null,
          recurrence_id: rid, installment: times > 1 ? `${i + 1}/${times}` : null, created_by: u.user?.id ?? null,
        }));
        const { error } = await supabase.from("fin_entries").insert(rows);
        if (error) throw error;
      }
      toast.success(times > 1 ? `${times} parcelas criadas` : "Lançamento salvo");
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!e) return;
    const others = e.recurrence_id ? await supabase.from("fin_entries").select("id").eq("recurrence_id", e.recurrence_id).eq("status", "pendente").gt("due_date", e.due_date) : null;
    const extra = others?.data?.length ?? 0;
    const all = extra > 0 && confirm(`Excluir também as ${extra} próximas parcelas/repetições em aberto?`);
    if (!all && !confirm("Excluir este lançamento?")) return;
    const ids = [e.id, ...(all ? others!.data!.map((x) => x.id) : [])];
    const { error } = await supabase.from("fin_entries").delete().in("id", ids);
    if (error) return toast.error(error.message);
    if (e.attachment_path) await supabase.storage.from("finance").remove([e.attachment_path]);
    toast.success("Excluído");
    onSaved();
  };

  const cancel = async () => {
    if (!e || !confirm("Cancelar este lançamento? Ele deixa de contar nos saldos e relatórios.")) return;
    const { error } = await supabase.from("fin_entries").update({ status: "cancelado", paid_at: null }).eq("id", e.id);
    if (error) return toast.error(error.message);
    onSaved();
  };

  return (
    <Modal title={e ? "Editar lançamento" : kind === "in" ? "Nova receita" : "Nova despesa"} onClose={onClose} wide>
      {auto && <p className="text-xs border border-border p-2 mb-3">Lançamento automático ({SOURCE[e!.source]}) — <SourceLink e={e!} />. Pode ajustar conta, categoria e dar baixa; valor e datas vêm da origem.</p>}
      <form onSubmit={submit} className="space-y-3">
        {!e && (
          <div className="flex border border-border w-fit">
            <button type="button" onClick={() => setKind("in")} className={`px-4 py-1.5 text-xs ${kind === "in" ? "bg-foreground text-background" : ""}`}>Receita</button>
            <button type="button" onClick={() => setKind("out")} className={`px-4 py-1.5 text-xs ${kind === "out" ? "bg-foreground text-background" : ""}`}>Despesa</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <F label="Descrição" className="col-span-2"><input name="description" required maxLength={200} defaultValue={e?.description} placeholder={kind === "in" ? "Ex.: Workshop presencial março" : "Ex.: Compra de essências — fornecedor X"} className={`${input} w-full`} /></F>
          <F label="Valor (R$)"><input name="amount" required inputMode="decimal" defaultValue={centsInput(e?.amount_cents)} readOnly={!!auto} className={`${input} w-full`} /></F>
          <F label={kind === "in" ? "Cliente" : "Fornecedor"}><input name="counterpart" maxLength={120} defaultValue={e?.counterpart ?? ""} className={`${input} w-full`} /></F>
          <F label="Vencimento"><input name="due" type="date" required defaultValue={e?.due_date ?? today()} readOnly={!!auto} className={`${input} w-full`} /></F>
          <F label="Competência (mês do DRE)"><input name="competence" type="date" defaultValue={e?.competence_date ?? ""} readOnly={!!auto} className={`${input} w-full`} /></F>
          <F label="Categoria">
            <select name="category" defaultValue={e?.category_id ?? ""} className={`${input} w-full`}>
              <option value="">Sem categoria</option>
              {categories.filter((c) => c.kind === kind && (c.active || c.id === e?.category_id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </F>
          <F label="Conta">
            <select name="account" defaultValue={e?.account_id ?? accounts.find((a) => a.system_key === "principal")?.id ?? ""} className={`${input} w-full`}>
              <option value="">—</option>{accounts.filter((a) => a.active || a.id === e?.account_id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </F>
          <F label="Centro de custo">
            <select name="center" defaultValue={e?.cost_center ?? ""} className={`${input} w-full`}><option value="">—</option>{COST_CENTERS.map((c) => <option key={c}>{c}</option>)}</select>
          </F>
          <F label="Forma de pagamento">
            <input name="method" list="fin-methods" maxLength={40} defaultValue={e?.payment_method ?? ""} className={`${input} w-full`} />
            <datalist id="fin-methods">{PAYMENT_METHODS.map((m) => <option key={m} value={m} />)}</datalist>
          </F>
          <F label="Documento / NF"><input name="document" maxLength={60} defaultValue={e?.document ?? ""} className={`${input} w-full`} /></F>
          <F label="Comprovante (PDF ou imagem)">
            <input type="file" accept="application/pdf,image/*" onChange={(ev) => setFile(ev.target.files?.[0] ?? null)} className="text-xs w-full" />
            {e?.attachment_path && !file && <button type="button" onClick={openAttachment} className="text-xs underline mt-1">Ver comprovante atual</button>}
          </F>
          <F label="Observações" className="col-span-2"><textarea name="notes" rows={2} maxLength={1000} defaultValue={e?.notes ?? ""} className={`${input} w-full`} /></F>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={paid} onChange={(ev) => setPaid(ev.target.checked)} /> Já {kind === "in" ? "recebido" : "pago"}</label>
          {paid && <input name="paid_at" type="date" defaultValue={e?.paid_at ?? today()} className={input} />}
          {!e && (
            <>
              <select value={repeat} onChange={(ev) => ev.target.value === "fixa" ? onRecurring(kind) : setRepeat(ev.target.value as typeof repeat)} className={input}>
                <option value="none">Lançamento único</option><option value="installments">Parcelar o valor</option><option value="fixa">{kind === "in" ? "Receita" : "Despesa"} fixa / recorrente…</option>
              </select>
              {repeat === "installments" && <label className="text-sm flex items-center gap-2"><input name="times" type="number" min={2} max={60} defaultValue={3} className={`${input} w-20`} /> parcelas</label>}
            </>
          )}
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <div className="flex gap-3 text-xs">
            {e && !auto && <button type="button" onClick={remove} className="text-destructive underline">Excluir</button>}
            {e && e.status !== "cancelado" && <button type="button" onClick={cancel} className="text-muted-foreground underline">Cancelar lançamento</button>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Fechar</button>
            <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Salvando…" : "Salvar"}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function ImportOfx({ accounts, onClose, onDone }: { accounts: FinAccount[]; onClose: () => void; onDone: () => void }) {
  const [account, setAccount] = useState(accounts.find((a) => a.system_key === "principal")?.id ?? accounts[0]?.id ?? "");
  const [rows, setRows] = useState<ReturnType<typeof parseOfx>>([]);
  const [busy, setBusy] = useState(false);
  const read = async (file: File | undefined) => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    // Bancos brasileiros costumam gerar OFX em Latin-1
    let text = new TextDecoder("utf-8").decode(buf);
    if (text.includes("�")) text = new TextDecoder("windows-1252").decode(buf);
    const parsed = parseOfx(text);
    if (!parsed.length) toast.error("Nenhuma transação encontrada no arquivo");
    setRows(parsed);
  };
  const save = async () => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error, count } = await supabase.from("fin_entries").upsert(rows.map((t) => ({
      kind: t.amountCents > 0 ? "in" : "out", description: t.memo, amount_cents: Math.abs(t.amountCents),
      competence_date: t.date, due_date: t.date, paid_at: t.date, status: "pago", account_id: account,
      source: "importacao", source_ref: `ofx:${account}:${t.fitid}`.slice(0, 200), created_by: u.user?.id ?? null,
    })), { onConflict: "source_ref", ignoreDuplicates: true, count: "exact" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${count ?? rows.length} lançamento(s) importado(s). Repetidos foram ignorados.`);
    onDone();
  };
  const sumIn = rows.filter((r) => r.amountCents > 0).reduce((s, r) => s + r.amountCents, 0);
  const sumOut = rows.filter((r) => r.amountCents < 0).reduce((s, r) => s - r.amountCents, 0);
  return (
    <Modal title="Importar extrato bancário" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">No internet banking, exporte o extrato no formato <b>OFX</b> (“Money”/“Quicken”). Os lançamentos entram como pagos, sem categoria, para você classificar. Importar o mesmo arquivo de novo não duplica.</p>
        <F label="Conta do extrato"><select value={account} onChange={(e) => setAccount(e.target.value)} className={`${input} w-full`}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></F>
        <input type="file" accept=".ofx,.OFX" onChange={(e) => read(e.target.files?.[0])} className="text-xs" />
        {rows.length > 0 && <p>{rows.length} transações · entradas {formatBRL(sumIn)} · saídas {formatBRL(sumOut)}</p>}
        <p className="text-xs text-muted-foreground">Vendas da loja já entram sozinhas na conta Mercado Pago/Stripe. Ao importar o extrato do banco, classifique os repasses do gateway na categoria “Transferência entre contas” para não contar a receita duas vezes.</p>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
        <button onClick={save} disabled={busy || !rows.length || !account} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Importando…" : "Importar"}</button>
      </div>
    </Modal>
  );
}

export function SourceLink({ e }: { e: FinEntry }) {
  if (e.source_ref?.startsWith("order:")) return <Link to="/ops/pedidos/$id" params={{ id: e.source_ref.slice(6) }} className="underline">ver pedido</Link>;
  if (e.source_ref?.startsWith("lead:")) return <Link to="/crm/leads/$id" params={{ id: e.source_ref.slice(5) }} className="underline">ver oportunidade</Link>;
  return null;
}
