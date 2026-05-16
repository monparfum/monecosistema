import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { publishPage, unpublishPage } from "@/lib/studio-versions";

export const Route = createFileRoute("/_studio/studio/paginas")({ component: PagesList });

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function PagesList() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const { data: pages } = useQuery({
    queryKey: ["studio-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("*").order("created_at");
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

  const createPage = async () => {
    const slug = (newSlug || slugify(newTitle)).trim();
    if (!newTitle.trim() || !slug) { toast.error("Informe título e slug"); return; }
    const { error } = await supabase.from("pages").insert({ title: newTitle.trim(), slug, status: "draft" });
    if (error) { toast.error(error.message); return; }
    toast.success("Página criada");
    setCreating(false); setNewTitle(""); setNewSlug("");
    qc.invalidateQueries({ queryKey: ["studio-pages"] });
  };

  const duplicatePage = async (id: string, title: string, slug: string) => {
    const newSlugVal = `${slug}-copia`;
    const { data: created, error } = await supabase.from("pages")
      .insert({ title: `${title} (cópia)`, slug: newSlugVal, status: "draft" }).select().single();
    if (error) { toast.error(error.message); return; }
    const { data: src } = await supabase.from("page_blocks").select("type,position,content").eq("page_id", id).order("position");
    if (src?.length) {
      await supabase.from("page_blocks").insert(src.map((b) => ({ ...b, page_id: created.id, content: b.content as never })));
    }
    toast.success("Página duplicada");
    qc.invalidateQueries({ queryKey: ["studio-pages"] });
  };

  const deletePage = async (id: string, slug: string) => {
    if (["home", "sobre"].includes(slug)) { toast.error("Páginas principais não podem ser excluídas"); return; }
    if (!confirm("Excluir esta página e todos os seus blocos?")) return;
    await supabase.from("page_blocks").delete().eq("page_id", id);
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Página excluída");
    qc.invalidateQueries({ queryKey: ["studio-pages"] });
  };

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">Studio · Páginas</div>
          <h1 className="font-display text-5xl">Todas as páginas</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">As páginas editoriais do site. Selecione uma para editar seus blocos, ou crie uma nova landing.</p>
        </div>
        <button onClick={() => setCreating(true)} className="editorial-link text-xs">+ Nova página</button>
      </div>

      <div className="divide-y divide-border border-t border-b border-border">
        {pages?.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-6 py-6">
            <div>
              <Link to="/studio/paginas/$slug" params={{ slug: p.slug }} className="font-display text-2xl hover:italic">{p.title}</Link>
              <div className="text-xs text-muted-foreground mt-1">/{p.slug === "home" ? "" : p.slug}</div>
            </div>
            <span className={`eyebrow ${p.status === "published" ? "text-foreground" : "text-muted-foreground"}`}>
              {p.status === "published" ? "Publicada" : "Rascunho"}
            </span>
            <button onClick={() => togglePublish(p.id, p.status)} className="text-xs eyebrow text-muted-foreground hover:text-foreground">
              {p.status === "published" ? "Despublicar" : "Publicar"}
            </button>
            <button onClick={() => duplicatePage(p.id, p.title, p.slug)} className="text-xs eyebrow text-muted-foreground hover:text-foreground">Duplicar</button>
            <button onClick={() => deletePage(p.id, p.slug)} className="text-xs eyebrow text-muted-foreground hover:text-foreground">Excluir</button>
            <Link to="/studio/paginas/$slug" params={{ slug: p.slug }} className="eyebrow text-xs border-b border-foreground">Editar →</Link>
          </div>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-8" onClick={() => setCreating(false)}>
          <div className="bg-background border border-border max-w-md w-full p-10" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow mb-3">Studio</div>
            <h2 className="font-display text-3xl mb-8">Nova página</h2>
            <div className="space-y-5">
              <div>
                <label className="eyebrow block mb-2">Título</label>
                <input value={newTitle} onChange={(e) => { setNewTitle(e.target.value); if (!newSlug) setNewSlug(slugify(e.target.value)); }}
                  className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground" autoFocus />
              </div>
              <div>
                <label className="eyebrow block mb-2">Slug</label>
                <div className="flex items-center gap-2 border border-border px-3 py-2">
                  <span className="text-xs text-muted-foreground">/</span>
                  <input value={newSlug} onChange={(e) => setNewSlug(slugify(e.target.value))}
                    placeholder="campanha-edition-02" className="flex-1 bg-transparent text-sm focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-end gap-6">
              <button onClick={() => setCreating(false)} className="eyebrow text-muted-foreground">Cancelar</button>
              <button onClick={createPage} className="editorial-link text-xs">Criar página →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
