import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_studio/studio/paginas")({ component: PagesList });

function PagesList() {
  const qc = useQueryClient();
  const { data: pages } = useQuery({
    queryKey: ["studio-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const togglePublish = async (id: string, status: string) => {
    const next = status === "published" ? "draft" : "published";
    const { error } = await supabase.from("pages").update({ status: next }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(next === "published" ? "Página publicada" : "Página em rascunho");
    qc.invalidateQueries({ queryKey: ["studio-pages"] });
  };

  return (
    <div className="space-y-12">
      <div>
        <div className="eyebrow mb-3">Studio · Páginas</div>
        <h1 className="font-display text-5xl">Todas as páginas</h1>
        <p className="mt-4 text-muted-foreground max-w-xl">As páginas editoriais do site. Selecione uma para editar seus blocos.</p>
      </div>

      <div className="divide-y divide-border border-t border-b border-border">
        {pages?.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-8 py-6">
            <div>
              <Link
                to="/studio/paginas/$slug"
                params={{ slug: p.slug }}
                className="font-display text-2xl hover:italic"
              >
                {p.title}
              </Link>
              <div className="text-xs text-muted-foreground mt-1">/{p.slug === "home" ? "" : p.slug}</div>
            </div>
            <span className={`eyebrow ${p.status === "published" ? "text-foreground" : "text-muted-foreground"}`}>
              {p.status === "published" ? "Publicada" : "Rascunho"}
            </span>
            <button
              onClick={() => togglePublish(p.id, p.status)}
              className="text-xs eyebrow text-muted-foreground hover:text-foreground border-b border-transparent hover:border-foreground"
            >
              {p.status === "published" ? "Despublicar" : "Publicar"}
            </button>
            <Link
              to="/studio/paginas/$slug"
              params={{ slug: p.slug }}
              className="eyebrow text-xs border-b border-foreground"
            >
              Editar →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
