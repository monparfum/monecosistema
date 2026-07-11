import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { formatBRL } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_crm/crm/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — CRM" }] }),
  component: CrmCliente,
});

function CrmCliente() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["crm-cliente", id],
    queryFn: async () => {
      const [profile, orders] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("orders").select("*, order_items(product_name, quantity)").eq("user_id", id).order("created_at", { ascending: false }),
      ]);
      return { profile: profile.data, orders: orders.data ?? [] };
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!data?.profile) return <EmptyState title="Cliente não encontrado." />;

  const paid = data.orders.filter((o) => o.status !== "cancelled" && o.status !== "pending_payment");
  const ltv = paid.reduce((s, o) => s + o.total_cents, 0);
  const last = data.orders[0]?.created_at;

  return (
    <div className="space-y-10 max-w-[1200px]">
      <div>
        <Link to="/crm/clientes" className="eyebrow text-muted-foreground hover:text-foreground">← Clientes</Link>
        <PageHeader eyebrow="Ficha 360°" title={data.profile.full_name || "Cliente sem nome"} description={data.profile.phone ?? ""} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Stat label="Pedidos" value={data.orders.length} />
        <Stat label="LTV" value={formatBRL(ltv)} />
        <Stat label="Última compra" value={last ? new Date(last).toLocaleDateString("pt-BR") : "—"} />
        <Stat label="Segmento" value={ltv >= 100_000 ? "VIP" : "Regular"} />
      </div>

      <section>
        <h2 className="font-display text-2xl mb-4">Histórico de pedidos</h2>
        {data.orders.length === 0 ? (
          <EmptyState eyebrow="Sem compras" title="Este cliente ainda não realizou pedidos." />
        ) : (
          <div className="border-y border-border divide-y divide-border">
            {data.orders.map((o) => (
              <div key={o.id} className="py-4 flex items-center justify-between gap-6">
                <div>
                  <div className="eyebrow">{new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.status}</div>
                  <div className="font-display text-lg">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground mt-1">{o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}</div>
                </div>
                <div className="font-display text-lg">{formatBRL(o.total_cents)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-px bg-border border border-border">
        <div className="bg-background p-6">
          <div className="eyebrow mb-2">Cursos</div>
          <p className="text-sm text-muted-foreground">Nenhum curso adquirido ainda.</p>
        </div>
        <div className="bg-background p-6">
          <div className="eyebrow mb-2">Experiências & Eventos</div>
          <p className="text-sm text-muted-foreground">Nenhuma experiência registrada ainda.</p>
        </div>
        <div className="bg-background p-6">
          <div className="eyebrow mb-2">Quiz Olfativo</div>
          <p className="text-sm text-muted-foreground">Aguardando integração futura.</p>
        </div>
        <div className="bg-background p-6">
          <div className="eyebrow mb-2">Observações</div>
          <p className="text-sm text-muted-foreground">Sem notas.</p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-background p-6">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-2xl mt-2 leading-none">{value}</div>
    </div>
  );
}
