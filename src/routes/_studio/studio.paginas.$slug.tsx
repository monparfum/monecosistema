import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BLOCK_DEFS, type Block } from "@/components/blocks";
import { ChevronUp, ChevronDown, Copy, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_studio/studio/paginas/$slug")({ component: PageEditor });

const defaultContent: Record<string, Record<string, unknown>> = {
  hero: { eyebrow: "", title: "Título do hero", subtitle: "", ctaLabel: "", ctaHref: "/", image: "/src/assets/editorial-hero.jpg" },
  banner: { eyebrow: "Capítulo", title: "Título do banner", body: "Texto editorial.", image: "/src/assets/editorial-experiencias.jpg", ctaLabel: "", ctaHref: "", reverse: false },
  text: { eyebrow: "Manifesto", body: "Escreva o texto editorial aqui." },
  quote: { body: "Uma frase memorável.", attribution: "Autor · cargo" },
  grid: { eyebrow: "Chapitres", items: [
    { title: "Item 1", subtitle: "Subtítulo", href: "/", image: "/src/assets/editorial-experiencias.jpg" },
    { title: "Item 2", subtitle: "Subtítulo", href: "/", image: "/src/assets/editorial-workshops.jpg" },
    { title: "Item 3", subtitle: "Subtítulo", href: "/", image: "/src/assets/editorial-cursos.jpg" },
  ]},
  cards_list: { eyebrow: "Coleção", columns: 2, items: [
    { eyebrow: "Tag", title: "Card 1", body: "Descrição editorial.", meta: "", ctaLabel: "", ctaHref: "" },
    { eyebrow: "Tag", title: "Card 2", body: "Descrição editorial.", meta: "", ctaLabel: "", ctaHref: "" },
  ]},
  text_columns: { columns: 3, items: [
    { title: "Pilar 1", body: "Descrição curta." },
    { title: "Pilar 2", body: "Descrição curta." },
    { title: "Pilar 3", body: "Descrição curta." },
  ]},
  featured_products: { eyebrow: "La Collection", title: "Edições autorais", limit: 3 },
  cta: { eyebrow: "", title: "Faça parte", body: "", ctaLabel: "Cadastrar", ctaHref: "/cadastro" },
  image_text: { image: "/src/assets/editorial-hero.jpg", eyebrow: "", title: "Título", body: "", reverse: false },
  newsletter: { eyebrow: "", title: "Receba nosso diário editorial.", placeholder: "seu e-mail", ctaLabel: "Assinar" },
  faq: { eyebrow: "FAQ", title: "Perguntas frequentes", items: [
    { question: "Pergunta 1?", answer: "Resposta detalhada." },
    { question: "Pergunta 2?", answer: "Resposta detalhada." },
  ]},
};

function PageEditor() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const { data: page } = useQuery({
    queryKey: ["studio-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: blocks } = useQuery({
    queryKey: ["studio-blocks", page?.id],
    queryFn: async () => {
      if (!page) return [];
      const { data, error } = await supabase
        .from("page_blocks").select("*").eq("page_id", page.id).order("position");
      if (error) throw error;
      return data as Block[];
    },
    enabled: !!page,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["studio-blocks", page?.id] });

  const addBlock = async (type: string) => {
    if (!page || !blocks) return;
    const { data, error } = await supabase.from("page_blocks").insert({
      page_id: page.id, type, position: blocks.length, content: (defaultContent[type] ?? {}) as never,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setAdding(false);
    setSelected(data.id);
    invalidate();
  };

  const move = async (block: Block, dir: -1 | 1) => {
    if (!blocks) return;
    const i = blocks.findIndex((b) => b.id === block.id);
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const other = blocks[j];
    await supabase.from("page_blocks").update({ position: j }).eq("id", block.id);
    await supabase.from("page_blocks").update({ position: i }).eq("id", other.id);
    invalidate();
  };

  const duplicate = async (block: Block) => {
    if (!page || !blocks) return;
    const { error } = await supabase.from("page_blocks").insert({
      page_id: page.id, type: block.type, position: blocks.length, content: block.content as never,
    });
    if (error) { toast.error(error.message); return; }
    invalidate();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este bloco?")) return;
    await supabase.from("page_blocks").delete().eq("id", id);
    if (selected === id) setSelected(null);
    invalidate();
  };

  const updateContent = async (id: string, content: Record<string, unknown>) => {
    await supabase.from("page_blocks").update({ content: content as never }).eq("id", id);
    invalidate();
  };

  const selBlock = blocks?.find((b) => b.id === selected) ?? null;

  if (!page) return <div className="text-muted-foreground">Carregando…</div>;

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Link to="/studio/paginas" className="eyebrow text-muted-foreground hover:text-foreground">← Páginas</Link>
          <h1 className="font-display text-4xl mt-2">{page.title}</h1>
          <div className="text-xs text-muted-foreground mt-1">/{page.slug === "home" ? "" : page.slug}</div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`eyebrow ${page.status === "published" ? "text-foreground" : "text-muted-foreground"}`}>
            {page.status === "published" ? "Publicada" : "Rascunho"}
          </span>
          <a
            href={page.slug === "home" ? "/" : `/${page.slug}`}
            target="_blank" rel="noreferrer"
            className="text-xs eyebrow border-b border-foreground"
          >Visualizar →</a>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-8 border-t border-border pt-8">
        {/* Blocks column */}
        <div className="space-y-3">
          {blocks?.map((b) => {
            const def = BLOCK_DEFS.find((d) => d.type === b.type);
            return (
              <div
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={`border p-5 cursor-pointer transition-colors ${selected === b.id ? "border-foreground bg-[color:var(--muted)]/40" : "border-border hover:bg-[color:var(--muted)]/20"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="eyebrow text-muted-foreground">{def?.label ?? b.type}</div>
                    <div className="font-display text-lg mt-1 truncate max-w-md">
                      {String(b.content.title ?? b.content.eyebrow ?? "Sem título")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IconBtn onClick={(e) => { e.stopPropagation(); move(b, -1); }} label="Subir"><ChevronUp className="size-4" /></IconBtn>
                    <IconBtn onClick={(e) => { e.stopPropagation(); move(b, 1); }} label="Descer"><ChevronDown className="size-4" /></IconBtn>
                    <IconBtn onClick={(e) => { e.stopPropagation(); duplicate(b); }} label="Duplicar"><Copy className="size-4" /></IconBtn>
                    <IconBtn onClick={(e) => { e.stopPropagation(); remove(b.id); }} label="Excluir"><Trash2 className="size-4" /></IconBtn>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setAdding(true)}
            className="w-full border border-dashed border-border py-6 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="size-4" /> Adicionar bloco
          </button>
        </div>

        {/* Inspector */}
        <aside className="border border-border p-6 sticky top-6 h-fit">
          {selBlock ? (
            <BlockInspector block={selBlock} onChange={(c) => updateContent(selBlock.id, c)} />
          ) : (
            <div className="text-sm text-muted-foreground">
              <div className="eyebrow mb-3">Inspector</div>
              Selecione um bloco para editar.
            </div>
          )}
        </aside>
      </div>

      {adding && <AddBlockModal onPick={addBlock} onClose={() => setAdding(false)} />}
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="p-1.5 hover:text-foreground">{children}</button>
  );
}

function AddBlockModal({ onPick, onClose }: { onPick: (t: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-8" onClick={onClose}>
      <div className="bg-background border border-border max-w-3xl w-full p-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Studio</div>
            <h2 className="font-display text-3xl">Adicionar bloco</h2>
          </div>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {BLOCK_DEFS.map((d) => (
            <button
              key={d.type}
              onClick={() => onPick(d.type)}
              className="border border-border p-6 text-left hover:border-foreground transition-colors"
            >
              <div className="font-display text-xl">{d.label}</div>
              <div className="text-sm text-muted-foreground mt-2">{d.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockInspector({ block, onChange }: { block: Block; onChange: (c: Record<string, unknown>) => void }) {
  const [local, setLocal] = useState(block.content);
  useEffect(() => { setLocal(block.content); }, [block.id, block.content]);

  const debouncedSave = (next: Record<string, unknown>) => {
    setLocal(next);
    // simple debounce
    clearTimeout((debouncedSave as unknown as { t?: ReturnType<typeof setTimeout> }).t);
    (debouncedSave as unknown as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(() => onChange(next), 500);
  };

  const def = BLOCK_DEFS.find((d) => d.type === block.type);

  const Field = (k: string, label: string, multiline = false) => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      {multiline ? (
        <textarea
          value={String(local[k] ?? "")}
          onChange={(e) => debouncedSave({ ...local, [k]: e.target.value })}
          rows={4}
          className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground"
        />
      ) : (
        <input
          value={String(local[k] ?? "")}
          onChange={(e) => debouncedSave({ ...local, [k]: e.target.value })}
          className="w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground"
        />
      )}
    </div>
  );

  const updateItem = (i: number, k: string, v: string) => {
    const items = [...((local.items as Array<Record<string, string>>) ?? [])];
    items[i] = { ...items[i], [k]: v };
    debouncedSave({ ...local, items });
  };
  const addItem = (template: Record<string, string>) => {
    const items = [...((local.items as Array<Record<string, string>>) ?? []), template];
    debouncedSave({ ...local, items });
  };
  const removeItem = (i: number) => {
    const items = ((local.items as Array<Record<string, string>>) ?? []).filter((_, idx) => idx !== i);
    debouncedSave({ ...local, items });
  };

  const ItemsEditor = (keys: readonly string[], template: Record<string, string>, labels?: Record<string, string>) => (
    <div className="space-y-3">
      <div className="eyebrow">Itens</div>
      {((local.items as Array<Record<string, string>>) ?? []).map((it, i) => (
        <div key={i} className="border border-border p-3 space-y-2 relative">
          <button onClick={() => removeItem(i)} className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground" aria-label="Remover">×</button>
          {keys.map((k) => (
            <input key={k} placeholder={labels?.[k] ?? k} value={String(it[k] ?? "")}
              onChange={(e) => updateItem(i, k, e.target.value)}
              className="w-full border border-border bg-transparent px-2 py-1 text-xs" />
          ))}
        </div>
      ))}
      <button onClick={() => addItem(template)} className="w-full border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground">+ Adicionar item</button>
    </div>
  );

  const ColumnsField = (
    <div>
      <label className="eyebrow block mb-2">Colunas</label>
      <input type="number" min={1} max={4} value={Number(local.columns ?? 3)}
        onChange={(e) => debouncedSave({ ...local, columns: Number(e.target.value) })}
        className="w-full border border-border bg-transparent px-3 py-2 text-sm" />
    </div>
  );

  const fields = (() => {
    switch (block.type) {
      case "hero": return <>{Field("eyebrow", "Eyebrow")}{Field("title", "Título", true)}{Field("subtitle", "Subtítulo", true)}{Field("ctaLabel", "CTA — texto")}{Field("ctaHref", "CTA — link")}{Field("image", "Imagem (URL)")}</>;
      case "banner": return <>{Field("eyebrow", "Eyebrow")}{Field("title", "Título")}{Field("body", "Corpo", true)}{Field("image", "Imagem (URL)")}{Field("ctaLabel", "CTA — texto")}{Field("ctaHref", "CTA — link")}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={local.reverse === true} onChange={(e) => debouncedSave({ ...local, reverse: e.target.checked })} />Texto à esquerda</label></>;
      case "text": return <>{Field("eyebrow", "Eyebrow")}{Field("body", "Corpo do texto", true)}</>;
      case "quote": return <>{Field("body", "Citação", true)}{Field("attribution", "Atribuição")}</>;
      case "cards_list": return <>{Field("eyebrow", "Eyebrow")}{ColumnsField}{ItemsEditor(["eyebrow","title","body","meta","ctaLabel","ctaHref"], { eyebrow: "", title: "Novo card", body: "", meta: "", ctaLabel: "", ctaHref: "" })}</>;
      case "text_columns": return <>{Field("eyebrow", "Eyebrow")}{ColumnsField}{ItemsEditor(["title","body"], { title: "Pilar", body: "" })}</>;
      case "newsletter": return <>{Field("eyebrow", "Eyebrow")}{Field("title", "Título", true)}{Field("placeholder", "Placeholder")}{Field("ctaLabel", "Botão")}</>;
      case "faq": return <>{Field("eyebrow", "Eyebrow")}{Field("title", "Título")}{ItemsEditor(["question","answer"], { question: "Nova pergunta?", answer: "" }, { question: "Pergunta", answer: "Resposta" })}</>;
      case "grid": return (
        <>
          {Field("eyebrow", "Eyebrow")}
          <div className="space-y-4">
            <div className="eyebrow">Itens</div>
            {(Array.isArray(local.items) ? local.items : []).map((it: Record<string, string>, i: number) => (
              <div key={i} className="border border-border p-3 space-y-2">
                {(["title","subtitle","href","image"] as const).map((k) => (
                  <input
                    key={k}
                    placeholder={k}
                    value={String(it[k] ?? "")}
                    onChange={(e) => {
                      const items = [...(local.items as Array<Record<string, string>>)];
                      items[i] = { ...items[i], [k]: e.target.value };
                      debouncedSave({ ...local, items });
                    }}
                    className="w-full border border-border bg-transparent px-2 py-1 text-xs"
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      );
      case "featured_products": return <>{Field("eyebrow", "Eyebrow")}{Field("title", "Título")}<div><label className="eyebrow block mb-2">Quantidade</label><input type="number" min={1} max={9} value={Number(local.limit ?? 3)} onChange={(e) => debouncedSave({ ...local, limit: Number(e.target.value) })} className="w-full border border-border bg-transparent px-3 py-2 text-sm" /></div></>;
      case "cta": return <>{Field("eyebrow", "Eyebrow")}{Field("title", "Título")}{Field("body", "Corpo", true)}{Field("ctaLabel", "CTA — texto")}{Field("ctaHref", "CTA — link")}</>;
      case "image_text": return <>{Field("eyebrow", "Eyebrow")}{Field("title", "Título")}{Field("body", "Corpo", true)}{Field("image", "Imagem (URL)")}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={local.reverse === true} onChange={(e) => debouncedSave({ ...local, reverse: e.target.checked })} />Inverter (imagem à direita)</label></>;
      default: return null;
    }
  })();

  return (
    <div className="space-y-5">
      <div>
        <div className="eyebrow text-muted-foreground">Editando</div>
        <div className="font-display text-xl mt-1">{def?.label ?? block.type}</div>
      </div>
      <div className="space-y-4 pt-4 border-t border-border">{fields}</div>
      <p className="text-xs text-muted-foreground pt-2 border-t border-border">Alterações são salvas automaticamente.</p>
    </div>
  );
}
