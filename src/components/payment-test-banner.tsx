const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-red-50 border-b border-red-200 px-4 py-2 text-center text-xs text-red-800">
        Pagamentos em produção ainda não configurados — conclua o processo em Payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 tracking-wide">
        Ambiente de teste — nenhum pagamento é cobrado. Use cartão 4242 4242 4242 4242.
      </div>
    );
  }
  return null;
}
