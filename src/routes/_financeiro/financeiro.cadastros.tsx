import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { centsInput, formatBRL, parseBRLInput } from "@/lib/format";
import { ACCOUNT_KINDS, DRE_GROUPS, balances, fmtD, today, useAllEntries, useFinanceBase, type FinAccount, type FinCategory } from "@/lib/finance";

export const Route = createFileRoute("/_financeiro/financeiro/cadastros")({
  head: () => ({ meta: [{ title: "Contas e categorias — Financeiro" }] }),
  component: Cadastros,
});

const input = "border border-border bg-background px-3 py-2 text-sm";
const GROUP_LABEL: Record<string, string> = { ...Object.fromEntries(DRE_GROUPS.map((g) => [g.id, g.label])), transferencia: "Transferência (fora do DRE)" };

function Cadastros() {
  const qc = useQueryClient();
  const { data: base } = useFinanceBase();
  const { data: entries = [] } = useAllEntries();
  const [acc, setAcc] = useState<FinAccount | "new" | null>(null);
  const [cat, setCat] = useState<FinCategory | "new" | null>(null);
  const refresh = () => ["fin-base", "fin-all"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const accs = base ? balances(base.accounts, entries) : [];
  const usage = (catId: string) => entries.filter((e) => e.category_id === catId).length;

  return (
    <div className="space-y-12 max-w-[1100px]">
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div><div className="eyebrow mb-2">Financeiro</div><h1 className="font-display text-4xl">Contas</h1>
            <p className="text-sm text-muted-foreground mt-1">Bancos, caixa, gateways e cartões. O saldo inicial é o valor na data de início do controle.</p></div>
          <button onClick={() => setAcc("new")} className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.12em]">+ Conta</button>
        </div>
        <div className="border border-border divide-y divide-border">
          {accs.map((a) => (
            <div key={a.id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-6 items-center p-3 text-sm ${a.active ? "" : "opacity-50"}`}>
              <div><b>{a.name}</b><div className="text-xs text-muted-foreground">{ACCOUNT_KINDS[a.kind]} · início {fmtD(a.initial_date)} com {formatBRL(a.initial_balance_cents)}{a.system_key && " · usada pelas integrações"}</div></div>
              <div className="text-xs text-muted-foreground">saldo atual</div>
              <div className={`font-display text-xl ${a.balance < 0 ? "text-destructive" : ""}`}>{formatBRL(a.balance)}</div>
              <button onClick={() => setAcc(a)} className="text-xs underline">editar</button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div><h2 className="font-display text-3xl">Plano de contas</h2>
            <p className="text-sm text-muted-foreground mt-1">Cada categoria pertence a uma linha do DRE.</p></div>
          <button onClick={() => setCat("new")} className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.12em]">+ Categoria</button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {(["in", "out"] as const).map((k) => (
            <div key={k} className="border border-border">
              <div className="eyebrow p-3 border-b border-border">{k === "in" ? "Receitas" : "Despesas"}</div>
              <div className="divide-y divide-border">
                {(base?.categories ?? []).filter((c) => c.kind === k).sort((a, b) => a.dre_group.localeCompare(b.dre_group) || a.name.localeCompare(b.name)).map((c) => (
                  <button key={c.id} onClick={() => setCat(c)} className={`w-full text-left p-3 text-sm flex justify-between gap-3 hover:bg-[color:var(--muted)]/30 ${c.active ? "" : "opacity-50"}`}>
                    <span>{c.name}<span className="block text-xs text-muted-foreground">{GROUP_LABEL[c.dre_group]}</span></span>
                    <span className="text-xs text-muted-foreground shrink-0">{usage(c.id)} lanç.</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {acc && <AccountForm a={acc === "new" ? null : acc} onClose={() => setAcc(null)} onSaved={() => { setAcc(null); refresh(); }} />}
      {cat && <CategoryForm c={cat === "new" ? null : cat} used={cat === "new" ? 0 : usage(cat.id)} onClose={() => setCat(null)} onSaved={() => { setCat(null); refresh(); }} />}
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-2xl mb-4">{title}</div>{children}
      </div>
    </div>
  );
}

function AccountForm({ a, onClose, onSaved }: { a: FinAccount | null; onClose: () => void; onSaved: () => void }) {
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const raw = String(f.get("initial") ?? "").trim();
    const neg = raw.startsWith("-");
    const v = parseBRLInput(raw.replace(/^-/, "")) ?? 0;
    if (Number.isNaN(v)) return toast.error("Saldo inicial inválido");
    const row = { name: String(f.get("name")).trim(), kind: String(f.get("kind")), initial_balance_cents: neg ? -v : v, initial_date: String(f.get("date")), active: f.get("active") === "on" };
    const { error } = a ? await supabase.from("fin_accounts").update(row).eq("id", a.id) : await supabase.from("fin_accounts").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Conta salva");
    onSaved();
  };
  return (
    <Dialog title={a ? "Editar conta" : "Nova conta"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input name="name" required maxLength={80} defaultValue={a?.name} placeholder="Ex.: Itaú PJ" className={`${input} w-full`} />
        <select name="kind" defaultValue={a?.kind ?? "banco"} className={`${input} w-full`}>{Object.entries(ACCOUNT_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground">Saldo inicial (R$)<input name="initial" defaultValue={a ? (a.initial_balance_cents < 0 ? "-" : "") + centsInput(Math.abs(a.initial_balance_cents)) : "0,00"} className={`${input} w-full mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Na data<input name="date" type="date" required defaultValue={a?.initial_date ?? today()} className={`${input} w-full mt-1`} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={a?.active ?? true} /> Ativa</label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
          <button className="bg-foreground text-background px-5 py-2 text-xs">Salvar</button>
        </div>
      </form>
    </Dialog>
  );
}

function CategoryForm({ c, used, onClose, onSaved }: { c: FinCategory | null; used: number; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"in" | "out">((c?.kind as "in" | "out") ?? "out");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const row = { name: String(f.get("name")).trim(), kind, dre_group: String(f.get("group")), active: f.get("active") === "on" };
    const { error } = c ? await supabase.from("fin_categories").update(row).eq("id", c.id) : await supabase.from("fin_categories").insert(row);
    if (error) return toast.error(error.code === "23505" ? "Já existe uma categoria com esse nome" : error.message);
    toast.success("Categoria salva");
    onSaved();
  };
  const remove = async () => {
    if (!c || !confirm(used ? `${used} lançamento(s) ficarão sem categoria. Excluir mesmo assim? (Você pode só desativar.)` : "Excluir categoria?")) return;
    const { error } = await supabase.from("fin_categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    onSaved();
  };
  const groups = [...DRE_GROUPS.filter((g) => g.kind === kind || g.id === "nao_operacional"), { id: "transferencia", label: "Transferência (fora do DRE)", kind }];
  return (
    <Dialog title={c ? "Editar categoria" : "Nova categoria"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex border border-border w-fit">
          {(["in", "out"] as const).map((k) => <button key={k} type="button" disabled={!!c?.system_key} onClick={() => setKind(k)} className={`px-4 py-1.5 text-xs ${kind === k ? "bg-foreground text-background" : ""}`}>{k === "in" ? "Receita" : "Despesa"}</button>)}
        </div>
        <input name="name" required maxLength={80} defaultValue={c?.name} placeholder="Nome da categoria" className={`${input} w-full`} />
        <select key={kind} name="group" defaultValue={c?.kind === kind ? c.dre_group : groups[0].id} className={`${input} w-full`}>
          {groups.map((g) => <option key={g.id} value={g.id}>{GROUP_LABEL[g.id]}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Ativa</label>
        <div className="flex justify-between gap-2 pt-2">
          {c && !c.system_key ? <button type="button" onClick={remove} className="text-xs text-destructive underline">Excluir</button> : <span className="text-xs text-muted-foreground">{c?.system_key ? "Usada pelas integrações" : ""}</span>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
            <button className="bg-foreground text-background px-5 py-2 text-xs">Salvar</button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
