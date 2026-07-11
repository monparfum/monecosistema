import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/module-shell";

const RULES = [
  { id: "order.created", label: "Pedido criado → registrar no log", event: "order.created", active: true },
  { id: "order.status_changed", label: "Status alterado → registrar no log", event: "order.status_changed", active: true },
  { id: "order.paid", label: "Pedido pago em curso → matricular aluno", event: "order.status_changed", active: true, note: "Trigger no banco: on_order_paid_enroll" },
  { id: "cart.abandoned", label: "Carrinho abandonado → email", event: null, active: false },
  { id: "post.purchase", label: "Pós-compra → email de agradecimento", event: null, active: false },
  { id: "birthday", label: "Aniversário → WhatsApp", event: null, active: false },
];

export const Route = createFileRoute("/_marketing/marketing/automacoes")({
  head: () => ({ meta: [{ title: "Automações — Marketing" }] }),
  component: Automacoes,
});

function Automacoes() {
  const { data: counts } = useQuery({
    queryKey: ["automation-counts"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("module_events")
        .select("event_type")
        .gte("created_at", since);
      const map: Record<string, number> = {};
      (data ?? []).forEach((e) => {
        map[e.event_type] = (map[e.event_type] ?? 0) + 1;
      });
      return map;
    },
  });

  return (
    <div className="space-y-8 max-w-[1100px]">
      <PageHeader
        eyebrow="Marketing"
        title="Automações"
        description="Regras reativas do event bus. Ativas rodam via trigger no banco; demais aguardam provedor."
      />

      <div className="border-y border-border divide-y divide-border">
        {RULES.map((r) => (
          <div key={r.id} className="py-5 flex items-start gap-4">
            {r.active ? (
              <CheckCircle2 className="size-5 text-[color:var(--gold)] mt-1" strokeWidth={1.2} />
            ) : (
              <Circle className="size-5 text-muted-foreground mt-1" strokeWidth={1.2} />
            )}
            <div className="flex-1">
              <div className="font-display text-xl">{r.label}</div>
              {r.note && <div className="text-xs text-muted-foreground mt-1 font-mono">{r.note}</div>}
              {r.event && (
                <div className="eyebrow mt-2">
                  {r.event} · <span className="text-foreground">{counts?.[r.event] ?? 0}</span> nos últimos 30d
                </div>
              )}
            </div>
            <span className={`eyebrow ${r.active ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>
              {r.active ? "Ativa" : "Aguardando"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
        A camada Core registra todos os eventos em <span className="font-mono">module_events</span>. Reações são acopladas por trigger ou por servidor — nada é executado por polling no cliente.
      </p>
    </div>
  );
}
