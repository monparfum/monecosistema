// Aviso de ambiente de teste (chaves TEST-/pk_test_): nenhum pagamento é cobrado de verdade
export function PaymentTestModeBanner({ testMode }: { testMode: boolean }) {
  if (!testMode) return null;
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 tracking-wide">
      Ambiente de teste — nenhum pagamento é cobrado de verdade.
    </div>
  );
}
