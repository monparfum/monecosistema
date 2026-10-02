import { env } from "@/lib/settings.server";
// Cliente mínimo da API Melhor Envio (https://docs.melhorenvio.com.br).
// Env: MELHOR_ENVIO_TOKEN, MELHOR_ENVIO_ENV ("sandbox" | "production", padrão sandbox), MELHOR_ENVIO_EMAIL (contato técnico).

export type Parcel = { weightG: number; lengthCm: number; widthCm: number; heightCm: number; quantity: number; unitCents: number };

export const melhorEnvioEnabled = () => !!env("MELHOR_ENVIO_TOKEN");

async function me<T>(path: string, body: unknown): Promise<T> {
  const base = env("MELHOR_ENVIO_ENV") === "production" ? "https://melhorenvio.com.br" : "https://sandbox.melhorenvio.com.br";
  const res = await fetch(`${base}/api/v2/me${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("MELHOR_ENVIO_TOKEN")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": `Mon Parfum (${env("MELHOR_ENVIO_EMAIL") || "contato@monparfum.com.br"})`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Melhor Envio ${path}: ${json?.message ?? res.status} ${json?.errors ? JSON.stringify(json.errors) : ""}`.trim());
  return json as T;
}

// Uma caixa: maior comprimento/largura, alturas empilhadas, pesos somados
export function packVolume(parcels: Parcel[]) {
  const units = parcels.flatMap((p) => Array.from({ length: p.quantity }, () => p));
  return {
    length: Math.max(...units.map((u) => u.lengthCm)),
    width: Math.max(...units.map((u) => u.widthCm)),
    height: units.reduce((s, u) => s + u.heightCm, 0),
    weight: units.reduce((s, u) => s + u.weightG, 0) / 1000,
  };
}

type Quote = { id: number; name: string; price?: string; custom_price?: string; delivery_time?: number; custom_delivery_time?: number; error?: string; company?: { name: string } };

export async function calculate(fromCep: string, toCep: string, parcels: Parcel[]) {
  const quotes = await me<Quote[]>("/shipment/calculate", {
    from: { postal_code: fromCep },
    to: { postal_code: toCep },
    products: parcels.map((p, i) => ({
      id: String(i),
      width: p.widthCm, height: p.heightCm, length: p.lengthCm,
      weight: p.weightG / 1000,
      insurance_value: p.unitCents / 100,
      quantity: p.quantity,
    })),
    options: { receipt: false, own_hand: false },
  });
  return quotes
    .filter((q) => !q.error && (q.custom_price ?? q.price))
    .map((q) => ({
      serviceId: q.id,
      name: `${q.company?.name ?? ""} ${q.name}`.trim(),
      priceCents: Math.round(Number(q.custom_price ?? q.price) * 100),
      days: q.custom_delivery_time ?? q.delivery_time ?? null,
    }));
}

type Party = { name: string; phone?: string | null; email?: string | null; document?: string; company_document?: string; address: string; complement?: string | null; number: string; district: string; city: string; state_abbr: string; postal_code: string };

// Carrinho → compra (saldo da carteira ME) → geração → URL de impressão
export async function buyLabel(input: {
  serviceId: number; from: Party; to: Party; orderNumber: string;
  items: { name: string; quantity: number; unitCents: number }[]; parcels: Parcel[];
}) {
  const insurance = input.items.reduce((s, i) => s + i.quantity * i.unitCents, 0) / 100;
  const cart = await me<{ id: string }>("/cart", {
    service: input.serviceId,
    from: { ...input.from, country_id: "BR" },
    to: { ...input.to, country_id: "BR" },
    products: input.items.map((i) => ({ name: i.name, quantity: i.quantity, unitary_value: i.unitCents / 100 })),
    volumes: [packVolume(input.parcels)],
    options: {
      insurance_value: insurance, receipt: false, own_hand: false, reverse: false,
      non_commercial: true, // declaração de conteúdo; com NF-e, trocar por invoice: { key }
      platform: "Mon Parfum",
      tags: [{ tag: input.orderNumber, url: null }],
    },
  });
  await me("/shipment/checkout", { orders: [cart.id] });
  await me("/shipment/generate", { orders: [cart.id] });
  const print = await me<{ url: string }>("/shipment/print", { mode: "public", orders: [cart.id] });
  return { labelId: cart.id, labelUrl: print.url };
}

export async function tracking(labelId: string): Promise<string | null> {
  const r = await me<Record<string, { tracking?: string | null; melhorenvio_tracking?: string | null }>>("/shipment/tracking", { orders: [labelId] });
  return r[labelId]?.tracking ?? null;
}
