import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { MEMBERS_APP_URL } from "@/lib/members-app";

const NAV = [
  { to: "/cursos", label: "Cursos" },
  { to: "/produtos", label: "Produtos" },
  { to: "/corporativo", label: "Corporativo" },
  { to: "/mon-club", label: "MON Club" },
  { to: "/conteudos", label: "Conteúdos" },
  { to: "/sobre", label: "Sobre" },
] as const;

// Área de membros (instalação separada); sem endereço configurado, cai em "Minha conta"

export function SiteHeader() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="mon m-header">
      <div className="m-bar">
        <Link to="/" className="m-logo" aria-label="MON PARFUM — início">
          <img src="/logo-mon.png" alt="MON Parfum" width={707} height={418} style={{ height: 44, width: "auto", display: "block" }} />
        </Link>
        <button className="m-mobile-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
        <nav className="m-nav" data-open={open} onClick={() => setOpen(false)}>
          {NAV.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
          {isAdmin && <Link to="/admin">Painel</Link>}
          <Link to="/quiz" className="only-m">Quiz Olfativo</Link>
          {MEMBERS_APP_URL
            ? <a href={MEMBERS_APP_URL} className="only-m">Área do aluno</a>
            : <Link to={user ? "/conta" : "/login"} className="only-m">Área do aluno</Link>}
        </nav>
        <div className="m-acts">
          <Link to="/quiz" className="m-btn sm brass hide-m">Quiz Olfativo</Link>
          {MEMBERS_APP_URL
            ? <a href={MEMBERS_APP_URL} className="m-small hide-m">Área do aluno</a>
            : <Link to={user ? "/conta" : "/login"} className="m-small hide-m">Área do aluno</Link>}
          <Link className="m-ico" to={user ? "/pedidos" : "/login"} aria-label={user ? "Meus pedidos" : "Entrar"}><User size={18} strokeWidth={1.5} /></Link>
          <Link to="/carrinho" className="m-cart m-ico" aria-label="Sacola">
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && <b>{count}</b>}
          </Link>
        </div>
      </div>
    </header>
  );
}
