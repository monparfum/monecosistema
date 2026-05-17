import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { Copy, Trash2, Upload, FolderOpen, Tag as TagIcon, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/_studio/studio/midia")({ component: Media });

type Asset = {
  id: string; url: string; filename: string; mime_type: string | null;
  tags: string[]; folder: string | null; alt_text: string | null;
  created_at: string;
};

function Media() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<string>("__all__");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [uploadFolder, setUploadFolder] = useState<string>("");

  const { data: media } = useQuery({
    queryKey: ["studio-media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Asset[];
    },
  });

  const folders = useMemo(() => {
    const s = new Set<string>();
    media?.forEach((m) => { if (m.folder) s.add(m.folder); });
    return Array.from(s).sort();
  }, [media]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    media?.forEach((m) => m.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [media]);

  const filtered = useMemo(() => {
    return (media ?? []).filter((m) => {
      if (folder !== "__all__" && (m.folder ?? "") !== (folder === "__none__" ? "" : folder)) return false;
      if (tagFilter && !m.tags?.includes(tagFilter)) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!m.filename.toLowerCase().includes(needle)
          && !(m.alt_text ?? "").toLowerCase().includes(needle)
          && !m.tags?.some((t) => t.toLowerCase().includes(needle))) return false;
      }
      return true;
    });
  }, [media, folder, tagFilter, q]);

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const folderClean = uploadFolder.trim() ? slugify(uploadFolder.trim()) : null;
      for (const file of Array.from(files)) {
        const path = `media/${Date.now()}-${slugify(file.name)}`;
        const { error: upErr } = await supabase.storage.from("products").upload(path, file);
        if (upErr) throw upErr;
        const url = supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("media_assets").insert({
          url, filename: file.name, mime_type: file.type,
          uploaded_by: user?.id, folder: folderClean, tags: [],
        });
      }
      toast.success(`${files.length} mídia(s) enviada(s)`);
      qc.invalidateQueries({ queryKey: ["studio-media"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const copy = (url: string) => { navigator.clipboard.writeText(url); toast.success("URL copiada"); };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta mídia?")) return;
    await supabase.from("media_assets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["studio-media"] });
  };

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="eyebrow mb-3">Studio · Biblioteca</div>
          <h1 className="font-display text-5xl">Mídia</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">Imagens da maison organizadas por pasta e tags editoriais.</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="eyebrow block mb-1.5">Pasta destino</label>
            <input value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="ex: campanhas"
              className="border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground w-40" />
          </div>
          <label className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-sm cursor-pointer hover:bg-foreground hover:text-background transition-colors">
            <Upload className="size-4" /> {busy ? "Enviando…" : "Enviar"}
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} disabled={busy} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-10 border-t border-border pt-8">
        {/* Sidebar */}
        <aside className="space-y-8">
          <div>
            <div className="eyebrow mb-3 flex items-center gap-2"><FolderOpen className="size-3.5" /> Pastas</div>
            <ul className="space-y-1.5 text-sm">
              <FolderItem active={folder === "__all__"} onClick={() => setFolder("__all__")}>Tudo</FolderItem>
              <FolderItem active={folder === "__none__"} onClick={() => setFolder("__none__")}>Sem pasta</FolderItem>
              {folders.map((f) => (
                <FolderItem key={f} active={folder === f} onClick={() => setFolder(f)}>{f}</FolderItem>
              ))}
            </ul>
          </div>
          {allTags.length > 0 && (
            <div>
              <div className="eyebrow mb-3 flex items-center gap-2"><TagIcon className="size-3.5" /> Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {tagFilter && (
                  <button onClick={() => setTagFilter(null)} className="text-[10px] border border-foreground bg-foreground text-background px-2 py-1">Limpar ×</button>
                )}
                {allTags.map((t) => (
                  <button key={t} onClick={() => setTagFilter(t === tagFilter ? null : t)}
                    className={`text-[10px] border px-2 py-1 ${tagFilter === t ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Grid */}
        <div className="space-y-6">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, alt, tag…"
            className="w-full border-b border-border bg-transparent px-1 py-2 text-sm focus:outline-none focus:border-foreground"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <div key={m.id} className="group border border-border">
                <button onClick={() => setEditing(m)} className="block w-full aspect-square overflow-hidden bg-[color:var(--muted)]">
                  <img src={m.url} alt={m.alt_text ?? m.filename} className="w-full h-full object-cover" />
                </button>
                <div className="p-3 space-y-2">
                  <div className="text-xs truncate text-muted-foreground">{m.filename}</div>
                  {m.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0, 3).map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 bg-[color:var(--muted)]">{t}</span>)}
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => copy(m.url)} className="text-xs flex items-center gap-1 hover:text-foreground text-muted-foreground"><Copy className="size-3" /></button>
                    <button onClick={() => setEditing(m)} className="text-xs flex items-center gap-1 hover:text-foreground text-muted-foreground"><Pencil className="size-3" /></button>
                    <button onClick={() => remove(m.id)} className="ml-auto text-xs hover:text-foreground text-muted-foreground"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-20 border border-dashed border-border">
                Nenhuma mídia encontrada.
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <AssetEditor asset={editing} onClose={() => setEditing(null)} onSaved={() => {
          qc.invalidateQueries({ queryKey: ["studio-media"] });
          setEditing(null);
        }} />
      )}
    </div>
  );
}

function FolderItem({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick}
        className={`w-full text-left px-3 py-1.5 border-l-2 ${active ? "border-foreground bg-[color:var(--muted)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
        {children}
      </button>
    </li>
  );
}

function AssetEditor({ asset, onClose, onSaved }: { asset: Asset; onClose: () => void; onSaved: () => void }) {
  const [alt, setAlt] = useState(asset.alt_text ?? "");
  const [folder, setFolder] = useState(asset.folder ?? "");
  const [tagsInput, setTagsInput] = useState((asset.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("media_assets").update({
      alt_text: alt || null, folder: folder.trim() ? slugify(folder.trim()) : null, tags,
    }).eq("id", asset.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mídia atualizada");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div className="bg-background border-l border-border w-full max-w-lg h-full overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="eyebrow mb-2">Mídia</div>
            <h2 className="font-display text-2xl truncate max-w-[300px]">{asset.filename}</h2>
          </div>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="aspect-square overflow-hidden bg-[color:var(--muted)] mb-6">
          <img src={asset.url} alt={alt} className="w-full h-full object-contain" />
        </div>
        <div className="space-y-5">
          <div>
            <label className="eyebrow block mb-2">Texto alternativo (acessibilidade)</label>
            <input value={alt} onChange={(e) => setAlt(e.target.value)}
              className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="eyebrow block mb-2">Pasta</label>
            <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="ex: campanhas"
              className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="eyebrow block mb-2">Tags (separadas por vírgula)</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="hero, editorial, outono"
              className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <button onClick={save} disabled={saving}
            className="w-full text-xs px-4 py-2.5 bg-foreground text-background hover:opacity-80 disabled:opacity-50">
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
