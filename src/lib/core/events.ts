// Core event bus — in-memory pub/sub so módulos comunicam sem acoplamento direto.
// Fase 1: cliente only. Substituir por Postgres NOTIFY / edge function em produção.

export type CoreEvent =
  | { type: "order.created"; payload: { orderId: string; userId: string | null } }
  | { type: "order.status_changed"; payload: { orderId: string; status: string } }
  | { type: "course.purchased"; payload: { userId: string; productId: string } }
  | { type: "experience.purchased"; payload: { userId: string; productId: string } }
  | { type: "customer.updated"; payload: { userId: string } };

type Handler<E extends CoreEvent = CoreEvent> = (event: E) => void;

const listeners = new Map<CoreEvent["type"], Set<Handler>>();

export function on<T extends CoreEvent["type"]>(
  type: T,
  handler: Handler<Extract<CoreEvent, { type: T }>>,
) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(handler as Handler);
  return () => listeners.get(type)?.delete(handler as Handler);
}

export function emit(event: CoreEvent) {
  listeners.get(event.type)?.forEach((h) => {
    try { h(event); } catch (err) { console.error("[core.events]", err); }
  });
}
