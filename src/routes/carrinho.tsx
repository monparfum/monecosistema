import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Sacola — Mon Parfum" }] }),
  component: Carrinho,
});

function Carrinho() {
  const { items, setQty, remove, subtotalCents } = useCart();
  const empty = items.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="eyebrow mb-3">Sacola</div>
        <h1 className="font-display text-5xl mb-12">{empty ? "Sua sacola está vazia" : "Sua seleção"}</h1>

        {empty ? (
          <Link to="/produtos" className="border-b-2 border-foreground pb-1 text-sm">Explorar catálogo</Link>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 divide-y divide-border border-y border-border">
              {items.map((i) => (
                <div key={i.productId} className="grid grid-cols-[80px_1fr_auto] gap-6 py-6 items-center">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {i.imageUrl && <img src={i.imageUrl} alt={i.name} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    {i.brand && <div className="eyebrow">{i.brand}</div>}
                    <Link to="/produto/$slug" params={{ slug: i.slug }} className="font-display text-xl">{i.name}</Link>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-border text-sm">
                        <button onClick={() => setQty(i.productId, i.quantity - 1)} className="px-2 py-1 hover:bg-muted">−</button>
                        <span className="px-3">{i.quantity}</span>
                        <button onClick={() => setQty(i.productId, i.quantity + 1)} className="px-2 py-1 hover:bg-muted">+</button>
                      </div>
                      <button onClick={() => remove(i.productId)} className="text-muted-foreground hover:text-foreground"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                  <div className="text-sm text-right">{formatBRL(i.priceCents * i.quantity)}</div>
                </div>
              ))}
            </div>
            <aside className="space-y-4">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatBRL(subtotalCents)}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Frete</span><span>calculado no checkout</span></div>
              <div className="border-t border-border pt-4 flex justify-between font-display text-2xl">
                <span>Total</span><span>{formatBRL(subtotalCents)}</span>
              </div>
              <Link to="/checkout" className="block text-center bg-foreground text-background py-3 text-sm tracking-wide">Finalizar compra</Link>
            </aside>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
