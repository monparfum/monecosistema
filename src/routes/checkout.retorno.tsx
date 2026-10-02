import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { confirmMercadoPagoPayment } from "@/lib/checkout.functions";
import { useEffect } from "react";

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : undefined);

export const Route = createFileRoute("/checkout/retorno")({
  head: () => ({ meta: [{ title: "Pagamento — Mon Parfum" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: str(s.session_id),
    order_id: str(s.order_id),
    // Mercado Pago
    payment_id: str(s.payment_id),
    status: str(s.status),
  }),
  component: RetornoPage,
});

function RetornoPage() {
  const { order_id, payment_id, status: mpStatus } = Route.useSearch();
  const { clear } = useCart();

  // Mercado Pago: confirma na API do MP (não depende do webhook alcançar o site)
  useEffect(() => {
    if (order_id && payment_id && /^\d+$/.test(payment_id)) {
      confirmMercadoPagoPayment({ data: { orderId: order_id, paymentId: payment_id } }).catch(() => {});
    }
  }, [order_id, payment_id]);

  const { data: order } = useQuery({
    queryKey: ["order-return", order_id],
    enabled: !!order_id,
    refetchInterval: (q) => ((q.state.data as { status?: string } | null | undefined)?.status === "paid" ? false : 3000),
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
  const failed = !isPaid && (mpStatus === "rejected" || mpStatus === "null");
  const pending = !isPaid && (mpStatus === "pending" || mpStatus === "in_process");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="eyebrow mb-4">
          {isPaid ? "Pagamento confirmado" : failed ? "Pagamento não concluído" : pending ? "Pagamento pendente" : "Aguardando confirmação"}
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-6">
          {isPaid ? "Merci." : failed ? "Quase lá." : "Processando…"}
        </h1>
        <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
          {isPaid
            ? `Seu pedido ${order?.order_number ?? ""} foi recebido. Acompanhe o status e o rastreio em Meus pedidos.`
            : failed
              ? "O pagamento não foi aprovado. Você pode tentar novamente com outra forma de pagamento."
              : pending
                ? "Assim que o Pix ou boleto for compensado, seu pedido é confirmado automaticamente."
                : "Estamos confirmando seu pagamento. Isso costuma levar poucos segundos."}
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          {failed && order_id ? (
            <Link to="/checkout/pagamento/$orderId" params={{ orderId: order_id }} className="border-b-2 border-foreground pb-1">Tentar novamente</Link>
          ) : (
            <Link to="/pedidos" className="border-b-2 border-foreground pb-1">Meus pedidos</Link>
          )}
          <Link to="/produtos" className="text-muted-foreground hover:text-foreground">Continuar navegando</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
