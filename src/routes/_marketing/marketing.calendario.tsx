import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { useState } from "react";

export const Route = createFileRoute("/_marketing/marketing/calendario")({
  head: () => ({ meta: [{ title: "Calendário — Marketing" }] }),
  component: Calendario,
});

function Calendario() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const { data } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await supabase.from("campaigns").select("id, name, channel, status, starts_at, ends_at")).data ?? [],
  });

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startPad = first.getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: last.getDate() }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];

  const eventsForDay = (day: Date) =>
    (data ?? []).filter((c) => {
      const s = c.starts_at ? new Date(c.starts_at) : null;
      const e = c.ends_at ? new Date(c.ends_at) : s;
      if (!s) return false;
      return day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && (!e || day <= new Date(e.getFullYear(), e.getMonth(), e.getDate()));
    });

  const shift = (d: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + d, 1));

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader
        eyebrow="Marketing"
        title="Calendário editorial"
        description="Campanhas ativas, agendadas e concluídas por dia."
        actions={
          <div className="flex items-center gap-3">
            <button onClick={() => shift(-1)} className="border border-border px-3 py-2 text-xs">←</button>
            <div className="eyebrow capitalize min-w-[140px] text-center">{monthLabel}</div>
            <button onClick={() => shift(1)} className="border border-border px-3 py-2 text-xs">→</button>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-px bg-border border border-border">
        {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => (
          <div key={d} className="bg-background p-3 eyebrow text-center">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="bg-background min-h-[110px] p-2">
            {day && (
              <>
                <div className="eyebrow text-muted-foreground mb-1">{day.getDate()}</div>
                <div className="space-y-1">
                  {eventsForDay(day).slice(0, 3).map((c) => (
                    <div key={c.id} className="text-[10px] uppercase tracking-[0.1em] border-l-2 border-foreground pl-1 truncate" title={c.name}>
                      {c.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
