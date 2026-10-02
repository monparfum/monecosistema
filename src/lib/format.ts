export const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    (cents || 0) / 100,
  );

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const ORDER_STATUS: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  processing: "Em preparação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
export const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"];

// "1.234,56" -> centavos; null se vazio, NaN se inválido
export const parseBRLInput = (raw: string) => {
  const v = raw.trim();
  if (!v) return null;
  const n = Math.round(Number(v.replace(/[R$\s.]/g, "").replace(",", ".")) * 100);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
export const centsInput = (c: number | null | undefined) => (c != null ? (c / 100).toFixed(2).replace(".", ",") : "");
