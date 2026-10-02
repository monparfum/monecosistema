import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/admin/estoque")({
  head: () => ({ meta: [{ title: "Estoque — E-commerce" }] }),
  component: Estoque,
});

const input = "border border-border bg-background px-3 py-2 text-sm";
const REASON: Record<string, string> = { initial: "Cadastro", adjust: "Ajuste manual", sale: "Venda", cancel: "Cancelamento (devolvido)" };

function Estoque() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stock"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [products, company, sales] = await Promise.all([
        supabase.from("products").select("id, name, brand, stock, active, coming_soon, delivery_type, image_url").neq("delivery_type", "digital").order("name"),
        supabase.from("company_settings").select("low_stock_threshold").eq("singleton", true).maybeSingle(),
        supabase.from("stock_movements").select("product_id, delta").eq("reason", "sale").gte("created_at", since),
      ]);
      if (products.error) throw products.error;
      const sold = new Map<string, number>();
      (sales.data ?? []).forEach((m) => sold.set(m.product_id, (sold.get(m.product_id) ?? 0) - m.delta));
      return { products: products.data, low: company.data?.low_stock_threshold ?? 5, sold };
    },
  });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.products ?? []).filter((p) => (!onlyLow || p.stock <= data!.low) && (!term || p.name.toLowerCase().includes(term)));
  }, [data, q, onlyLow]);

  const totals = useMemo(() => {
    const ps = (data?.products ?? []).filter((p) => p.active && !p.coming_soon);
    return { units: ps.reduce((s, p) => s + p.stock, 0), out: ps.filter((p) => p.stock === 0).length, low: ps.filter((p) => p.stock > 0 && p.stock <= (data?.low ?? 5)).length };
  }, [data]);

  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow mb-2">Produtos físicos e híbridos</div>
        <h1 className="font-display text-4xl">Estoque</h1>
        <p className="text-sm text-muted-foreground mt-1">Vendas baixam o estoque sozinhas e cancelamentos devolvem. Use o ajuste para entradas (reposição) e perdas, sempre com um motivo.</p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border border border-border">
        <Kpi label="Unidades em estoque" value={totals.units} />
        <Kpi label={`Estoque baixo (≤ ${data?.low ?? 5})`} value={totals.low} alert={totals.low > 0} />
        <Kpi label="Esgotados" value={totals.out} alert={totals.out > 0} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto…" className={`${input} w-72`} />
        <label className="flex items-center gap-2 text-sm px-2"><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Só baixos/esgotados</label>
        <Link to="/admin/configuracoes" className="ml-auto text-xs underline text-muted-foreground">Alterar limite de estoque baixo</Link>
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : (
        <div className="border border-border divide-y divide-border">
          {list.map((p) => {
            const sold30 = data!.sold.get(p.id) ?? 0;
            const days = sold30 > 0 ? Math.floor(p.stock / (sold30 / 30)) : null;
            return (
              <div key={p.id}>
                <div className="grid grid-cols-[48px_1fr_110px_150px_auto] gap-4 items-center p-3 text-sm">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-12 h-12 object-cover" /> : <div className="w-12 h-12 bg-[color:var(--muted)]" />}
                  <div>
                    <Link to="/admin/produtos/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.name}</Link>
                    <div className="text-xs text-muted-foreground">{p.delivery_type === "hybrid" ? "Híbrido (kit + curso)" : "Físico"}{!p.active ? " · inativo" : p.coming_soon ? " · em breve" : ""}</div>
                  </div>
                  <div className={`font-display text-2xl ${p.stock === 0 ? "text-destructive" : p.stock <= data!.low ? "text-[color:var(--gold)]" : ""}`}>{p.stock}<span className="text-xs text-muted-foreground font-sans"> un.</span></div>
                  <div className="text-xs text-muted-foreground">{sold30} vendidos em 30 dias{days != null && <div>dura ~{days} dias</div>}</div>
                  <button onClick={() => setOpen(open === p.id ? null : p.id)} className="border border-border px-3 py-1.5 text-xs">{open === p.id ? "Fechar" : "Ajustar / histórico"}</button>
                </div>
                {open === p.id && <Adjust productId={p.id} onDone={() => qc.invalidateQueries({ queryKey: ["admin-stock"] })} />}
              </div>
            );
          })}
          {!list.length && <p className="p-4 text-sm text-muted-foreground">Nenhum produto.</p>}
        </div>
      )}
    </div>
  );
}

function Adjust({ productId, onDone }: { productId: string; onDone: () => void }) {
  const [mode, setMode] = useState<"in" | "out">("in");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: moves = [], refetch } = useQuery({
    queryKey: ["stock-moves", productId],
    queryFn: async () => (await supabase.from("stock_movements").select("id, delta, stock_after, reason, note, created_at, order_id").eq("product_id", productId).order("created_at", { ascending: false }).limit(30)).data ?? [],
  });
  const save = async () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return toast.error("Informe uma quantidade");
    if (!note.trim()) return toast.error("Informe o motivo");
    setBusy(true);
    const { error } = await supabase.rpc("adjust_stock", { _product_id: productId, _delta: mode === "in" ? n : -n, _note: note.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Estoque atualizado");
    setQty(""); setNote("");
    refetch(); onDone();
  };
  return (
    <div className="bg-[color:var(--muted)]/20 border-t border-border p-4 grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <div className="flex border border-border w-fit">
          <button onClick={() => setMode("in")} className={`px-3 py-1.5 text-xs ${mode === "in" ? "bg-foreground text-background" : ""}`}>Entrada</button>
          <button onClick={() => setMode("out")} className={`px-3 py-1.5 text-xs ${mode === "out" ? "bg-foreground text-background" : ""}`}>Saída / perda</button>
        </div>
        <div className="flex gap-2">
          <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} placeholder="Qtd." className={`${input} w-24`} />
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} list="stock-reasons" placeholder={mode === "in" ? "Ex.: reposição do fornecedor" : "Ex.: frasco quebrado"} className={`${input} flex-1`} />
          <datalist id="stock-reasons">{["Reposição do fornecedor", "Produção própria", "Contagem de inventário", "Avaria / quebra", "Uso em evento", "Brinde"].map((r) => <option key={r} value={r} />)}</datalist>
          <button onClick={save} disabled={busy} className="bg-foreground text-background px-4 text-xs disabled:opacity-40">Salvar</button>
        </div>
      </div>
      <div className="text-xs max-h-56 overflow-y-auto">
        <div className="eyebrow mb-2">Histórico</div>
        {moves.map((m) => (
          <div key={m.id} className="flex justify-between gap-3 py-1 border-b border-border">
            <span>{new Date(m.created_at).toLocaleString("pt-BR")} · {REASON[m.reason] ?? m.reason}{m.note ? ` · ${m.note}` : ""}</span>
            <span className={m.delta > 0 ? "text-[color:var(--gold)]" : ""}>{m.delta > 0 ? "+" : ""}{m.delta} → {m.stock_after}</span>
          </div>
        ))}
        {!moves.length && <p className="text-muted-foreground">Sem movimentações.</p>}
      </div>
    </div>
  );
}

function Kpi({ label, value, alert }: { label: string; value: React.ReactNode; alert?: boolean }) {
  return <div className="bg-background p-6"><div className="eyebrow">{label}</div><div className={`font-display text-3xl mt-2 ${alert ? "text-destructive" : ""}`}>{value}</div></div>;
}
