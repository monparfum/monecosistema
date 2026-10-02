import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { centsInput, parseBRLInput } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — E-commerce" }] }),
  component: Config,
});

const input = "border border-border bg-background px-3 py-2 text-sm w-48";

function Config() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: c, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => (await supabase.from("company_settings").select("id, flat_shipping_cents, free_shipping_min_cents, low_stock_threshold").eq("singleton", true).maybeSingle()).data,
  });
  const [freeOn, setFreeOn] = useState<boolean | null>(null);
  const free = freeOn ?? c?.free_shipping_min_cents != null;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!c) return toast.error("Preencha primeiro Administração › Empresa");
    const f = new FormData(e.currentTarget);
    const flat = parseBRLInput(String(f.get("flat") ?? ""));
    const min = free ? parseBRLInput(String(f.get("free_min") ?? "")) : null;
    const low = Number(f.get("low"));
    if (flat == null || Number.isNaN(flat)) return toast.error("Frete padrão inválido");
    if (free && (min == null || Number.isNaN(min))) return toast.error("Informe o valor mínimo para frete grátis");
    if (!Number.isInteger(low) || low < 0 || low > 1000) return toast.error("Limite de estoque entre 0 e 1000");
    setBusy(true);
    const { error } = await supabase.from("company_settings").update({ flat_shipping_cents: flat, free_shipping_min_cents: min, low_stock_threshold: low }).eq("id", c.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    qc.invalidateQueries({ queryKey: ["store-settings"] });
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <div className="eyebrow mb-2">Loja</div>
        <h1 className="font-display text-4xl">Configurações</h1>
      </div>
      {!c ? (
        <p className="text-sm">Cadastre os dados da empresa primeiro em <Link to="/administracao/empresa" className="underline">Administração › Empresa</Link>.</p>
      ) : (
        <form key={`${c.flat_shipping_cents}-${c.free_shipping_min_cents}-${c.low_stock_threshold}`} onSubmit={submit} className="space-y-8">
          <section className="border border-border p-6 space-y-4">
            <div className="eyebrow">Frete</div>
            <label className="block">
              <span className="block text-sm mb-1">Frete padrão (R$)</span>
              <input name="flat" inputMode="decimal" defaultValue={centsInput(c.flat_shipping_cents)} className={input} />
              <span className="block text-xs text-muted-foreground mt-1">Cobrado enquanto o Melhor Envio não estiver conectado. Com ele, vale a cotação real das transportadoras.</span>
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={free} onChange={(e) => setFreeOn(e.target.checked)} /> Oferecer frete grátis acima de um valor</label>
            {free && (
              <label className="block">
                <span className="block text-sm mb-1">Frete grátis a partir de (R$)</span>
                <input name="free_min" inputMode="decimal" defaultValue={centsInput(c.free_shipping_min_cents ?? 35000)} className={input} />
                <span className="block text-xs text-muted-foreground mt-1">Zera a opção de frete mais barata quando os produtos somam esse valor.</span>
              </label>
            )}
          </section>
          <section className="border border-border p-6 space-y-2">
            <div className="eyebrow">Estoque</div>
            <label className="block">
              <span className="block text-sm mb-1">Avisar estoque baixo quando chegar a (unidades)</span>
              <input name="low" type="number" min={0} max={1000} defaultValue={c.low_stock_threshold} className={input} />
            </label>
          </section>
          <p className="text-xs text-muted-foreground">Chaves de pagamento, Melhor Envio e e-mail ficam em <Link to="/administracao/integracoes" className="underline">Administração › Integrações</Link>. Endereço de origem e CNPJ em <Link to="/administracao/empresa" className="underline">Administração › Empresa</Link>.</p>
          <button disabled={busy} className="bg-foreground text-background px-6 py-2.5 text-xs uppercase tracking-[0.15em] disabled:opacity-40">{busy ? "Salvando…" : "Salvar"}</button>
        </form>
      )}
    </div>
  );
}
