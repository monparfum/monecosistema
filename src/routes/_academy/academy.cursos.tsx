import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_academy/academy/cursos")({
  head: () => ({ meta: [{ title: "Cursos — Academy" }] }),
  component: Cursos,
});

function Cursos() {
  const { data, isLoading } = useQuery({
    queryKey: ["academy-cursos"],
    queryFn: async () => {
      const { data: cat } = await supabase.from("categories").select("id").eq("slug", "cursos").maybeSingle();
      if (!cat) return [];
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, brand, description, image_url, price_cents, active")
        .eq("category_id", cat.id)
        .order("name");
      const { data: enrs } = await supabase.from("enrollments").select("product_id, user_id, status");
      const byProd: Record<string, { total: number; completed: number }> = {};
      (enrs ?? []).forEach((e) => {
        byProd[e.product_id] ??= { total: 0, completed: 0 };
        byProd[e.product_id].total++;
        if (e.status === "completed") byProd[e.product_id].completed++;
      });
      return (prods ?? []).map((p) => ({ ...p, stats: byProd[p.id] ?? { total: 0, completed: 0 } }));
    },
  });

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader eyebrow="Academy" title="Cursos" description="Catálogo derivado dos produtos com categoria Cursos." />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data?.length ? (
        <EmptyState
          eyebrow="Sem cursos"
          title="Nenhum curso publicado."
          description="Crie um produto com categoria 'cursos' no Commerce."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
          {data.map((c) => (
            <article key={c.id} className="bg-background p-6 flex gap-5">
              {c.image_url && <img src={c.image_url} alt="" className="w-32 h-32 object-cover" />}
              <div className="flex-1">
                <div className="eyebrow">{c.brand ?? "Mon Parfum"} · {c.active ? "publicado" : "rascunho"}</div>
                <h2 className="font-display text-2xl mt-1 leading-tight">{c.name}</h2>
                {c.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
                <div className="mt-4 flex gap-6 text-xs">
                  <div><span className="font-display text-xl">{c.stats.total}</span> <span className="text-muted-foreground">alunos</span></div>
                  <div><span className="font-display text-xl">{c.stats.completed}</span> <span className="text-muted-foreground">concluíram</span></div>
                </div>
                <Link to="/academy/alunos" className="editorial-link inline-block mt-3 text-xs">Ver alunos →</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
