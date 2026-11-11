import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { MEMBERS_APP_URL } from "@/lib/members-app";

const NAV = [
  { to: "/cursos", label: "Cursos" },
  { to: "/produtos", label: "Produtos" },
  { to: "/corporativo", label: "Corporativo" },
  { to: "/mon-club", label: "MON Club" },
  { to: "/noticias", label: "Notícias" },
  { to: "/blog", label: "Blog" },
  { to: "/sobre", label: "Sobre" },
] as const;

// overlay: header transparente sobre o banner (home); vira branco ao rolar ou ao abrir o menu
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!overlay);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const light = overlay && !scrolled && !open;
  const aluno = MEMBERS_APP_URL
    ? { href: `${MEMBERS_APP_URL}/app` } // /app: quem não é da equipe cai sozinho na área do aluno ou no login
    : { to: user ? "/conta" : "/login" } as const;

  return (
    <header className={`mon m-header${overlay ? " over" : ""}`} data-light={light} data-open={open}>
      <div className="m-bar">
        <Link to="/" className="m-logo" aria-label="MON PARFUM — início">
          <img src={light ? "/logo-mon-branco.png" : "/logo-mon.png"} alt="MON Parfum" width={707} height={418} style={{ height: 44, width: "auto", display: "block" }} />
        </Link>
        <nav className="m-nav" data-open={open} onClick={() => setOpen(false)}>
          {NAV.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
          {isAdmin && <Link to="/admin">Painel</Link>}
          {"href" in aluno ? <a href={aluno.href} className="only-m">Área do aluno</a> : <Link to={aluno.to} className="only-m">Área do aluno</Link>}
          <Link to="/quiz" className="cta">Quiz Olfativo</Link>
        </nav>
        <div className="m-acts">
          {"href" in aluno ? <a href={aluno.href} className="m-small hide-m">Área do aluno</a> : <Link to={aluno.to} className="m-small hide-m">Área do aluno</Link>}
          <Link className="m-ico" to={user ? "/pedidos" : "/login"} aria-label={user ? "Meus pedidos" : "Entrar"}><User size={18} strokeWidth={1.5} /></Link>
          <Link to="/carrinho" className="m-cart m-ico" aria-label="Sacola">
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && <b>{count}</b>}
          </Link>
          <button className="m-mobile-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
        </div>
      </div>
    </header>
  );
}
