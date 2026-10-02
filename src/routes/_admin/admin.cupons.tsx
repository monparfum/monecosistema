import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { centsInput, formatBRL, PAID_STATUSES, parseBRLInput } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — E-commerce" }] }),
  component: Cupons,
});

type Coupon = Tables<"coupons">;
const input = "border border-border bg-background px-3 py-2 text-sm w-full";
const KIND: Record<string, string> = { percent: "% de desconto", fixed: "R$ de desconto", free_shipping: "Frete grátis" };

const describe = (c: Coupon) =>
  c.kind === "percent" ? `${c.value}% off` : c.kind === "fixed" ? `${formatBRL(c.value)} off` : "Frete grátis";

function statusOf(c: Coupon, uses: number) {
  const now = new Date().toISOString();
  if (!c.active) return ["Pausado", "text-muted-foreground"];
  if (c.ends_at && c.ends_at < now) return ["Expirado", "text-muted-foreground"];
  if (c.starts_at && c.starts_at > now) return ["Agendado", "text-[color:var(--gold)]"];
  if (c.max_uses && uses >= c.max_uses) return ["Esgotado", "text-muted-foreground"];
  return ["Ativo", "text-[color:var(--gold)]"];
}

function Cupons() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const [coupons, orders] = await Promise.all([
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("coupon_code, status, total_cents, discount_cents").not("coupon_code", "is", null),
      ]);
      if (coupons.error) throw coupons.error;
      const stats = new Map<string, { uses: number; paid: number; revenue: number; discount: number }>();
      (orders.data ?? []).filter((o) => o.status !== "cancelled").forEach((o) => {
        const s = stats.get(o.coupon_code!) ?? { uses: 0, paid: 0, revenue: 0, discount: 0 };
        s.uses++;
        if (PAID_STATUSES.includes(o.status)) { s.paid++; s.revenue += o.total_cents; s.discount += o.discount_cents; }
        stats.set(o.coupon_code!, s);
      });
      return { coupons: coupons.data, stats };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="eyebrow mb-2">Promoções</div>
          <h1 className="font-display text-4xl">Cupons</h1>
          <p className="text-sm text-muted-foreground mt-1">O cliente digita o código no checkout. Validade, limite de usos e valor mínimo são conferidos no servidor.</p>
        </div>
        <button onClick={() => setEditing("new")} className="bg-foreground text-background px-5 py-2 text-xs uppercase tracking-[0.15em]">+ Novo cupom</button>
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !data?.coupons.length ? (
        <p className="text-sm text-muted-foreground border border-border p-6">Nenhum cupom ainda. Ex.: BEMVINDO10 (10% na primeira compra), FRETEGRATIS, MONCLUB50.</p>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr>{["Código", "Benefício", "Regras", "Usos", "Vendas pagas", "Status", ""].map((h, i) => <th key={i} className="p-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.coupons.map((c) => {
                const st = data.stats.get(c.code) ?? { uses: 0, paid: 0, revenue: 0, discount: 0 };
                const [label, cls] = statusOf(c, st.uses);
                return (
                  <tr key={c.id} className="align-top">
                    <td className="p-3"><div className="font-mono font-medium">{c.code}</div>{c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}</td>
                    <td className="p-3">{describe(c)}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {c.min_subtotal_cents > 0 && <div>Mínimo {formatBRL(c.min_subtotal_cents)}</div>}
                      {c.once_per_customer && <div>1 vez por cliente</div>}
                      {(c.starts_at || c.ends_at) && <div>{c.starts_at ? new Date(c.starts_at).toLocaleDateString("pt-BR") : "…"} até {c.ends_at ? new Date(c.ends_at).toLocaleDateString("pt-BR") : "…"}</div>}
                    </td>
                    <td className="p-3">{st.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                    <td className="p-3 text-xs">{st.paid} · {formatBRL(st.revenue)}<div className="text-muted-foreground">desconto {formatBRL(st.discount)}</div></td>
                    <td className={`p-3 ${cls}`}>{label}</td>
                    <td className="p-3 text-xs whitespace-nowrap">
                      <button onClick={() => setEditing(c)} className="underline mr-3">editar</button>
                      <button onClick={async () => { await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id); refresh(); }} className="underline">{c.active ? "pausar" : "ativar"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CouponForm coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

function CouponForm({ coupon: c, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState(c?.kind ?? "percent");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const code = s("code").toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return toast.error("Código: 3 a 30 letras, números, - ou _");
    let value = 0;
    if (kind === "percent") { value = Number(s("value")); if (!Number.isInteger(value) || value < 1 || value > 100) return toast.error("Percentual entre 1 e 100"); }
    if (kind === "fixed") { const v = parseBRLInput(s("value")); if (!v || Number.isNaN(v)) return toast.error("Valor do desconto inválido"); value = v; }
    const min = parseBRLInput(s("min"));
    if (Number.isNaN(min)) return toast.error("Valor mínimo inválido");
    const row = {
      code, kind, value, description: s("description") || null, min_subtotal_cents: min ?? 0,
      max_uses: s("max_uses") ? Number(s("max_uses")) : null, once_per_customer: f.get("once") === "on",
      starts_at: s("starts") ? new Date(s("starts") + "T00:00:00").toISOString() : null,
      ends_at: s("ends") ? new Date(s("ends") + "T23:59:59").toISOString() : null,
      active: f.get("active") === "on",
    };
    setBusy(true);
    const { error } = c ? await supabase.from("coupons").update(row).eq("id", c.id) : await supabase.from("coupons").insert(row);
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "Já existe um cupom com esse código" : error.message);
    toast.success("Cupom salvo");
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-background border border-border w-full max-w-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="font-display text-2xl mb-2">{c ? `Editar ${c.code}` : "Novo cupom"}</div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Código"><input name="code" required defaultValue={c?.code} placeholder="BEMVINDO10" className={`${input} uppercase font-mono`} /></F>
          <F label="Tipo">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={input}>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </F>
          {kind !== "free_shipping" && (
            <F label={kind === "percent" ? "Desconto (%)" : "Desconto (R$)"}>
              <input name="value" required inputMode="decimal" defaultValue={c ? (c.kind === "fixed" ? centsInput(c.value) : c.value || "") : ""} className={input} />
            </F>
          )}
          <F label="Compra mínima (R$)"><input name="min" inputMode="decimal" defaultValue={c?.min_subtotal_cents ? centsInput(c.min_subtotal_cents) : ""} placeholder="sem mínimo" className={input} /></F>
          <F label="Limite total de usos"><input name="max_uses" type="number" min={1} defaultValue={c?.max_uses ?? ""} placeholder="ilimitado" className={input} /></F>
          <F label="Começa em"><input name="starts" type="date" defaultValue={toDateInput(c?.starts_at ?? null)} className={input} /></F>
          <F label="Termina em"><input name="ends" type="date" defaultValue={toDateInput(c?.ends_at ?? null)} className={input} /></F>
        </div>
        <F label="Descrição interna"><input name="description" maxLength={200} defaultValue={c?.description ?? ""} placeholder="Ex.: campanha Dia das Mães" className={input} /></F>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="once" defaultChecked={c?.once_per_customer ?? true} /> Cada cliente usa só uma vez</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Ativo</label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
          <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">Salvar</button>
        </div>
      </form>
    </div>
  );
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="block text-xs text-muted-foreground mb-1">{label}</span>{children}</label>
);
