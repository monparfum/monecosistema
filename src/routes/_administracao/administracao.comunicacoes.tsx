import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/_administracao/administracao/comunicacoes")({
  head: () => ({ meta: [{ title: "Comunicações — Mon Parfum" }] }),
  component: ComunicacoesPage,
});

type EventRow = {
  id: string;
  event_type: string;
  subject_type: string | null;
  subject_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type OrderContact = {
  id: string;
  order_number: string;
  email: string | null;
  shipping_recipient: string | null;
  shipping_phone: string | null;
  tracking_code: string | null;
  status: string;
  total_cents: number;
};

const EVENT_LABEL: Record<string, { label: string; kind: "info" | "success" | "warn" }> = {
  "order.created": { label: "Pedido recebido", kind: "info" },
  "order.status_changed": { label: "Status alterado", kind: "info" },
  "academy.enrolled_from_order": { label: "Acesso ao curso liberado", kind: "success" },
};

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function digitsOnly(v: string | null | undefined) {
  return (v ?? "").replace(/\D+/g, "");
}

function buildMessage(event: EventRow, order: OrderContact | undefined) {
  const nome = order?.shipping_recipient?.split(" ")[0] ?? "Olá";
  const num = order?.order_number ?? "";
  const rastreio = order?.tracking_code ?? "";
  const total = order ? brl(order.total_cents) : "";
  const payload = event.payload ?? {};
  const to = (payload["to"] as string | undefined) ?? order?.status ?? "";

  if (event.event_type === "order.created") {
    return `${nome}, recebemos o seu pedido ${num} na Mon Parfum. Valor: ${total}. Assim que o pagamento for confirmado, avisaremos por aqui. Merci ✨`;
  }
  if (event.event_type === "academy.enrolled_from_order") {
    return `${nome}, seu acesso ao curso Mon Parfum acaba de ser liberado. Entre em monparfum.com/academia com o e-mail do pedido ${num} para começar. Bonne dégustation.`;
  }
  if (event.event_type === "order.status_changed") {
    if (to === "paid") return `${nome}, pagamento do pedido ${num} confirmado. Estamos preparando o envio. Merci ✨`;
    if (to === "shipped")
      return `${nome}, seu pedido ${num} foi despachado${rastreio ? ` (rastreio: ${rastreio})` : ""}. Boa espera!`;
    if (to === "delivered") return `${nome}, seu pedido ${num} foi entregue. Esperamos que aprecie cada nota.`;
    if (to === "canceled") return `${nome}, o pedido ${num} foi cancelado. Se precisar de qualquer ajuda, estamos aqui.`;
    return `${nome}, atualização do pedido ${num}: status agora é "${to}".`;
  }
  return `${nome}, novidade sobre o pedido ${num}.`;
}

function buildSubject(event: EventRow, order: OrderContact | undefined) {
  const num = order?.order_number ?? "";
  const to = ((event.payload ?? {})["to"] as string | undefined) ?? "";
  if (event.event_type === "order.created") return `Recebemos seu pedido ${num} · Mon Parfum`;
  if (event.event_type === "academy.enrolled_from_order") return `Acesso liberado · Academia Mon Parfum`;
  if (event.event_type === "order.status_changed") {
    if (to === "paid") return `Pagamento confirmado · ${num}`;
    if (to === "shipped") return `Seu pedido ${num} foi enviado`;
    if (to === "delivered") return `Seu pedido ${num} chegou`;
    return `Atualização do pedido ${num}`;
  }
  return `Mon Parfum · ${num}`;
}

function ComunicacoesPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "sent">("all");

  const { data: events } = useQuery({
    queryKey: ["adm-comm-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_events")
        .select("id, event_type, subject_type, subject_id, payload, created_at")
        .in("event_type", ["order.created", "order.status_changed", "academy.enrolled_from_order"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
    refetchInterval: 15000,
  });

  const orderIds = useMemo(() => {
    const ids = new Set<string>();
    (events ?? []).forEach((e) => {
      if (e.subject_type === "order" && e.subject_id) ids.add(e.subject_id);
    });
    return Array.from(ids);
  }, [events]);

  const { data: orders } = useQuery({
    queryKey: ["adm-comm-orders", orderIds.join(",")],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, email, shipping_recipient, shipping_phone, tracking_code, status, total_cents")
        .in("id", orderIds);
      if (error) throw error;
      return (data ?? []) as OrderContact[];
    },
  });

  const orderById = useMemo(() => {
    const m = new Map<string, OrderContact>();
    (orders ?? []).forEach((o) => m.set(o.id, o));
    return m;
  }, [orders]);

  // sent locally (session) — persisted in localStorage to survive reload
  const [sent, setSent] = useState<Set<string>>(() => {
    try {
      if (typeof window === "undefined") return new Set();
      const raw = window.localStorage.getItem("mp_comm_sent");
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const markSent = (id: string) => {
    setSent((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        window.localStorage.setItem("mp_comm_sent", JSON.stringify([...next]));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const list = (events ?? []).filter((e) => {
    if (filter === "sent") return sent.has(e.id);
    if (filter === "pending") return !sent.has(e.id);
    return true;
  });

  const pendingCount = (events ?? []).filter((e) => !sent.has(e.id)).length;

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · Administração"
        title="Comunicações"
        description="Central editorial de avisos: cada evento de pedido e matrícula com disparo pronto por WhatsApp ou e-mail. Envio automatizado será ligado quando o domínio de e-mail estiver verificado."
      />

      <div className="flex flex-wrap items-center gap-6 border-b border-border pb-4">
        <div className="eyebrow">
          {pendingCount} pendente{pendingCount === 1 ? "" : "s"} · {events?.length ?? 0} eventos
        </div>
        <div className="flex gap-1 ml-auto">
          {(["all", "pending", "sent"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.14em] border ${
                filter === f
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-border hover:bg-[color:var(--cream)]/40"
              }`}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Enviados"}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border divide-y divide-border">
        {list.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum evento neste filtro.</div>
        )}
        {list.map((e) => {
          const order = e.subject_id ? orderById.get(e.subject_id) : undefined;
          const label = EVENT_LABEL[e.event_type] ?? { label: e.event_type, kind: "info" as const };
          const message = buildMessage(e, order);
          const subject = buildSubject(e, order);
          const phone = digitsOnly(order?.shipping_phone);
          const waPhone = phone.length >= 10 ? (phone.startsWith("55") ? phone : `55${phone}`) : "";
          const waLink = waPhone
            ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
          const mailto = order?.email
            ? `mailto:${order.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
            : "";
          const wasSent = sent.has(e.id);

          return (
            <div key={e.id} className="p-6 grid md:grid-cols-[220px_1fr_260px] gap-6">
              <div>
                <div className="eyebrow">{label.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(e.created_at).toLocaleString("pt-BR")}
                </div>
                {order && (
                  <div className="mt-3 space-y-0.5 text-xs">
                    <div className="font-display text-base">{order.order_number}</div>
                    <div className="text-muted-foreground">{brl(order.total_cents)}</div>
                    <div className="text-muted-foreground uppercase tracking-[0.12em] text-[10px]">{order.status}</div>
                  </div>
                )}
              </div>

              <div>
                <div className="eyebrow mb-2">Mensagem sugerida</div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap bg-[color:var(--cream)]/40 p-4 border border-border">
                  {message}
                </div>
                {order && (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="eyebrow text-[10px]">Destinatário</div>
                      <div>{order.shipping_recipient ?? "—"}</div>
                    </div>
                    <div>
                      <div className="eyebrow text-[10px]">Contato</div>
                      <div className="truncate">{order.email ?? "—"}</div>
                      <div>{order.shipping_phone ?? "—"}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => markSent(e.id)}
                  className={`text-center px-4 py-2 text-xs uppercase tracking-[0.14em] border ${
                    waPhone
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-[color:var(--cream)]/40"
                  }`}
                >
                  {waPhone ? "Enviar WhatsApp" : "Abrir WhatsApp"}
                </a>
                <a
                  href={mailto || "#"}
                  onClick={(ev) => {
                    if (!mailto) {
                      ev.preventDefault();
                      toast.error("Sem e-mail no pedido");
                      return;
                    }
                    markSent(e.id);
                  }}
                  className="text-center px-4 py-2 text-xs uppercase tracking-[0.14em] border border-border hover:bg-[color:var(--cream)]/40"
                >
                  Abrir e-mail
                </a>
                <button
                  onClick={() => copy(message, "Mensagem copiada")}
                  className="text-center px-4 py-2 text-xs uppercase tracking-[0.14em] border border-border hover:bg-[color:var(--cream)]/40"
                >
                  Copiar texto
                </button>
                {wasSent ? (
                  <button
                    onClick={() =>
                      setSent((prev) => {
                        const n = new Set(prev);
                        n.delete(e.id);
                        try {
                          window.localStorage.setItem("mp_comm_sent", JSON.stringify([...n]));
                        } catch {
                          /* noop */
                        }
                        return n;
                      })
                    }
                    className="text-center px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    Marcar como pendente
                  </button>
                ) : (
                  <button
                    onClick={() => markSent(e.id)}
                    className="text-center px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    Marcar enviado
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-border p-6 bg-[color:var(--cream)]/30">
        <div className="eyebrow">Automação futura</div>
        <div className="font-display text-2xl mt-1">Envio automático</div>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Assim que o domínio de e-mail estiver verificado em Administração · Empresa, os mesmos eventos passam a
          disparar e-mails automáticos (pedido recebido, pagamento confirmado, envio com rastreio, acesso ao curso
          liberado) — mantendo esta central como fallback manual e histórico.
        </p>
      </div>
    </div>
  );
}
