import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, ORDER_STATUS } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({ meta: [{ title: "Meus pedidos — Mon Parfum" }] }),
  component: Pedidos,
});

const STATUS = ORDER_STATUS;

function Pedidos() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total_cents, created_at, tracking_code, order_items(product_name, quantity)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="eyebrow mb-3">Conta</div>
        <h1 className="font-display text-5xl mb-10">Pedidos</h1>
        {isLoading ? (
          <div className="text-muted-foreground">Carregando…</div>
        ) : data?.length === 0 ? (
          <div className="text-muted-foreground">Nenhum pedido ainda. <Link to="/produtos" className="border-b border-foreground">Explorar catálogo</Link></div>
        ) : (
          <div className="border-y border-border divide-y divide-border">
            {data?.map((o) => (
              <div key={o.id} className="py-6 grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <div className="eyebrow">{new Date(o.created_at).toLocaleDateString("pt-BR")}</div>
                  <div className="font-display text-xl">{o.order_number}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}
                  </div>
                  {o.tracking_code && (
                    <a href={`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(o.tracking_code)}`} target="_blank" rel="noreferrer" className="text-sm underline mt-1 inline-block">
                      Rastrear: {o.tracking_code}
                    </a>
                  )}
                  {o.status === "pending_payment" && (
                    <Link to="/checkout/pagamento/$orderId" params={{ orderId: o.id }} className="text-sm underline mt-1 inline-block">Pagar agora</Link>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm">{STATUS[o.status] ?? o.status}</div>
                  <div className="font-display text-xl">{formatBRL(o.total_cents)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
