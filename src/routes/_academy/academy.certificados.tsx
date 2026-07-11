import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award } from "lucide-react";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_academy/academy/certificados")({
  head: () => ({ meta: [{ title: "Certificados — Academy" }] }),
  component: Certificados,
});

function Certificados() {
  const { data, isLoading } = useQuery({
    queryKey: ["academy-certificados"],
    queryFn: async () => {
      const { data: enrs } = await supabase
        .from("enrollments")
        .select("id, user_id, created_at, products(name, brand)")
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      const ids = Array.from(new Set((enrs ?? []).map((e) => e.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
        : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return (enrs ?? []).map((e) => ({ ...e, profile: byId.get(e.user_id) }));
    },
  });

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader eyebrow="Academy" title="Certificados" description="Emitidos ao concluir 100% de um curso." />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <EmptyState eyebrow="Sem emissões" title="Nenhum certificado emitido ainda." description="Assim que um aluno concluir um curso, aparece aqui." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {data.map((c) => (
            <div key={c.id} className="py-6 flex items-center gap-6">
              <Award className="size-8 text-[color:var(--gold)]" strokeWidth={1} />
              <div className="flex-1">
                <div className="eyebrow">{new Date(c.created_at).toLocaleDateString("pt-BR")}</div>
                <div className="font-display text-xl mt-1">{c.profile?.full_name ?? c.profile?.email ?? "Aluno"}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Concluiu <em>{c.products?.name}</em>
                  {c.products?.brand && ` · ${c.products.brand}`}
                </div>
              </div>
              <div className="font-mono text-xs text-muted-foreground">#{c.id.slice(0, 8).toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
