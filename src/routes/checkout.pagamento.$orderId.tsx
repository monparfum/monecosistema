import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaymentTestModeBanner } from "@/components/payment-test-banner";
import { getStripe } from "@/lib/stripe";
import { createOrderCheckoutSession, createMercadoPagoCheckout, getPaymentOptions } from "@/lib/checkout.functions";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/pagamento/$orderId")({
  head: () => ({ meta: [{ title: "Pagamento — Mon Parfum" }] }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-3xl mb-4">Não foi possível iniciar o pagamento</h1>
        <p className="text-sm text-muted-foreground mb-6">{(error as Error | undefined)?.message ?? "Tente novamente."}</p>
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
  const [method, setMethod] = useState<"stripe" | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const { data: opts, isLoading } = useQuery({ queryKey: ["payment-options"], queryFn: () => getPaymentOptions() });
  const hasStripe = !!opts?.stripePk;

  const payMercadoPago = async () => {
    setRedirecting(true);
    try {
      const { url } = await createMercadoPagoCheckout({ data: { orderId, origin: window.location.origin } });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setRedirecting(false);
    }
  };

  const btn = "w-full border border-foreground px-6 py-4 text-sm tracking-wide text-left hover:bg-foreground hover:text-background transition-colors disabled:opacity-50";

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner testMode={!!opts?.testMode} />
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="eyebrow mb-3">Finalizar pagamento</div>
        <h1 className="font-display text-4xl mb-10">Chapitre III · Paiement</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : method === "stripe" ? (
          <>
            <button onClick={() => setMethod(null)} className="eyebrow text-muted-foreground hover:text-foreground mb-4">← Outras formas de pagamento</button>
            <StripeCheckout orderId={orderId} pk={opts!.stripePk!} />
          </>
        ) : !opts?.mercadoPago && !hasStripe ? (
          <p className="text-sm text-muted-foreground">Pagamentos ainda não configurados. <Link to="/pedidos" className="underline">Ver meus pedidos</Link></p>
        ) : (
          <div className="space-y-3">
            {opts?.mercadoPago && (
              <button onClick={payMercadoPago} disabled={redirecting} className={btn}>
                <div className="font-display text-xl">{redirecting ? "Redirecionando…" : "Mercado Pago"}</div>
                <div className="text-xs opacity-70 mt-1">Pix, boleto ou cartão em até 12x</div>
              </button>
            )}
            {hasStripe && (
              <button onClick={() => setMethod("stripe")} className={btn}>
                <div className="font-display text-xl">Cartão de crédito</div>
                <div className="text-xs opacity-70 mt-1">Pagamento seguro via Stripe</div>
              </button>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function StripeCheckout({ orderId, pk }: { orderId: string; pk: string }) {
  const options = useMemo(
    () => ({
      fetchClientSecret: async () => {
        const returnUrl = `${window.location.origin}/checkout/retorno`;
        const result = await createOrderCheckoutSession({
          data: { orderId, returnUrl },
        });
        if ("error" in result) throw new Error(result.error);
        return result.clientSecret;
      },
    }),
    [orderId],
  );
  return (
    <div id="checkout" className="border border-border">
      <EmbeddedCheckoutProvider stripe={getStripe(pk)} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
