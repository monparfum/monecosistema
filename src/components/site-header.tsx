import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Home" },
  { to: "/sobre", label: "Sobre" },
  { to: "/experiencias", label: "Experiências" },
  { to: "/workshops", label: "Workshops" },
  { to: "/catalogo", label: "Produtos" },
  { to: "/cursos", label: "Cursos" },
  { to: "/comunidade", label: "Comunidade" },
  { to: "/ebooks", label: "Ebooks" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between h-10 text-xs">
          <span className="eyebrow hidden md:block">Maison olfativa · São Paulo · Paris</span>
          <div className="flex gap-6 ml-auto eyebrow">
            <Link to={user ? "/conta" : "/login"} className="hover:text-foreground">
              {user ? "Minha conta" : "Entrar na plataforma"}
            </Link>
            {isAdmin && <Link to="/admin" className="hover:text-foreground">Admin</Link>}
          </div>
        </div>
        <div className="hairline" />

        <div className="grid grid-cols-3 items-center py-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden -ml-1"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) navigate({ to: "/busca", search: { q: q.trim() } as never });
              }}
              className="hidden lg:flex items-center border-b border-border"
            >
              <Search className="size-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar"
                className="bg-transparent px-2 py-1 text-sm focus:outline-none w-40"
              />
            </form>
          </div>

          <Link to="/" className="text-center font-display text-3xl md:text-4xl tracking-tight leading-none">
            Mon Parfum
          </Link>

          <div className="flex items-center justify-end gap-5">
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

        <nav className="hidden lg:flex items-center justify-center gap-10 pb-5 text-[13px]">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground transition-colors" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <span className="font-display text-2xl">Mon Parfum</span>
            <button onClick={() => setOpen(false)} aria-label="Fechar"><X className="size-5" /></button>
          </div>
          <nav className="flex flex-col p-6 gap-5 font-display text-3xl">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
