import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/produtos/novo")({ component: NewProduct });

function NewProduct() {
  const navigate = useNavigate();
  const { data: cats } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const [form, setForm] = useState({
    name: "", brand: "", description: "", notes: "", fragrance_family: "amadeirado",
    volume_ml: 100, price: 0, stock: 0, category_id: "", featured: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const path = `${Date.now()}-${slugify(file.name)}`;
        const { error: upErr } = await supabase.storage.from("products").upload(path, file);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("products").insert({
        slug: slugify(form.name),
        name: form.name,
        brand: form.brand || null,
        description: form.description || null,
        notes: form.notes || null,
        fragrance_family: form.fragrance_family || null,
        volume_ml: Number(form.volume_ml),
        price_cents: Math.round(Number(form.price) * 100),
        stock: Number(form.stock),
        category_id: form.category_id || null,
        featured: form.featured,
        image_url,
        active: true,
      });
      if (error) throw error;
      toast.success("Produto criado");
      navigate({ to: "/admin/produtos" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const inp = (k: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <input type={type} value={form[k] as string | number} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="w-full border border-border bg-transparent px-3 py-2 focus:outline-none focus:border-foreground" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="eyebrow mb-2">Catálogo</div>
        <h1 className="font-display text-4xl">Novo produto</h1>
      </div>
      <form onSubmit={submit} className="space-y-5">
        {inp("name", "Nome")}
        {inp("brand", "Marca")}
        <div>
          <label className="eyebrow block mb-2">Descrição</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} className="w-full border border-border bg-transparent px-3 py-2" />
        </div>
        {inp("notes", "Notas olfativas")}
        <div className="grid grid-cols-3 gap-4">
          {inp("price", "Preço (R$)", "number")}
          {inp("stock", "Estoque", "number")}
          {inp("volume_ml", "Volume (ml)", "number")}
        </div>
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
        <div>
          <label className="eyebrow block mb-2">Imagem</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          Destaque na home
        </label>
        <button disabled={busy} className="bg-foreground text-background px-6 py-2.5 text-sm disabled:opacity-50">
          {busy ? "Salvando…" : "Salvar produto"}
        </button>
      </form>
    </div>
  );
}
