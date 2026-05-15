import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="font-display text-2xl">Mon Parfum</div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Perfumaria de autor. Composições raras, selecionadas com critério editorial.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Loja</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/busca" search={{ q: "" } as never}>Buscar</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Conta</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/conta">Minha conta</Link></li>
            <li><Link to="/login">Entrar</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Atendimento</div>
          <p className="text-sm text-muted-foreground">contato@monparfum.com.br</p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} Mon Parfum
      </div>
    </footer>
  );
}
