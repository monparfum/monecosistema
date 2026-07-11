import { createFileRoute, Link } from "@tanstack/react-router";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaymentTestModeBanner } from "@/components/payment-test-banner";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createOrderCheckoutSession } from "@/lib/checkout.functions";
import { useMemo } from "react";

export const Route = createFileRoute("/checkout/pagamento/$orderId")({
  head: () => ({ meta: [{ title: "Pagamento — Mon Parfum" }] }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-3xl mb-4">Não foi possível iniciar o pagamento</h1>
        <p className="text-sm text-muted-foreground mb-6">{error?.message ?? "Tente novamente."}</p>
        <Link to="/pedidos" className="border-b-2 border-foreground pb-1 text-sm">Ver meus pedidos</Link>
      </div>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => <div className="p-20 text-center">Pedido não encontrado</div>,
  component: PagamentoPage,
});

function PagamentoPage() {
  const { orderId } = Route.useParams();

  const options = useMemo(
    () => ({
      fetchClientSecret: async () => {
        const returnUrl = `${window.location.origin}/checkout/retorno`;
        const result = await createOrderCheckoutSession({
          data: { orderId, returnUrl, environment: getStripeEnvironment() },
        });
        if ("error" in result) throw new Error(result.error);
        return result.clientSecret;
      },
    }),
    [orderId],
  );

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="eyebrow mb-3">Finalizar pagamento</div>
        <h1 className="font-display text-4xl mb-10">Chapitre III · Paiement</h1>
        <div id="checkout" className="border border-border">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
