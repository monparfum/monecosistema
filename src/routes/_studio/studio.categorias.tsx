import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { categoriesQuery, KINDS, type PostKind } from "@/lib/posts";

export const Route = createFileRoute("/_studio/studio/categorias")({ component: PostCategories });

const input = "border border-border bg-background px-3 py-2 text-sm";

function PostCategories() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<PostKind>("noticia");
  const { data: cats = [] } = useQuery(categoriesQuery(kind));
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["post-categories"] });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(name).slice(0, 80);
    if (!slug) return toast.error("Dê um nome.");
    const { error } = await supabase.from("post_categories").insert({ kind, name: name.trim(), slug, description: desc.trim() || null });
    if (error) return toast.error(error.code === "23505" ? "Já existe essa categoria." : error.message);
    setName(""); setDesc(""); refresh();
  };

  const rename = async (id: string, field: "name" | "description", value: string) => {
    if (field === "name" && !value.trim()) return toast.error("O nome não pode ficar vazio.");
    const patch = field === "name" ? { name: value.trim() } : { description: value.trim() || null };
    const { error } = await supabase.from("post_categories").update(patch).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir categoria? As publicações ficam sem categoria.")) return;
    const { error } = await supabase.from("post_categories").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link to="/studio/publicacoes" className="eyebrow text-muted-foreground hover:text-foreground">← Notícias e Blog</Link>
        <h1 className="font-display text-4xl mt-2">Categorias</h1>
        <p className="mt-3 text-sm text-muted-foreground">Cada categoria vira uma página própria no site (ex.: {KINDS[kind].base}/categoria/eventos), boa para o Google.</p>
      </div>
      <div className="flex gap-4 border-b border-border">
        {(["noticia", "blog"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`py-3 text-sm border-b-2 -mb-px ${kind === k ? "border-foreground" : "border-transparent text-muted-foreground"}`}>{KINDS[k].plural}</button>
        ))}
      </div>
      <form onSubmit={add} className="space-y-3 border border-border p-4">
        <input required placeholder="Nome da categoria" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={`${input} w-full`} />
        <input placeholder="Descrição (aparece na página da categoria e no Google)" value={desc} maxLength={300} onChange={(e) => setDesc(e.target.value)} className={`${input} w-full`} />
        <button className="text-xs px-3 py-2 bg-foreground text-background">Adicionar em {KINDS[kind].plural}</button>
      </form>
      <ul className="divide-y divide-border border border-border">
        {cats.map((c) => (
          <li key={c.id} className="p-4 space-y-2">
            <div className="flex gap-3 items-center">
              <input defaultValue={c.name} maxLength={80} onBlur={(e) => e.target.value !== c.name && rename(c.id, "name", e.target.value)} className={`${input} flex-1`} aria-label="Nome" />
              <span className="text-xs text-muted-foreground">/{c.slug}</span>
              <button onClick={() => remove(c.id)} className="text-xs text-destructive">Excluir</button>
            </div>
            <input defaultValue={c.description ?? ""} maxLength={300} onBlur={(e) => e.target.value !== (c.description ?? "") && rename(c.id, "description", e.target.value)} placeholder="Descrição" className={`${input} w-full`} aria-label="Descrição" />
          </li>
        ))}
        {!cats.length && <li className="p-4 text-sm text-muted-foreground">Nenhuma categoria.</li>}
      </ul>
    </div>
  );
}
