import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { SkeletonRow } from "@/components/skeleton-row";
import { EmptyState } from "@/components/empty-state";
import { formatBRL } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/_crm/crm/clientes")({
  head: () => ({ meta: [{ title: "Clientes — CRM" }] }),
  component: CrmClientes,
});

function CrmClientes() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["crm-clientes"],
    queryFn: async () => {
      const [profiles, orders] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at"),
        supabase.from("orders").select("user_id, total_cents, status, email, created_at"),
      ]);
      const os = orders.data ?? [];
      return (profiles.data ?? []).map((p) => {
        const own = os.filter((o) => o.user_id === p.id);
        const paid = own.filter((o) => o.status !== "cancelled" && o.status !== "pending_payment");
        const ltv = paid.reduce((s, o) => s + o.total_cents, 0);
        const last = own[0]?.created_at ?? null;
        const email = own[0]?.email ?? "";
        return { id: p.id, name: p.full_name || "—", email, phone: p.phone, ltv, orders: own.length, last };
      }).sort((a, b) => b.ltv - a.ltv);
    },
  });

  const filtered = (data ?? []).filter((c) => !q || `${c.name} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="CRM" title="Clientes" description="Ficha única alimentada por Commerce, Academy e experiências." />

      <div className="border-y border-border py-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…" className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
      </div>

      {isLoading ? (
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState eyebrow="Sem clientes" title="Nenhum cadastro encontrado." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/crm/clientes/$id"
              params={{ id: c.id }}
              className="py-5 grid grid-cols-[1.4fr_1fr_auto_auto] gap-6 items-center hover:bg-[color:var(--muted)] px-2 -mx-2 transition-colors"
            >
              <div>
                <div className="font-display text-xl">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.email || "sem e-mail"}{c.phone ? ` · ${c.phone}` : ""}</div>
              </div>
              <div className="eyebrow">{c.orders} pedido{c.orders === 1 ? "" : "s"}</div>
              <div className="eyebrow">{c.last ? new Date(c.last).toLocaleDateString("pt-BR") : "—"}</div>
              <div className="font-display text-xl">{formatBRL(c.ltv)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
