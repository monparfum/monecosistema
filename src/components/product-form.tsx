import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { listMemberCourses, syncMemberProduct } from "@/lib/members.functions";
import type { Json } from "@/integrations/supabase/types";
import type { Details } from "@/components/mon/ui";

// Remove campos vazios do conteúdo da página (o site esconde o que não foi preenchido)
const cleanDetails = (d: Details) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== "" && v !== undefined && v !== null && v !== false));

const inputCls = "w-full border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground";

// Conteúdo editorial da página do produto no site (curso ou kit)
function SitePageEditor({ value, onChange }: { value: Details; onChange: (d: Details) => void }) {
  const set = (k: keyof Details, v: string | boolean) =>
    onChange({ ...value, [k]: v, ...(k === "kind" && v === "kit" ? { grupo: value.grupo ?? "criacao", cor: value.cor ?? "bois" } : {}) });
  const txt = (k: keyof Details, label: string, help?: string) => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <input className={inputCls} value={(value[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />
      {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
    </div>
  );
  const area = (k: keyof Details, label: string, help?: string) => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <textarea className={inputCls} rows={3} value={(value[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />
      {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
    </div>
  );
  const sel = (k: keyof Details, label: string, opts: [string, string][]) => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <select className={inputCls} value={(value[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
  return (
    <fieldset className="border border-border p-4 space-y-4">
      <legend className="eyebrow px-2">Página no site</legend>
      {sel("kind", "Onde aparece", [["", "Produtos › Outros produtos"], ["curso", "Cursos (página de curso)"], ["kit", "Produtos › kits e edições"]])}
      {value.kind === "curso" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {sel("estagio", "Estágio", [["", "—"], ["Iniciante", "Iniciante"], ["Intermediário", "Intermediário"], ["Avançado", "Avançado"]])}
            {sel("formato", "Formato", [["", "—"], ["Online", "Online"], ["Gravado", "Gravado"], ["Presencial", "Presencial"]])}
            {txt("nota", "Nota (ex.: 9,6)")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {txt("turma", "Próxima turma", "Ex.: 14 de novembro de 2026 ou Em breve")}
            {txt("badge", "Selo", "Ex.: Mais procurado, Novo")}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value.destaque} onChange={(e) => set("destaque", e.target.checked)} /> Destaque na home (Cursos em destaque)</label>
          {txt("dor", "Frase de abertura (a dor do aluno)")}
          {area("sub", "Subtítulo da página")}
          {area("aprende", "O que você vai aprender", "Um item por linha")}
          {txt("prereq", "Pré-requisito")}
          {txt("naoE", "Não é para você se…")}
        </>
      )}
      {value.kind === "kit" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {sel("grupo", "Grupo", [["criacao", "Kit de criação"], ["treino", "Kit de treinamento"], ["limitada", "Edição limitada"]])}
            {sel("cor", "Cor do cartão", [["bois", "Bois (marrom)"], ["jardin", "Jardin (verde)"], ["magnetic", "Magnetic (azul)"], ["heritage", "Heritage (vinho)"]])}
            {txt("titulo", "Nome no cartão", "Ex.: MON BOIS (vazio = nome do produto)")}
          </div>
          {area("resumo", "Resumo (no cartão)")}
          {area("desc", "Descrição (na página do kit)")}
          <div className="grid grid-cols-3 gap-4">
            {txt("topo", "Notas de topo")}
            {txt("coracao", "Notas de coração")}
            {txt("fundo", "Notas de fundo")}
          </div>
        </>
      )}
    </fieldset>
  );
}

type Product = Tables<"products">;

export const DELIVERY: { value: Product["delivery_type"]; label: string; hint: string }[] = [
  { value: "physical", label: "Físico", hint: "Vai para a expedição (Melhor Envio)" },
  { value: "digital", label: "Digital", hint: "Libera cursos na área de membros (acesso por email)" },
  { value: "hybrid", label: "Híbrido", hint: "Kit enviado + acesso liberado" },
];

const toForm = (p?: Product) => ({
  name: p?.name ?? "", sku: p?.sku ?? "", brand: p?.brand ?? "", description: p?.description ?? "", notes: p?.notes ?? "",
  fragrance_family: p?.fragrance_family ?? "amadeirado", category_id: p?.category_id ?? "",
  price: p ? p.price_cents / 100 : 0, stock: p?.stock ?? 0, volume_ml: p?.volume_ml ?? 100,
  weight_g: p?.weight_g ?? 300, length_cm: p?.length_cm ?? 16, width_cm: p?.width_cm ?? 11, height_cm: p?.height_cm ?? 6,
  low_stock_threshold: p?.low_stock_threshold ?? 3,
  delivery_type: p?.delivery_type ?? ("physical" as Product["delivery_type"]),
  member_course_ids: p?.member_course_ids ?? ([] as string[]),
  compare_at: p?.compare_at_cents ? p.compare_at_cents / 100 : ("" as number | string),
  coming_soon: p?.coming_soon ?? false,
  details: ((p?.details ?? {}) as Details),
  featured: p?.featured ?? false, active: p?.active ?? true,
});

// Cursos criados na área de membros; o comprador recebe acesso a todos os marcados
function CoursePicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["member-courses"], queryFn: () => listMemberCourses() });
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div>
      <div className="eyebrow mb-2">Cursos liberados na área de membros</div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando cursos…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : !data?.configured ? (
        <p className="text-sm text-destructive">Área de membros não configurada (MEMBERS_AREA_API_URL / MEMBERS_AREA_TOKEN). Veja Administração › Integrações.</p>
      ) : !data.courses.length ? (
        <p className="text-sm text-muted-foreground">Nenhum curso criado na área de membros ainda. Crie o curso lá e recarregue.</p>
      ) : (
        <div className="border border-border divide-y divide-border max-h-56 overflow-auto">
          {data.courses.map((c) => (
            <label key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
              <input type="checkbox" checked={value.includes(c.id)} onChange={() => toggle(c.id)} />
              <span className="flex-1">{c.name}</span>
              {c.status !== "published" && <span className="text-xs text-muted-foreground">rascunho</span>}
            </label>
          ))}
        </div>
      )}
      {!value.length && <p className="text-xs text-destructive mt-1">Marque pelo menos um curso.</p>}
    </div>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const { data: cats } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const [form, setForm] = useState(() => toForm(product));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let image_url = product?.image_url ?? null;
      if (file) {
        const path = `${Date.now()}-${slugify(file.name)}`;
        const { error: upErr } = await supabase.storage.from("products").upload(path, file);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
      }
      const int = (v: number | string) => Math.max(0, Math.round(Number(v)));
      const row = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        brand: form.brand || null,
        description: form.description || null,
        notes: form.notes || null,
        fragrance_family: form.fragrance_family || null,
        volume_ml: int(form.volume_ml) || null,
        price_cents: Math.round(Number(form.price) * 100),
        stock: int(form.stock),
        weight_g: Math.max(1, int(form.weight_g)),
        length_cm: Math.max(1, int(form.length_cm)),
        width_cm: Math.max(1, int(form.width_cm)),
        height_cm: Math.max(1, int(form.height_cm)),
        low_stock_threshold: int(form.low_stock_threshold),
        delivery_type: form.delivery_type,
        member_course_ids: form.delivery_type === "physical" ? [] : form.member_course_ids,
        compare_at_cents: Number(form.compare_at) > 0 ? Math.round(Number(form.compare_at) * 100) : null,
        coming_soon: form.coming_soon,
        details: cleanDetails(form.details) as Json,
        category_id: form.category_id || null,
        featured: form.featured,
        active: form.active,
        image_url,
      };
      // "Em breve" pode ficar sem curso vinculado; à venda, digital/híbrido precisa liberar algo na área de membros
      if (row.delivery_type !== "physical" && !row.coming_soon && !row.member_course_ids.length) throw new Error("Escolha pelo menos um curso da área de membros (ou marque “Em breve”)");
      const { data: saved, error } = product
        ? await supabase.from("products").update(row).eq("id", product.id).select("id").single()
        : await supabase.from("products").insert({ ...row, slug: slugify(row.name) }).select("id").single();
      if (error) throw error;
      // Digital/híbrido (ou que deixou de ser): cadastra/atualiza o produto na área de membros com os cursos
      if (row.delivery_type !== "physical" || product?.delivery_type !== "physical") {
        try {
          const r = await syncMemberProduct({ data: { productId: saved.id } });
          if (!r.synced && row.delivery_type !== "physical") toast.warning("Produto salvo, mas a área de membros não está configurada");
        } catch (e) {
          toast.warning(`Produto salvo, mas não sincronizou com a área de membros: ${(e as Error).message}`);
        }
      }
      toast.success(product ? "Produto atualizado" : "Produto criado");
      navigate({ to: "/admin/produtos" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const inp = (k: keyof typeof form, label: string, type = "text", required = false) => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <input type={type} required={required} min={type === "number" ? 0 : undefined} step={k === "price" || k === "compare_at" ? "0.01" : undefined}
        value={form[k] as string | number} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="w-full border border-border bg-transparent px-3 py-2 focus:outline-none focus:border-foreground" />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        {inp("name", "Nome", "text", true)}
        {inp("sku", "SKU / Código")}
      </div>
      {inp("brand", "Marca")}
      <fieldset className="border border-border p-4 space-y-3">
        <legend className="eyebrow px-2">Tipo de produto</legend>
        <div className="grid grid-cols-3 gap-2">
          {DELIVERY.map((d) => (
            <label key={d.value} className="border border-border p-3 text-sm cursor-pointer has-[:checked]:border-foreground">
              <input type="radio" name="delivery_type" className="mr-2" checked={form.delivery_type === d.value}
                onChange={() => setForm({ ...form, delivery_type: d.value })} />
              <strong>{d.label}</strong>
              <span className="block text-xs text-muted-foreground mt-1">{d.hint}</span>
            </label>
          ))}
        </div>
        {form.delivery_type !== "physical" && (
          <CoursePicker value={form.member_course_ids} onChange={(ids) => setForm({ ...form, member_course_ids: ids })} />
        )}
      </fieldset>
      <div>
        <label className="eyebrow block mb-2">Descrição</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3} className="w-full border border-border bg-transparent px-3 py-2" />
      </div>
      {inp("notes", "Notas olfativas")}
      {form.delivery_type === "digital" ? (
        <div className="grid grid-cols-3 gap-4">{inp("price", "Preço (R$)", "number", true)}{inp("compare_at", "Preço “de” riscado (R$)", "number")}</div>
      ) : (
      <div className="grid grid-cols-3 gap-4">
        {inp("price", "Preço (R$)", "number", true)}
        {inp("compare_at", "Preço “de” riscado (R$)", "number")}
        {inp("stock", form.delivery_type === "hybrid" ? "Estoque (kits / vagas)" : "Estoque", "number", true)}
        {inp("low_stock_threshold", "Alerta estoque baixo", "number")}
      </div>
      )}
      {form.delivery_type !== "digital" && <fieldset className="border border-border p-4 space-y-3">
        <legend className="eyebrow px-2">Embalagem para frete</legend>
        <div className="grid grid-cols-5 gap-3">
          {inp("volume_ml", "Volume (ml)", "number")}
          {inp("weight_g", "Peso (g)", "number", true)}
          {inp("length_cm", "Compr. (cm)", "number", true)}
          {inp("width_cm", "Largura (cm)", "number", true)}
          {inp("height_cm", "Altura (cm)", "number", true)}
        </div>
      </fieldset>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="eyebrow block mb-2">Família</label>
          <select value={form.fragrance_family} onChange={(e) => setForm({ ...form, fragrance_family: e.target.value })}
            className="w-full border border-border bg-transparent px-3 py-2">
            <option value="floral">Floral</option>
            <option value="amadeirado">Amadeirado</option>
            <option value="citrico">Cítrico</option>
            <option value="oriental">Oriental</option>
          </select>
        </div>
        <div>
          <label className="eyebrow block mb-2">Categoria</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full border border-border bg-transparent px-3 py-2">
            <option value="">—</option>
            {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {product?.image_url && !file && <img src={product.image_url} alt="" className="size-16 object-cover" />}
        <div>
          <label className="eyebrow block mb-2">{product?.image_url ? "Trocar imagem" : "Imagem"}</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          Destaque na home
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Ativo na loja
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.coming_soon} onChange={(e) => setForm({ ...form, coming_soon: e.target.checked })} />
          Em breve (aparece no site, mas não vende)
        </label>
      </div>
      <SitePageEditor value={form.details} onChange={(details) => setForm({ ...form, details })} />
      <button disabled={busy} className="bg-foreground text-background px-6 py-2.5 text-sm disabled:opacity-50">
        {busy ? "Salvando…" : "Salvar produto"}
      </button>
    </form>
  );
}
