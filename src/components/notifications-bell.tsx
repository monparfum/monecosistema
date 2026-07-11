import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type EventRow = {
  id: string;
  event_type: string;
  subject_type: string;
  subject_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const LABELS: Record<string, string> = {
  "order.created": "Novo pedido",
  "order.status_changed": "Status alterado",
  "academy.enrolled_from_order": "Aluno matriculado",
};

function describe(e: EventRow) {
  const p = (e.payload ?? {}) as Record<string, unknown>;
  const order = p.order_number ? `#${p.order_number}` : "";
  if (e.event_type === "order.created") return `Pedido ${order} criado`;
  if (e.event_type === "order.status_changed") return `Pedido ${order}: ${p.from} → ${p.to}`;
  if (e.event_type === "academy.enrolled_from_order") return `Aluno matriculado no pedido ${order}`;
  return LABELS[e.event_type] ?? e.event_type;
}

function linkFor(e: EventRow) {
  if (e.subject_type === "order" && e.subject_id) return `/ops/pedidos/${e.subject_id}`;
  return "/administracao/logs";
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationsBell() {
  const { data } = useQuery({
    queryKey: ["notifications-bell"],
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("module_events")
        .select("id, event_type, subject_type, subject_id, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      return (data ?? []) as EventRow[];
    },
  });

  const recent = (data ?? []).filter(
    (e) => Date.now() - new Date(e.created_at).getTime() < 24 * 60 * 60 * 1000,
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex items-center gap-2 eyebrow text-muted-foreground hover:text-foreground w-full">
          <Bell className="size-4" strokeWidth={1.5} />
          <span>Notificações</span>
          {recent > 0 && (
            <span className="ml-auto text-[10px] bg-foreground text-background px-1.5 py-0.5 min-w-[18px] text-center">
              {recent}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-[360px] p-0 border-border rounded-none">
        <div className="p-4 border-b border-border">
          <div className="eyebrow">Event bus</div>
          <div className="font-display text-lg">Notificações</div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {!data?.length ? (
            <p className="p-4 text-sm text-muted-foreground italic">Nenhum evento ainda.</p>
          ) : (
            data.map((e) => (
              <Link
                key={e.id}
                to={linkFor(e)}
                className="block px-4 py-3 border-b border-border last:border-0 hover:bg-[color:var(--cream)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-snug">{describe(e)}</div>
                    <div className="eyebrow mt-1 text-[10px]">{e.event_type}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(e.created_at)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
        <Link to="/administracao/logs" className="block p-3 border-t border-border eyebrow text-center hover:bg-[color:var(--cream)]/40">
          Ver todos os logs →
        </Link>
      </PopoverContent>
    </Popover>
  );
}
