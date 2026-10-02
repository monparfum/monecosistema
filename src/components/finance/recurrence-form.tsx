import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { centsInput, parseBRLInput } from "@/lib/format";
import { COST_CENTERS, FREQUENCIES, PAYMENT_METHODS, today, type FinAccount, type FinCategory, type FinRecurrence } from "@/lib/finance";

const input = "border border-border bg-background px-3 py-2 text-sm w-full";
const F = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={`block ${className}`}><span className="block text-xs text-muted-foreground mb-1">{label}</span>{children}</label>
);

// Cadastro de receita/despesa fixa. Gera os lançamentos dos próximos 12 meses (e renova sozinho).
export function RecurrenceForm({ rec, kind: initialKind, accounts, categories, onClose, onSaved }: {
  rec: FinRecurrence | null; kind: "in" | "out"; accounts: FinAccount[]; categories: FinCategory[]; onClose: () => void; onSaved: () => void;
}) {
  const [kind, setKind] = useState<"in" | "out">((rec?.kind as "in" | "out") ?? initialKind);
  const [hasEnd, setHasEnd] = useState(!!rec?.end_date);
  const [applyFuture, setApplyFuture] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const amount = parseBRLInput(s("amount"));
    if (!amount || Number.isNaN(amount)) return toast.error("Informe o valor");
    const end = hasEnd ? s("end") || null : null;
    const common = {
      description: s("description"), amount_cents: amount, account_id: s("account") || null, category_id: s("category") || null,
      cost_center: s("center") || null, counterpart: s("counterpart") || null, payment_method: s("method") || null, notes: s("notes") || null,
    };
    setBusy(true);
    try {
      if (rec) {
        const { error } = await supabase.from("fin_recurrences").update({ ...common, end_date: end }).eq("id", rec.id);
        if (error) throw error;
        const from = today();
        if (applyFuture) {
          const { error: e2 } = await supabase.from("fin_entries").update(common).eq("recurrence_id", rec.id).eq("status", "pendente").gte("due_date", from);
          if (e2) throw e2;
        }
        if (end) await supabase.from("fin_entries").delete().eq("recurrence_id", rec.id).eq("status", "pendente").gt("due_date", end);
      } else {
        const start = s("start");
        if (end && end < start) throw new Error("O término deve ser depois do início");
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("fin_recurrences").insert({ ...common, kind, frequency: s("frequency"), start_date: start, end_date: end, created_by: u.user?.id ?? null });
        if (error) throw error;
      }
      const { data: n, error: gen } = await supabase.rpc("fin_generate_recurrences", { _months: 12 });
      if (gen) throw gen;
      toast.success(rec ? "Recorrência atualizada" : `Recorrência criada · ${n ?? 0} lançamento(s) gerado(s)`);
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-2xl mb-4">{rec ? "Editar recorrência" : kind === "in" ? "Nova receita fixa" : "Nova despesa fixa"}</div>
        <form onSubmit={submit} className="space-y-3">
          {!rec && (
            <div className="flex border border-border w-fit">
              <button type="button" onClick={() => setKind("in")} className={`px-4 py-1.5 text-xs ${kind === "in" ? "bg-foreground text-background" : ""}`}>Receita</button>
              <button type="button" onClick={() => setKind("out")} className={`px-4 py-1.5 text-xs ${kind === "out" ? "bg-foreground text-background" : ""}`}>Despesa</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <F label="Descrição" className="col-span-2">
              <input name="description" required maxLength={200} defaultValue={rec?.description}
                placeholder={kind === "in" ? "Ex.: Mensalidade MON Club — empresa X" : "Ex.: Aluguel do ateliê"} className={input} />
            </F>
            <F label="Valor (R$)"><input name="amount" required inputMode="decimal" defaultValue={centsInput(rec?.amount_cents)} className={input} /></F>
            <F label="Frequência">
              <select name="frequency" defaultValue={rec?.frequency ?? "monthly"} disabled={!!rec} className={input}>
                {Object.entries(FREQUENCIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </F>
            <F label="Primeiro vencimento"><input name="start" type="date" required defaultValue={rec?.start_date ?? today()} disabled={!!rec} className={input} /></F>
            <F label="Término">
              <div className="flex gap-2 items-center">
                <select value={hasEnd ? "sim" : "nao"} onChange={(e) => setHasEnd(e.target.value === "sim")} className={input}>
                  <option value="nao">Sem data de término</option><option value="sim">Termina em…</option>
                </select>
                {hasEnd && <input name="end" type="date" required defaultValue={rec?.end_date ?? ""} className={input} />}
              </div>
            </F>
            <F label="Categoria">
              <select name="category" defaultValue={rec?.category_id ?? ""} className={input}>
                <option value="">Sem categoria</option>{categories.filter((c) => c.kind === kind && (c.active || c.id === rec?.category_id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </F>
            <F label="Conta">
              <select name="account" defaultValue={rec?.account_id ?? accounts.find((a) => a.system_key === "principal")?.id ?? ""} className={input}>
                <option value="">—</option>{accounts.filter((a) => a.active || a.id === rec?.account_id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </F>
            <F label="Centro de custo"><select name="center" defaultValue={rec?.cost_center ?? ""} className={input}><option value="">—</option>{COST_CENTERS.map((c) => <option key={c}>{c}</option>)}</select></F>
            <F label={kind === "in" ? "Cliente" : "Fornecedor"}><input name="counterpart" maxLength={120} defaultValue={rec?.counterpart ?? ""} className={input} /></F>
            <F label="Forma de pagamento">
              <input name="method" list="rec-methods" maxLength={40} defaultValue={rec?.payment_method ?? ""} className={input} />
              <datalist id="rec-methods">{PAYMENT_METHODS.map((m) => <option key={m} value={m} />)}</datalist>
            </F>
            <F label="Observações" className="col-span-2"><textarea name="notes" rows={2} maxLength={1000} defaultValue={rec?.notes ?? ""} className={input} /></F>
          </div>
          {rec && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={applyFuture} onChange={(e) => setApplyFuture(e.target.checked)} /> Aplicar as mudanças aos lançamentos futuros em aberto</label>}
          {rec && <p className="text-xs text-muted-foreground">Para mudar a frequência ou a data de início, encerre esta recorrência e crie outra.</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
            <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Salvando…" : "Salvar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
