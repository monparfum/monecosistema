import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RevenueChart({ days = 30 }: { days?: number }) {
  const { data } = useQuery({
    queryKey: ["revenue-chart", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400_000);
      const { data: orders } = await supabase
        .from("orders")
        .select("total_cents, status, created_at")
        .in("status", PAID_STATUSES)
        .gte("created_at", since.toISOString());
      const buckets = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const d = new Date(since.getTime() + i * 86400_000);
        buckets.set(dayKey(d), 0);
      }
      (orders ?? []).forEach((o) => {
        const k = dayKey(new Date(o.created_at));
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + o.total_cents);
      });
      return Array.from(buckets.entries()).map(([k, cents]) => ({
        day: k.slice(5),
        value: cents / 100,
      }));
    },
  });

  const total = useMemo(() => (data ?? []).reduce((s, r) => s + r.value, 0), [data]);
  const peak = useMemo(() => Math.max(0, ...(data ?? []).map((r) => r.value)), [data]);

  return (
    <div className="border border-border p-6 bg-background">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="eyebrow">Receita · {days}d</div>
          <div className="font-display text-3xl mt-1">
            {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="text-right">
          <div className="eyebrow">Pico diário</div>
          <div className="font-display text-lg mt-1">
            {peak.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data ?? []} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 0,
                fontSize: 12,
              }}
              formatter={(v: number) => [v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "Receita"]}
              labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
              fill="url(#revGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
