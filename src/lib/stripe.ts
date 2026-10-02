import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Chave publicável vem do servidor (configurada em Administração › Integrações)
const cache = new Map<string, Promise<Stripe | null>>();

export function getStripe(pk: string): Promise<Stripe | null> {
  if (!cache.has(pk)) cache.set(pk, loadStripe(pk));
  return cache.get(pk)!;
}
