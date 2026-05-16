import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { Copy, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/_studio/studio/midia")({ component: Media });

function Media() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const { data: media } = useQuery({
    queryKey: ["studio-media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const path = `media/${Date.now()}-${slugify(file.name)}`;
        const { error: upErr } = await supabase.storage.from("products").upload(path, file);
        if (upErr) throw upErr;
        const url = supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("media_assets").insert({
          url, filename: file.name, mime_type: file.type, uploaded_by: user?.id,
        });
      }
      toast.success("Mídia enviada");
      qc.invalidateQueries({ queryKey: ["studio-media"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta mídia?")) return;
    await supabase.from("media_assets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["studio-media"] });
  };

  const filtered = media?.filter((m) => !q || m.filename.toLowerCase().includes(q.toLowerCase())) ?? [];

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">Studio · Biblioteca</div>
          <h1 className="font-display text-5xl">Mídia</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">Imagens da maison. Faça upload e cole a URL em qualquer bloco.</p>
        </div>
        <label className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-sm cursor-pointer hover:bg-foreground hover:text-background transition-colors">
          <Upload className="size-4" /> {busy ? "Enviando…" : "Enviar arquivos"}
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} disabled={busy} />
        </label>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome…"
        className="w-full md:w-80 border-b border-border bg-transparent px-1 py-2 text-sm focus:outline-none focus:border-foreground"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((m) => (
          <div key={m.id} className="group border border-border">
            <div className="aspect-square overflow-hidden bg-[color:var(--muted)]">
              <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-3">
              <div className="text-xs truncate text-muted-foreground">{m.filename}</div>
              <div className="flex items-center gap-3">
                <button onClick={() => copy(m.url)} className="text-xs flex items-center gap-1 hover:text-foreground text-muted-foreground"><Copy className="size-3" /> Copiar URL</button>
                <button onClick={() => remove(m.id)} className="text-xs flex items-center gap-1 hover:text-foreground text-muted-foreground ml-auto"><Trash2 className="size-3" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-20 border border-dashed border-border">
            Nenhuma mídia ainda. Envie sua primeira imagem.
          </div>
        )}
      </div>
    </div>
  );
}
