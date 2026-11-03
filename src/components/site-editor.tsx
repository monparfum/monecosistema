import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth-context";
import { useCatalog } from "@/components/mon/ui";
import { slugify } from "@/lib/format";
import { defaultsOf, pageDef, type Field, type ListItem, type PageValues } from "@/lib/site-schema";

// Editor de conteúdo de uma página do site (usado no Studio, com prévia ao vivo, e em Admin › Páginas do site)
const input = "w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground";
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function SiteContentEditor({ page, onSaved }: { page: string; onSaved?: () => void }) {
  const def = pageDef(page);
  const { user } = useAuth();
  const qc = useQueryClient();
  const defaults = useMemo(() => defaultsOf(page), [page]);

  const { data: saved, isLoading, error } = useQuery({
    queryKey: ["admin-site", page],
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("data").eq("page", page).maybeSingle();
      if (error) throw error;
      return (data?.data ?? {}) as PageValues;
    },
  });
  const [values, setValues] = useState<PageValues | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setValues(null); }, [page]);
  useEffect(() => { if (saved && !values) setValues({ ...defaults, ...saved }); }, [saved, values, defaults]);

  if (!def) return <p>Página não encontrada.</p>;
  if (error) return <p className="text-sm text-destructive">Não foi possível carregar o conteúdo ({(error as Error).message}). Rode o SQL do painel no Supabase (7e8-catalogo-contatos-painel.sql).</p>;
  if (isLoading || !values) return <p className="text-muted-foreground">Carregando…</p>;

  const set = (key: string, v: string | ListItem[]) => setValues({ ...values, [key]: v });
  const dirty = !same({ ...defaults, ...saved }, values);

  const save = async () => {
    setBusy(true);
    // Grava só o que difere do padrão (o padrão continua vindo do código)
    const data: PageValues = {};
    for (const [k, v] of Object.entries(values)) if (!same(v, defaults[k])) data[k] = v;
    const { error } = await supabase.from("site_content").upsert({ page, data: data as unknown as Json, updated_at: new Date().toISOString(), updated_by: user?.id ?? null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Publicado no site");
    await qc.invalidateQueries({ queryKey: ["admin-site", page] });
    qc.invalidateQueries({ queryKey: ["site-content", page] });
    qc.invalidateQueries({ queryKey: ["admin-site-updated"] });
    onSaved?.();
  };

  return (
    <div className="space-y-10">
      <p className="text-xs text-muted-foreground">Textos longos: deixe uma linha em branco entre parágrafos. Use **duas estrelas** para negrito.</p>
      {def.sections.map((s) => (
        <section key={s.title} className="space-y-5">
          <h2 className="eyebrow border-b border-border pb-2">{s.title}</h2>
          {s.fields.map((f) => (
            <FieldEditor key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)}
              onReset={same(values[f.key], f.default) ? undefined : () => set(f.key, f.default)} page={page} />
          ))}
        </section>
      ))}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-3 flex items-center justify-between gap-3 z-10">
        <span className="text-xs text-muted-foreground">{dirty ? "Alterações não salvas" : "Tudo salvo"}</span>
        <div className="flex gap-2">
          {dirty && <button onClick={() => setValues({ ...defaults, ...saved })} className="border border-border px-3 py-2 text-xs">Descartar</button>}
          <button onClick={save} disabled={busy || !dirty} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Publicando…" : "Salvar e publicar"}</button>
        </div>
      </div>
    </div>
  );
}

function Label({ field, onReset }: { field: Field; onReset?: () => void }) {
  return (
    <div className="flex justify-between items-baseline gap-2 mb-1.5">
      <label className="text-sm font-medium">{field.label}</label>
      {onReset && <button type="button" onClick={onReset} className="text-xs text-muted-foreground underline shrink-0">restaurar padrão</button>}
    </div>
  );
}

function FieldEditor({ field, value, onChange, onReset, page }: { field: Field; value: PageValues[string]; onChange: (v: string | ListItem[]) => void; onReset?: () => void; page: string }) {
  if (field.type === "list") {
    const items = Array.isArray(value) ? value : [];
    const update = (i: number, k: string, v: string) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
    const move = (i: number, d: number) => { const n = [...items]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); };
    return (
      <div>
        <Label field={field} onReset={onReset} />
        {field.help && <p className="text-xs text-muted-foreground mb-2">{field.help}</p>}
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="border border-border p-3 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>#{i + 1}</span>
                <span className="space-x-3">
                  {i > 0 && <button type="button" onClick={() => move(i, -1)}>↑ subir</button>}
                  {i < items.length - 1 && <button type="button" onClick={() => move(i, 1)}>↓ descer</button>}
                  <button type="button" className="text-destructive" onClick={() => onChange(items.filter((_, j) => j !== i))}>remover</button>
                </span>
              </div>
              {field.fields.map((sf) => (
                <div key={sf.key}>
                  {field.fields.length > 1 && <div className="text-xs text-muted-foreground mb-1">{sf.label}</div>}
                  {sf.type === "textarea"
                    ? <textarea className={input} rows={2} value={it[sf.key] ?? ""} onChange={(e) => update(i, sf.key, e.target.value)} />
                    : <input className={input} value={it[sf.key] ?? ""} onChange={(e) => update(i, sf.key, e.target.value)} />}
                </div>
              ))}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange([...items, Object.fromEntries(field.fields.map((sf) => [sf.key, ""]))])} className="mt-2 text-sm underline">+ adicionar</button>
      </div>
    );
  }

  const v = typeof value === "string" ? value : "";
  if (field.type === "image") return <ImageField field={field} value={v} onChange={onChange} onReset={onReset} page={page} />;
  if (field.type === "courses") return <CoursesField field={field} value={v} onChange={onChange} onReset={onReset} />;
  return (
    <div>
      <Label field={field} onReset={onReset} />
      {field.type === "textarea"
        ? <textarea className={input} rows={Math.min(14, Math.max(3, Math.ceil(v.length / 70) + v.split("\n").length))} value={v} onChange={(e) => onChange(e.target.value)} />
        : <input className={input} value={v} onChange={(e) => onChange(e.target.value)} />}
      {field.help && <p className="text-xs text-muted-foreground mt-1">{field.help}</p>}
    </div>
  );
}

