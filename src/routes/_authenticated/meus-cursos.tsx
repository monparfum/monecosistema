import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meus-cursos")({
  head: () => ({ meta: [{ title: "Meus cursos — Mon Parfum" }] }),
  component: MeusCursos,
});

function MeusCursos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["meus-cursos", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase
      .from("enrollments")
      .select("id, status, created_at, products(id, name, brand, description, image_url, slug)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
    ).data ?? [],
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("enrollments").update({ status: "completed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Curso concluído. Certificado emitido.");
      qc.invalidateQueries({ queryKey: ["meus-cursos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="eyebrow mb-3">Academy</div>
        <h1 className="font-display text-5xl mb-12">Meus cursos</h1>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !data?.length ? (
          <div className="border-y border-border py-16 text-center">
            <div className="eyebrow mb-2">Nenhum curso ainda</div>
            <p className="font-display text-2xl italic mb-6">Sua estante está esperando o primeiro capítulo.</p>
            <Link to="/produtos" className="inline-block bg-foreground text-background px-6 py-3 text-sm">Explorar cursos</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
            {data.map((e) => (
              <article key={e.id} className="bg-background p-8 flex gap-6 items-start">
                {e.products?.image_url && <img src={e.products.image_url} alt="" className="w-28 h-28 object-cover" />}
                <div className="flex-1">
                  <div className="eyebrow">{e.products?.brand} · matriculado {new Date(e.created_at).toLocaleDateString("pt-BR")}</div>
                  <h2 className="font-display text-2xl mt-1 leading-tight">{e.products?.name}</h2>
                  {e.products?.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{e.products.description}</p>}
                  <div className="mt-4 flex items-center gap-4">
                    {e.status === "completed" ? (
                      <span className="eyebrow text-[color:var(--gold)]">Concluído · certificado emitido</span>
                    ) : (
                      <button
                        onClick={() => complete.mutate(e.id)}
                        disabled={complete.isPending}
                        className="editorial-link text-xs disabled:opacity-40"
                      >
                        Marcar como concluído →
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12">
          <Link to="/conta" className="eyebrow text-muted-foreground hover:text-foreground">← Minha conta</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
