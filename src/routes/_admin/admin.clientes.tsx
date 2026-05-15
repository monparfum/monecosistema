import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/admin/clientes")({ component: AdminCustomers });

function AdminCustomers() {
  const { data } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow mb-2">Pessoas</div>
        <h1 className="font-display text-4xl">Clientes</h1>
      </div>
      <div className="border-y border-border divide-y divide-border">
        {data?.map((c) => (
          <div key={c.id} className="py-4 flex justify-between text-sm">
            <span className="font-display text-lg">{c.full_name || "—"}</span>
            <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