// Escolha ordenada de cursos do catálogo (ids separados por vírgula)
function CoursesField({ field, value, onChange, onReset }: { field: Field; value: string; onChange: (v: string) => void; onReset?: () => void }) {
  const { cursos, isLoading } = useCatalog();
  const chosen = value.split(",").map((s) => s.trim()).filter(Boolean);
  const toggle = (id: string) => onChange((chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id]).join(","));
  const move = (id: string, dir: -1 | 1) => {
    const i = chosen.indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= chosen.length) return;
    const next = [...chosen]; [next[i], next[j]] = [next[j], next[i]]; onChange(next.join(","));
  };
  const ordered = [...cursos].sort((a, b) => (chosen.indexOf(a.id) + 1 || 999) - (chosen.indexOf(b.id) + 1 || 999));
  return (
    <div>
      <Label field={field} onReset={onReset} />
      {isLoading ? <p className="text-xs text-muted-foreground">Carregando cursos…</p> : !cursos.length ? <p className="text-xs text-muted-foreground">Nenhum curso ativo no catálogo.</p> : (
        <ul className="border border-border divide-y divide-border">
          {ordered.map((p) => {
            const pos = chosen.indexOf(p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <input type="checkbox" checked={pos >= 0} onChange={() => toggle(p.id)} />
                {p.image_url && <img src={p.image_url} alt="" className="size-8 object-cover shrink-0" />}
                <span className="flex-1 min-w-0 truncate">{p.name}</span>
                {pos >= 0 && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <b className="text-foreground">{pos + 1}º</b>
                    {pos > 0 && <button type="button" onClick={() => move(p.id, -1)}>↑</button>}
                    {pos < chosen.length - 1 && <button type="button" onClick={() => move(p.id, 1)}>↓</button>}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {field.help && <p className="text-xs text-muted-foreground mt-1">{field.help}</p>}
    </div>
  );
}

function ImageField({ field, value, onChange, onReset, page }: { field: Field; value: string; onChange: (v: string) => void; onReset?: () => void; page: string }) {
  const [uploading, setUploading] = useState(false);
  const [picking, setPicking] = useState(false);
  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem (JPG, PNG ou WebP)");
    if (file.size > 8 * 1024 * 1024) return toast.error("Imagem acima de 8 MB — reduza antes de enviar");
    setUploading(true);
    const path = `${page}/${field.key}-${Date.now()}-${slugify(file.name)}`;
    const { error } = await supabase.storage.from("site").upload(path, file, { cacheControl: "31536000", contentType: file.type });
    setUploading(false);
    if (error) return toast.error(error.message);
    onChange(supabase.storage.from("site").getPublicUrl(path).data.publicUrl);
  };
  return (
    <div>
      <Label field={field} onReset={onReset} />
      <div className="flex gap-4 items-start">
        <div className="w-36 aspect-[4/3] border border-border bg-muted bg-cover bg-center shrink-0" style={value ? { backgroundImage: `url(${value})` } : undefined} />
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <label className="inline-block border border-foreground px-3 py-1.5 cursor-pointer text-xs">
              {uploading ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            </label>
            <button type="button" onClick={() => setPicking(true)} className="border border-border px-3 py-1.5 text-xs">Da biblioteca</button>
          </div>
          {value && <button type="button" onClick={() => onChange("")} className="block text-xs text-destructive underline">remover foto</button>}
          <p className="text-xs text-muted-foreground">{field.help ?? "Sem foto, aparece um bloco neutro."} Ideal: até 2 MB.</p>
        </div>
      </div>
      {picking && <MediaPicker onPick={(url) => { onChange(url); setPicking(false); }} onClose={() => setPicking(false)} />}
    </div>
  );
}

// Reaproveita as fotos já enviadas (pasta "site" e biblioteca de Mídia do Studio)
function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["media-picker"],
    queryFn: async () => {
      const media = (await supabase.from("media_assets").select("url, filename").order("created_at", { ascending: false }).limit(200)).data ?? [];
      const folders = (await supabase.storage.from("site").list("", { limit: 100 })).data ?? [];
      const siteFiles = (await Promise.all(folders.filter((f) => !f.metadata).map(async (f) =>
        ((await supabase.storage.from("site").list(f.name, { limit: 200, sortBy: { column: "created_at", order: "desc" } })).data ?? [])
          .map((x) => ({ url: supabase.storage.from("site").getPublicUrl(`${f.name}/${x.name}`).data.publicUrl, filename: x.name }))))).flat();
      return [...siteFiles, ...media.map((m) => ({ url: m.url, filename: m.filename }))];
    },
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-6" onClick={onClose}>
      <div className="bg-background border border-border w-full max-w-3xl max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="font-display text-2xl">Escolher foto</div>
          <button onClick={onClose} className="text-sm underline">fechar</button>
        </div>
        {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !data?.length ? <p className="text-sm text-muted-foreground">Nenhuma foto enviada ainda.</p> : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {data.map((m) => (
              <button key={m.url} onClick={() => onPick(m.url)} className="aspect-square border border-border bg-cover bg-center hover:border-foreground" style={{ backgroundImage: `url(${m.url})` }} title={m.filename} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
