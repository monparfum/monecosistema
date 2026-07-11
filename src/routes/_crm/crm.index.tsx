import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_crm/crm/")({
  head: () => ({ meta: [{ title: "CRM — Mon Parfum" }] }),
  component: CrmDashboard,
});

function CrmDashboard() {
  const { data } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: async () => {
      const [profiles, orders] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("user_id, total_cents, status, created_at"),
      ]);
      const rows = orders.data ?? [];
      const paid = rows.filter((o) => o.status !== "cancelled" && o.status !== "pending_payment");
      const totals = new Map<string, number>();
      paid.forEach((o) => { if (o.user_id) totals.set(o.user_id, (totals.get(o.user_id) ?? 0) + o.total_cents); });
      const ltvAvg = totals.size ? Array.from(totals.values()).reduce((s, v) => s + v, 0) / totals.size : 0;
      return {
        clientes: profiles.count ?? 0,
        compradores: totals.size,
        ltv: ltvAvg,
        vip: Array.from(totals.values()).filter((v) => v >= 100_000).length,
      };
    },
  });

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · CRM"
        title="Relacionamento"
        description="Toda compra realizada no Commerce atualiza automaticamente a ficha do cliente."
      />
      <StatGrid>
        <StatCard label="Cadastros" value={data?.clientes ?? "—"} />
        <StatCard label="Compradores" value={data?.compradores ?? "—"} />
        <StatCard label="LTV médio" value={data ? formatBRL(data.ltv) : "—"} />
        <StatCard label="Clientes VIP" value={data?.vip ?? "—"} hint="LTV ≥ R$ 1.000" />
      </StatGrid>
    </div>
  );
}
