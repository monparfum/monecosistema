import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";

export const Route = createFileRoute("/_marketing/marketing/calendario")({
  head: () => ({ meta: [{ title: "Calendário — Marketing" }] }),
  component: () => {
    const now = new Date();
    const days = Array.from({ length: 35 }, (_, i) => i - now.getDay() + 1);
    return (
      <div className="space-y-8 max-w-[1200px]">
        <PageHeader eyebrow="Marketing" title="Calendário editorial" description="Datas comemorativas, lançamentos e postagens." />
        <div className="grid grid-cols-7 gap-px bg-border border border-border">
          {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => (
            <div key={d} className="bg-background p-3 eyebrow text-center">{d}</div>
          ))}
          {days.map((d, i) => (
            <div key={i} className="bg-background aspect-square p-3 text-sm text-muted-foreground">
              {d > 0 && d <= 31 ? d : ""}
            </div>
          ))}
        </div>
      </div>
    );
  },
});
