import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRow } from "@/components/skeleton-row";
import { useState } from "react";

export const Route = createFileRoute("/_administracao/administracao/logs")({
  head: () => ({ meta: [{ title: "Logs — Administração" }] }),
  component: Logs,
});

function Logs() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => (await supabase.from("module_events").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const filtered = (data ?? []).filter((ev) => !q || ev.event_type.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Administração" title="Logs" description="Auditoria de eventos emitidos por todos os módulos." />

      <div className="border-y border-border py-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar por tipo (ex: order.status_changed)…"
          className="w-full bg-transparent border border-border px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="border-y border-border divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={3} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState eyebrow="Auditoria" title="Nenhum evento registrado ainda." description="Assim que houver pedidos, matrículas ou notas, os eventos aparecem aqui." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {filtered.map((ev) => (
            <div key={ev.id} className="py-4">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="eyebrow">{new Date(ev.created_at).toLocaleString("pt-BR")} · {ev.subject_type}</div>
                  <div className="font-display text-xl italic">{ev.event_type}</div>
                </div>
                {ev.actor_user_id && <div className="eyebrow text-muted-foreground">ator {ev.actor_user_id.slice(0, 8)}</div>}
              </div>
              <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{JSON.stringify(ev.payload, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
