import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RecurrenceForm } from "@/components/finance/recurrence-form";
import { formatBRL } from "@/lib/format";
import { FREQUENCIES, fmtD, today, useFinanceBase, type FinRecurrence } from "@/lib/finance";

export const Route = createFileRoute("/_financeiro/financeiro/recorrencias")({
  head: () => ({ meta: [{ title: "Receitas e despesas fixas — Financeiro" }] }),
  component: Recorrencias,
});

function Recorrencias() {
  const qc = useQueryClient();
  const { data: base } = useFinanceBase();
  const [editing, setEditing] = useState<FinRecurrence | { kind: "in" | "out" } | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["fin-recurrences"],
    queryFn: async () => {
      const [recs, next] = await Promise.all([
        supabase.from("fin_recurrences").select("*").order("kind").order("description"),
        supabase.from("fin_entries").select("recurrence_id, due_date").eq("status", "pendente").not("recurrence_id", "is", null).gte("due_date", today()).order("due_date"),
      ]);
      if (recs.error) throw recs.error;
      const nextDue = new Map<string, string>();
      (next.data ?? []).forEach((e) => { if (!nextDue.has(e.recurrence_id!)) nextDue.set(e.recurrence_id!, e.due_date); });
      return { recs: recs.data, nextDue };
    },
  });
  const refresh = () => ["fin-recurrences", "fin-entries", "fin-all"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const ended = (r: FinRecurrence) => !!r.end_date && r.end_date < today();
  const running = (data?.recs ?? []).filter((r) => r.active && !ended(r));
  const monthly = (kind: string) => Math.round(running.filter((r) => r.kind === kind).reduce((s, r) => s + r.amount_cents * (FREQUENCIES[r.frequency]?.perMonth ?? 1), 0));
  const fixedIn = monthly("in"), fixedOut = monthly("out");
  const cat = (id: string | null) => base?.categories.find((c) => c.id === id)?.name;

  const pause = async (r: FinRecurrence) => {
    if (r.active) {
      if (!confirm(`Pausar "${r.description}"? Os lançamentos futuros em aberto serão removidos.`)) return;
      await supabase.from("fin_entries").delete().eq("recurrence_id", r.id).eq("status", "pendente").gte("due_date", today());
      await supabase.from("fin_recurrences").update({ active: false }).eq("id", r.id);
    } else {
      // Retoma a partir de hoje (não cria o período em que ficou pausada)
      const y = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      await supabase.from("fin_recurrences").update({ active: true, generated_until: y }).eq("id", r.id);
      await supabase.rpc("fin_generate_recurrences", { _months: 12 });
    }
    refresh();
  };

  const finish = async (r: FinRecurrence) => {
    const end = prompt("Encerrar em (AAAA-MM-DD). Lançamentos em aberto depois dessa data serão removidos:", today());
    if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return;
    const { error } = await supabase.from("fin_recurrences").update({ end_date: end < r.start_date ? r.start_date : end }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await supabase.from("fin_entries").delete().eq("recurrence_id", r.id).eq("status", "pendente").gt("due_date", end);
    toast.success("Recorrência encerrada");
    refresh();
  };

  const remove = async (r: FinRecurrence) => {
    if (!confirm(`Excluir "${r.description}"? Lançamentos já pagos ficam no histórico; os em aberto são removidos.`)) return;
    await supabase.from("fin_entries").delete().eq("recurrence_id", r.id).eq("status", "pendente");
    const { error } = await supabase.from("fin_recurrences").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const section = (kind: "in" | "out") => {
    const rows = (data?.recs ?? []).filter((r) => r.kind === kind);
    return (
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="font-display text-2xl">{kind === "in" ? "Receitas fixas" : "Despesas fixas"}</h2>
          <button onClick={() => setEditing({ kind })} className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.12em]">+ {kind === "in" ? "Receita fixa" : "Despesa fixa"}</button>
        </div>
        {!rows.length ? <p className="text-sm text-muted-foreground border border-border p-4">Nenhuma cadastrada.</p> : (
          <div className="border border-border divide-y divide-border">
            {rows.map((r) => {
              const status = !r.active ? "Pausada" : ended(r) ? "Encerrada" : "Ativa";
              return (
                <div key={r.id} className={`grid grid-cols-[1fr_auto_auto] gap-6 items-center p-3 text-sm ${status !== "Ativa" ? "opacity-60" : ""}`}>
                  <div>
                    <button onClick={() => setEditing(r)} className="font-medium hover:underline text-left">{r.description}</button>
                    <div className="text-xs text-muted-foreground">
                      {[FREQUENCIES[r.frequency]?.label, cat(r.category_id), r.counterpart, r.cost_center,
                        `desde ${fmtD(r.start_date)}`, r.end_date ? `até ${fmtD(r.end_date)}` : "sem término"].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-display text-xl ${kind === "in" ? "text-[color:var(--gold)]" : ""}`}>{formatBRL(r.amount_cents)}</div>
                    <div className="text-xs text-muted-foreground">{status}{status === "Ativa" && data?.nextDue.get(r.id) ? ` · próximo ${fmtD(data.nextDue.get(r.id)!)}` : ""}</div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => setEditing(r)} className="underline">editar</button>
                    {!ended(r) && <button onClick={() => pause(r)} className="underline">{r.active ? "pausar" : "retomar"}</button>}
                    {r.active && !ended(r) && <button onClick={() => finish(r)} className="underline">encerrar</button>}
                    <button onClick={() => remove(r)} className="underline text-destructive">excluir</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-10 max-w-[1100px]">
      <div>
        <div className="eyebrow mb-2">Financeiro</div>
        <h1 className="font-display text-4xl">Receitas e despesas fixas</h1>
        <p className="text-sm text-muted-foreground mt-1">Aluguel, salários, assinaturas, contratos mensais… Cadastre uma vez: os lançamentos dos próximos 12 meses são gerados e renovados sozinhos, prontos para dar baixa.</p>
      </div>
      <div className="grid grid-cols-3 gap-px bg-border border border-border">
        <Kpi label="Receitas fixas / mês" value={formatBRL(fixedIn)} />
        <Kpi label="Despesas fixas / mês" value={formatBRL(fixedOut)} hint="mínimo a faturar por mês para cobrir o fixo" />
        <Kpi label="Resultado fixo / mês" value={formatBRL(fixedIn - fixedOut)} bad={fixedIn - fixedOut < 0} />
      </div>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : <>{section("out")}{section("in")}</>}
      {editing && base && (
        <RecurrenceForm rec={"id" in editing ? editing : null} kind={editing.kind as "in" | "out"} accounts={base.accounts} categories={base.categories}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
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
