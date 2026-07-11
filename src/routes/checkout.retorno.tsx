import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useEffect } from "react";

export const Route = createFileRoute("/checkout/retorno")({
  head: () => ({ meta: [{ title: "Pagamento confirmado — Mon Parfum" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
  }),
  component: RetornoPage,
});

function RetornoPage() {
  const { order_id } = Route.useSearch();
  const { clear } = useCart();

  const { data: order } = useQuery({
    queryKey: ["order-return", order_id],
    enabled: !!order_id,
    refetchInterval: (q) => (q.state.data && (q.state.data as any).status === "paid" ? false : 2000),
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total_cents")
        .eq("id", order_id!)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (order?.status === "paid") clear();
  }, [order?.status, clear]);

  const isPaid = order?.status === "paid";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="eyebrow mb-4">{isPaid ? "Pagamento confirmado" : "Aguardando confirmação"}</div>
        <h1 className="font-display text-4xl md:text-5xl mb-6">
          {isPaid ? "Merci." : "Processando…"}
        </h1>
        <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
          {isPaid
            ? `Seu pedido ${order?.order_number ?? ""} foi recebido. Enviamos a confirmação para o seu email.`
            : "Estamos confirmando seu pagamento. Isso costuma levar poucos segundos."}
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link to="/pedidos" className="border-b-2 border-foreground pb-1">Meus pedidos</Link>
          <Link to="/catalogo" className="text-muted-foreground hover:text-foreground">Continuar navegando</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
