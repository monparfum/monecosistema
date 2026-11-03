import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { categoriesQuery, KINDS, type PostKind } from "@/lib/posts";
import { plainText } from "@/lib/post-body";
import { PostBody } from "@/components/mon/posts";

export const Route = createFileRoute("/_studio/studio/publicacoes/$id")({ component: PostEditor });

type Form = {
  kind: PostKind; title: string; slug: string; excerpt: string; content: string; cover_url: string; cover_alt: string;
  category_id: string; tags: string; author: string; status: "rascunho" | "publicado"; published_at: string;
  seo_title: string; seo_description: string;
};

const NEW: Record<string, PostKind> = { "nova-noticia": "noticia", "novo-blog": "blog" };
const SLUG = /^[a-z0-9-]{1,120}$/;
const input = "w-full border border-border bg-background px-3 py-2 text-sm";
// datetime-local trabalha no horário local; o banco guarda ISO (UTC)
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function PostEditor() {
  const { id } = Route.useParams();
  const isNew = id in NEW;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const { data: existing, error } = useQuery({
    queryKey: ["studio-post", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (isNew) {
      setForm({ kind: NEW[id], title: "", slug: "", excerpt: "", content: "", cover_url: "", cover_alt: "", category_id: "", tags: "", author: "Equipe MON", status: "rascunho", published_at: "", seo_title: "", seo_description: "" });
    } else if (existing) {
      setForm({
        kind: existing.kind as PostKind, title: existing.title, slug: existing.slug, excerpt: existing.excerpt ?? "", content: existing.content,
        cover_url: existing.cover_url ?? "", cover_alt: existing.cover_alt ?? "", category_id: existing.category_id ?? "", tags: existing.tags.join(", "),
        author: existing.author ?? "", status: existing.status as Form["status"], published_at: toLocal(existing.published_at),
        seo_title: existing.seo_title ?? "", seo_description: existing.seo_description ?? "",
      });
    }
  }, [id, isNew, existing]);

  const { data: cats = [] } = useQuery({ ...categoriesQuery(form?.kind ?? "noticia"), enabled: !!form });

  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  if (!isNew && existing === null) return <p>Publicação não encontrada. <Link to="/studio/publicacoes" className="underline">Voltar</Link></p>;
  if (!form) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const k = KINDS[form.kind];
  const set = <K extends keyof Form>(key: K, v: Form[K]) => setForm((f) => (f ? { ...f, [key]: v } : f));
  const setTitle = (v: string) => setForm((f) => (f ? { ...f, title: v, slug: slugTouched ? f.slug : slugify(v).slice(0, 120) } : f));
  const seoTitle = form.seo_title || form.title;
  const seoDesc = form.seo_description || form.excerpt || plainText(form.content).slice(0, 160);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem (JPG, PNG ou WebP).");
    if (file.size > 3 * 1024 * 1024) return toast.error("Imagem acima de 3 MB. Reduza antes de enviar para o site ficar leve.");
    setBusy(true);
    const path = `posts/${Date.now()}-${slugify(file.name)}`;
    const { error: upErr } = await supabase.storage.from("products").upload(path, file);
    setBusy(false);
    if (upErr) return toast.error(upErr.message);
    set("cover_url", supabase.storage.from("products").getPublicUrl(path).data.publicUrl);
    toast.success("Capa enviada");
  };

  const save = async (status?: Form["status"]) => {
    const f = { ...form, status: status ?? form.status };
    if (!f.title.trim()) return toast.error("Dê um título.");
    if (!SLUG.test(f.slug)) return toast.error("Endereço (slug) só com letras minúsculas, números e hífen.");
    if (f.cover_url && !f.cover_alt.trim()) return toast.error("Descreva a capa (texto alternativo) — conta para SEO e acessibilidade.");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const row = {
      kind: f.kind, title: f.title.trim(), slug: f.slug, excerpt: f.excerpt.trim() || null, content: f.content,
      cover_url: f.cover_url.trim() || null, cover_alt: f.cover_alt.trim() || null, category_id: f.category_id || null,
      tags: f.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 20), author: f.author.trim() || null,
      status: f.status, published_at: f.published_at ? new Date(f.published_at).toISOString() : null,
      seo_title: f.seo_title.trim() || null, seo_description: f.seo_description.trim() || null, updated_by: user?.id ?? null,
    };
    const res = isNew
      ? await supabase.from("posts").insert(row).select("id").single()
      : await supabase.from("posts").update(row).eq("id", id).select("id").single();
    setBusy(false);
    if (res.error) return toast.error(res.error.code === "23505" ? "Já existe uma publicação com esse endereço." : res.error.message);
    toast.success(f.status === "publicado" ? "Publicado" : "Rascunho salvo");
    qc.invalidateQueries({ queryKey: ["studio-posts"] });
    qc.invalidateQueries({ queryKey: ["posts"] });
    qc.invalidateQueries({ queryKey: ["post"] });
    qc.invalidateQueries({ queryKey: ["studio-post", id] });
    if (isNew) navigate({ to: "/studio/publicacoes/$id", params: { id: res.data.id } });
    else set("status", f.status);
  };

  const remove = async () => {
    if (!confirm("Excluir esta publicação? Não dá para desfazer.")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["studio-posts"] });
    navigate({ to: "/studio/publicacoes" });
  };

  const Count = ({ v, max }: { v: string; max: number }) => <span className={`text-[11px] ${v.length > max ? "text-destructive" : "text-muted-foreground"}`}>{v.length}/{max}</span>;

  return (
    <div className="space-y-8 max-w-[1100px]">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <Link to="/studio/publicacoes" className="eyebrow text-muted-foreground hover:text-foreground">← Notícias e Blog</Link>
          <h1 className="font-display text-4xl mt-2">{isNew ? (form.kind === "noticia" ? "Nova notícia" : "Novo post do blog") : form.title || "Sem título"}</h1>
          <div className="text-xs text-muted-foreground mt-1">{k.plural} · {form.status === "publicado" ? "Publicado" : "Rascunho"}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isNew && <button onClick={remove} className="text-xs px-3 py-2 border border-border text-destructive">Excluir</button>}
          {!isNew && form.status === "publicado" && <a href={`${k.base}/${form.slug}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-2 border border-border">Ver no site →</a>}
          <button disabled={busy} onClick={() => save("rascunho")} className="text-xs px-3 py-2 border border-border">Salvar rascunho</button>
          <button disabled={busy} onClick={() => save("publicado")} className="text-xs px-3 py-2 bg-foreground text-background">{form.status === "publicado" ? "Atualizar" : "Publicar"}</button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 min-w-0">
          <label className="block space-y-1"><span className="eyebrow">Título</span>
            <input className={`${input} text-lg`} value={form.title} maxLength={200} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="block space-y-1"><span className="eyebrow">Endereço</span>
            <div className="flex items-center text-sm"><span className="text-muted-foreground pr-1">{k.base}/</span>
              <input className={input} value={form.slug} maxLength={120} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div></label>
          <label className="block space-y-1"><span className="eyebrow flex justify-between">Resumo <Count v={form.excerpt} max={400} /></span>
            <textarea className={input} rows={2} value={form.excerpt} maxLength={400} onChange={(e) => set("excerpt", e.target.value)} placeholder="Uma ou duas frases. Aparece na listagem e no Google se a descrição SEO ficar vazia." /></label>
          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <span className="eyebrow">Texto</span>
              <button onClick={() => setPreview((v) => !v)} className="text-xs border-b border-foreground">{preview ? "Editar" : "Prévia"}</button>
            </div>
            {preview ? (
              <div className="mon border border-border p-6 bg-white"><PostBody text={form.content} /></div>
            ) : (
              <textarea className={`${input} font-mono`} rows={20} value={form.content} maxLength={100000} onChange={(e) => set("content", e.target.value)} />
            )}
            <p className="text-[11px] text-muted-foreground">Linha em branco = novo parágrafo · <code>## Subtítulo</code> · <code>### Subtítulo menor</code> · <code>- item de lista</code> · <code>**negrito**</code> · <code>[texto](/cursos)</code> link · <code>![descrição](url)</code> imagem</p>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="space-y-2 border border-border p-4">
            <div className="eyebrow">Publicação</div>
            <label className="block text-xs space-y-1"><span>Data de publicação</span>
              <input type="datetime-local" className={input} value={form.published_at} onChange={(e) => set("published_at", e.target.value)} /></label>
            <p className="text-[11px] text-muted-foreground">Vazio = agora. Data futura = agendado (só aparece no site nesse dia).</p>
            <label className="block text-xs space-y-1"><span>Autor</span>
              <input className={input} value={form.author} maxLength={120} onChange={(e) => set("author", e.target.value)} /></label>
          </div>

          <div className="space-y-2 border border-border p-4">
            <div className="eyebrow flex justify-between">Categoria <Link to="/studio/categorias" className="normal-case tracking-normal underline">gerenciar</Link></div>
            <select className={input} value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">Sem categoria</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="block text-xs space-y-1"><span>Tags (separadas por vírgula)</span>
              <input className={input} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="baunilha, gourmand" /></label>
          </div>

          <div className="space-y-2 border border-border p-4">
            <div className="eyebrow">Capa</div>
            {form.cover_url && <img src={form.cover_url} alt="" className="w-full aspect-video object-cover border border-border" />}
            <input className={input} value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="URL da imagem ou envie abaixo" />
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} className="text-xs" aria-label="Enviar capa" />
            <label className="block text-xs space-y-1"><span>Descrição da imagem (alt)</span>
              <input className={input} value={form.cover_alt} maxLength={200} onChange={(e) => set("cover_alt", e.target.value)} placeholder="Ex.: Aluna sentindo fita olfativa" /></label>
            <p className="text-[11px] text-muted-foreground">Horizontal, até 1600 px e 3 MB (ideal: WebP com menos de 200 KB).</p>
          </div>

          <div className="space-y-2 border border-border p-4">
            <div className="eyebrow">SEO (Google)</div>
            <label className="block text-xs space-y-1"><span className="flex justify-between">Título no Google <Count v={form.seo_title} max={60} /></span>
              <input className={input} value={form.seo_title} maxLength={70} onChange={(e) => set("seo_title", e.target.value)} placeholder={form.title} /></label>
            <label className="block text-xs space-y-1"><span className="flex justify-between">Descrição no Google <Count v={form.seo_description} max={160} /></span>
              <textarea className={input} rows={3} value={form.seo_description} maxLength={170} onChange={(e) => set("seo_description", e.target.value)} placeholder="Vazio = usa o resumo" /></label>
            <div className="border border-border p-3 bg-background" aria-label="Prévia no Google">
              <div className="text-[11px] text-muted-foreground truncate">{location.host}{k.base}/{form.slug || "…"}</div>
              <div className="text-[15px] text-[#1a0dab] leading-snug">{seoTitle.slice(0, 60) || "Título"}{seoTitle.length > 60 ? "…" : ""}</div>
              <div className="text-xs text-muted-foreground mt-1">{seoDesc.slice(0, 160) || "Descrição"}{seoDesc.length > 160 ? "…" : ""}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
