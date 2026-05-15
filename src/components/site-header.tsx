import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-14 text-xs">
          <span className="eyebrow hidden md:block">Frete grátis acima de R$ 350</span>
          <div className="flex gap-6 ml-auto eyebrow">
            <Link to="/conta" className="hover:text-foreground">Minha conta</Link>
            {isAdmin && <Link to="/admin" className="hover:text-foreground">Admin</Link>}
          </div>
        </div>
        <div className="hairline" />
        <div className="grid grid-cols-3 items-center py-6">
          <nav className="flex gap-8 text-sm">
            <Link to="/catalogo" activeProps={{ className: "underline underline-offset-4" }}>Catálogo</Link>
            <Link to="/catalogo" search={{ familia: "floral" } as never} className="hidden md:inline">Florais</Link>
            <Link to="/catalogo" search={{ familia: "amadeirado" } as never} className="hidden md:inline">Amadeirados</Link>
          </nav>
          <Link to="/" className="text-center font-display text-3xl tracking-tight">
            Mon Parfum
          </Link>
          <div className="flex items-center justify-end gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) navigate({ to: "/busca", search: { q: q.trim() } as never });
              }}
              className="hidden md:flex items-center border-b border-border"
            >
              <Search className="size-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar"
                className="bg-transparent px-2 py-1 text-sm focus:outline-none w-40"
              />
            </form>
            <Link to={user ? "/conta" : "/login"} aria-label="Conta">
              <User className="size-5" />
            </Link>
            <Link to="/carrinho" className="relative" aria-label="Carrinho">
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] rounded-full size-4 grid place-items-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
