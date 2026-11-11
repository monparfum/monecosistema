// Regra pura: o que o estado do envio na transportadora (Melhor Envio) faz com o status do pedido. Nunca volta atrás.
export function nextOrderStatus(orderStatus: string, shipment: { status: string | null; tracking: string | null }): string {
  const open = ["paid", "processing"];
  if (shipment.status === "delivered" && [...open, "shipped"].includes(orderStatus)) return "delivered";
  if (shipment.status === "posted" && open.includes(orderStatus) && shipment.tracking) return "shipped";
  return orderStatus;
}

// Estado da transportadora em português (tela de pedido)
export const CARRIER_STATUS: Record<string, string> = {
  pending: "Etiqueta aguardando pagamento",
  released: "Etiqueta pronta — aguardando postagem",
  posted: "Postado — em trânsito",
  delivered: "Entregue",
  canceled: "Etiqueta cancelada",
  undelivered: "Não entregue — verificar com a transportadora",
};
