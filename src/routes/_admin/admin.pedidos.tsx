import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = ["pending_payment","paid","processing","shipped","delivered","cancelled"] as const;

export const Route = createFileRoute("/_admin/admin/pedidos")({ component: AdminOrders });

function AdminOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as typeof STATUSES[number] }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status atualizado"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow mb-2">Vendas</div>
        <h1 className="font-display text-4xl">Pedidos</h1>
      </div>
      <div className="border-y border-border divide-y divide-border">
        {data?.map((o) => (
          <div key={o.id} className="py-5 grid grid-cols-[1fr_auto_auto] gap-6 items-center">
            <div>
              <div className="eyebrow">{new Date(o.created_at).toLocaleString("pt-BR")}</div>
              <div className="font-display text-xl">{o.order_number}</div>
              <div className="text-sm text-muted-foreground">{o.email} · {o.shipping_recipient}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}
              </div>
            </div>
            <div className="font-display text-xl">{formatBRL(o.total_cents)}</div>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="border border-border bg-transparent px-2 py-1 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
