import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/product-form";

export const Route = createFileRoute("/_admin/admin/produtos/$id")({ component: EditProduct });

const REASON: Record<string, string> = { initial: "Estoque inicial", adjust: "Ajuste manual", sale: "Venda", cancel: "Cancelamento" };

function EditProduct() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const [p, m] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).maybeSingle(),
        supabase.from("stock_movements").select("*, orders(order_number)").eq("product_id", id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (p.error) throw p.error;
      return { product: p.data, movements: m.data ?? [] };
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!data?.product) return <div>Produto não encontrado. <Link to="/admin/produtos" className="underline">Voltar</Link></div>;

  return (
    <div className="grid lg:grid-cols-[minmax(0,42rem)_1fr] gap-12">
      <div className="space-y-8">
        <div>
          <Link to="/admin/produtos" className="eyebrow text-muted-foreground hover:text-foreground">← Produtos</Link>
          <h1 className="font-display text-4xl mt-2">{data.product.name}</h1>
        </div>
        <ProductForm key={data.product.updated_at} product={data.product} />
      </div>
      <aside>
        <div className="eyebrow mb-3">Movimentações de estoque</div>
        {data.movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {data.movements.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</td>
                  <td>{REASON[m.reason] ?? m.reason}{m.orders?.order_number ? ` · ${m.orders.order_number}` : ""}</td>
                  <td className={`text-right ${m.delta < 0 ? "text-destructive" : ""}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="text-right text-muted-foreground">= {m.stock_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </aside>
    </div>
  );
}
