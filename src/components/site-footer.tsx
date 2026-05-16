import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-32 bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-20 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <div className="font-display text-3xl">Mon Parfum</div>
          <p className="text-sm text-muted-foreground mt-4 max-w-sm leading-relaxed">
            Maison olfativa contemporânea. Um ecossistema de perfumes autorais,
            experiências sensoriais e educação em perfumaria.
          </p>
          <p className="eyebrow mt-8">contato@monparfum.com.br</p>
        </div>
        <div>
          <div className="eyebrow mb-5">Maison</div>
          <ul className="space-y-3 text-sm">
            <li><Link to="/experiencias">Experiências</Link></li>
            <li><Link to="/workshops">Workshops</Link></li>
            <li><Link to="/catalogo">Produtos</Link></li>
            <li><Link to="/cursos">Cursos</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-5">Universo</div>
          <ul className="space-y-3 text-sm">
            <li><Link to="/comunidade">Comunidade</Link></li>
            <li><Link to="/ebooks">Ebooks</Link></li>
            <li><Link to="/sobre">Sobre</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-5">Conta</div>
          <ul className="space-y-3 text-sm">
            <li><Link to="/conta">Minha conta</Link></li>
            <li><Link to="/pedidos">Pedidos</Link></li>
            <li><Link to="/login">Entrar</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-[11px] text-muted-foreground text-center tracking-widest uppercase">
        © {new Date().getFullYear()} Mon Parfum · Maison olfativa
      </div>
    </footer>
  );
}
