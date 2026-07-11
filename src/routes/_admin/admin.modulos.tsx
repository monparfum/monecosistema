import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Palette, Users, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/modulos")({
  head: () => ({ meta: [{ title: "Módulos — Mon Parfum" }] }),
  component: ModulesHub,
});

type ModuleCard = {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  to: string;
  icon: LucideIcon;
  items: string[];
};

const MODULES: ModuleCard[] = [
  {
    id: "ecommerce",
    label: "E-commerce",
    eyebrow: "Comércio",
    description: "Catálogo, pedidos e clientes da boutique.",
    to: "/admin",
    icon: ShoppingBag,
    items: ["Painel", "Produtos", "Categorias", "Pedidos", "Clientes"],
  },
  {
    id: "estudio",
    label: "Estúdio",
    eyebrow: "Conteúdo",
    description: "Composição visual de páginas, blocos e mídia.",
    to: "/studio",
    icon: Palette,
    items: ["Páginas", "Mídia", "Templates"],
  },
  {
    id: "equipe",
    label: "Equipe",
    eyebrow: "Pessoas",
    description: "Convide editores, revisores e administradores.",
    to: "/studio/equipe",
    icon: Users,
    items: ["Membros", "Permissões"],
  },
  {
    id: "site",
    label: "Site",
    eyebrow: "Vitrine",
    description: "Ver a loja pública tal como o cliente vê.",
    to: "/",
    icon: Globe,
    items: ["Home", "Catálogo", "Editorial"],
  },
];

function ModulesHub() {
  return (
    <div className="space-y-16 max-w-[1200px]">
      <div>
        <div className="eyebrow mb-3">Central do administrador</div>
        <h1 className="font-display text-[clamp(2.75rem,4.5vw,4.5rem)] leading-[0.95]">
          Módulos<em className="italic text-muted-foreground"> da maison.</em>
        </h1>
        <p className="mt-6 max-w-xl text-sm text-muted-foreground leading-relaxed">
          Escolha um módulo para entrar em sua interface dedicada. Cada módulo agrupa
          as ferramentas relacionadas àquela área da operação.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              to={m.to}
              className="group bg-background p-10 flex flex-col justify-between min-h-[260px] hover:bg-[color:var(--muted)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="eyebrow">{m.eyebrow}</div>
                <Icon className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.2} />
              </div>
              <div className="mt-10">
                <div className="font-display text-5xl leading-none">{m.label}</div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">{m.description}</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                  {m.items.map((i) => (
                    <span key={i}>{i}</span>
                  ))}
                </div>
                <div className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground group-hover:text-foreground transition-colors ml-4 shrink-0">
                  Abrir →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border pt-8 text-xs text-muted-foreground max-w-2xl leading-relaxed">
        Novos módulos aparecerão automaticamente aqui à medida que forem adicionados.
        A arquitetura já prevê permissões por perfil — por exemplo, um usuário
        <em className="italic"> Equipe</em> verá apenas o módulo correspondente.
      </div>
    </div>
  );
}
