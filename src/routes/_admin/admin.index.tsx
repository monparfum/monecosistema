import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, customers] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_cents, status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const revenue = (orders.data ?? []).filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_cents, 0);
      return {
        products: products.count ?? 0,
        orders: orders.data?.length ?? 0,
        customers: customers.count ?? 0,
        revenue,
      };
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <div className="eyebrow mb-2">Painel</div>
        <h1 className="font-display text-4xl">Visão geral</h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {[
          ["Produtos", data?.products ?? "—"],
          ["Pedidos", data?.orders ?? "—"],
          ["Clientes", data?.customers ?? "—"],
          ["Receita", data ? formatBRL(data.revenue) : "—"],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-background p-6">
            <div className="eyebrow">{label}</div>
            <div className="font-display text-3xl mt-2">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
