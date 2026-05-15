import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/produtos")({ component: AdminProducts });

function AdminProducts() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("products").update({ active: !active }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="eyebrow mb-2">Catálogo</div>
          <h1 className="font-display text-4xl">Produtos</h1>
        </div>
        <Link to="/admin/produtos/novo" className="bg-foreground text-background px-4 py-2 text-sm">Novo produto</Link>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left border-b border-border">
          <tr className="eyebrow">
            <th className="py-3">Produto</th><th>Marca</th><th>Preço</th><th>Estoque</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data?.map((p) => (
            <tr key={p.id}>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  {p.image_url && <img src={p.image_url} alt="" className="size-10 object-cover" />}
                  {p.name}
                </div>
              </td>
              <td>{p.brand}</td>
              <td>{formatBRL(p.price_cents)}</td>
              <td>{p.stock}</td>
              <td>
                <button onClick={() => toggleActive(p.id, p.active)} className="text-xs border border-border px-2 py-1">
                  {p.active ? "ativo" : "inativo"}
                </button>
              </td>
              <td className="text-right">
                <button onClick={() => remove(p.id)} className="text-xs text-destructive">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
