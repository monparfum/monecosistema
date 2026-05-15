import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/categorias")({ component: AdminCategories });

function AdminCategories() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("categories").insert({ name, slug: slugify(name), description: desc || null });
    if (error) return toast.error(error.message);
    setName(""); setDesc(""); qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <div className="eyebrow mb-2">Catálogo</div>
        <h1 className="font-display text-4xl">Categorias</h1>
      </div>
      <form onSubmit={add} className="space-y-3 border border-border p-4">
        <input required placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full border border-border bg-transparent px-3 py-2" />
        <input placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)}
          className="w-full border border-border bg-transparent px-3 py-2" />
        <button className="bg-foreground text-background px-4 py-2 text-sm">Adicionar</button>
      </form>
      <ul className="border-y border-border divide-y divide-border">
        {data?.map((c) => (
          <li key={c.id} className="py-3 flex justify-between items-center">
            <div>
              <div className="font-display text-lg">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.description}</div>
            </div>
            <button onClick={() => remove(c.id)} className="text-xs text-destructive">Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
