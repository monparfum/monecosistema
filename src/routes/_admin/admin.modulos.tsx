import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Globe,
  Palette,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  UserCog,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
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
  group: "Comércio" | "Conteúdo" | "Pessoas";
};

const MODULES: ModuleCard[] = [
  {
    id: "site",
    label: "Site",
    eyebrow: "Vitrine",
    description: "Ver a loja pública tal como o cliente vê.",
    to: "/",
    icon: Globe,
    group: "Conteúdo",
  },
  {
    id: "studio",
    label: "Estúdio",
    eyebrow: "Editor visual",
    description: "Componha páginas, blocos editoriais e landing pages.",
    to: "/studio",
    icon: Palette,
    group: "Conteúdo",
  },
  {
    id: "midia",
    label: "Mídia",
    eyebrow: "Biblioteca",
    description: "Gerencie imagens, capas e assets da maison.",
    to: "/studio/midia",
    icon: ImageIcon,
    group: "Conteúdo",
  },
  {
    id: "paginas",
    label: "Páginas",
    eyebrow: "Publicações",
    description: "Rascunhos, revisões e páginas publicadas.",
    to: "/studio/paginas",
    icon: FileText,
    group: "Conteúdo",
  },
  {
    id: "produtos",
    label: "Produtos",
    eyebrow: "Catálogo",
    description: "Criar, editar e organizar o portfólio olfativo.",
    to: "/admin/produtos",
    icon: Package,
    group: "Comércio",
  },
  {
    id: "categorias",
    label: "Categorias",
    eyebrow: "Taxonomia",
    description: "Coleções, famílias e curadorias do catálogo.",
    to: "/admin/categorias",
    icon: FolderTree,
    group: "Comércio",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    eyebrow: "Vendas",
    description: "Acompanhe pedidos, status e faturamento.",
    to: "/admin/pedidos",
    icon: ShoppingBag,
    group: "Comércio",
  },
  {
    id: "clientes",
    label: "Clientes",
    eyebrow: "CRM",
    description: "Perfis, histórico e relacionamento com clientes.",
    to: "/admin/clientes",
    icon: Users,
    group: "Pessoas",
  },
  {
    id: "equipe",
    label: "Equipe",
    eyebrow: "Permissões",
    description: "Convide editores, revisores e administradores.",
    to: "/studio/equipe",
    icon: UserCog,
    group: "Pessoas",
  },
  {
    id: "painel",
    label: "Painel",
    eyebrow: "Métricas",
    description: "Visão geral de receita, pedidos e clientes.",
    to: "/admin",
    icon: LayoutDashboard,
    group: "Comércio",
  },
];

const GROUPS: ModuleCard["group"][] = ["Comércio", "Conteúdo", "Pessoas"];

function ModulesHub() {
  return (
    <div className="space-y-16">
      <div>
        <div className="eyebrow mb-3">Central do administrador</div>
        <h1 className="font-display text-[clamp(2.5rem,4vw,4rem)] leading-[0.95]">
          Módulos<em className="italic text-muted-foreground"> da maison.</em>
        </h1>
        <p className="mt-6 max-w-xl text-sm text-muted-foreground leading-relaxed">
          Acesso irrestrito a todas as áreas de gestão. Selecione um módulo para entrar
          em sua interface dedicada.
        </p>
      </div>

      {GROUPS.map((group) => {
        const items = MODULES.filter((m) => m.group === group);
        if (!items.length) return null;
        return (
          <section key={group} className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <div className="eyebrow">{group}</div>
              <div className="text-xs text-muted-foreground">{items.length} módulos</div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {items.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.id}
                    to={m.to}
                    className="group bg-background p-8 flex flex-col justify-between min-h-[200px] hover:bg-[color:var(--muted)] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="eyebrow">{m.eyebrow}</div>
                      <Icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.25} />
                    </div>
                    <div className="mt-8">
                      <div className="font-display text-3xl leading-none">{m.label}</div>
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                    </div>
                    <div className="mt-6 text-[11px] tracking-[0.18em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                      Acessar →
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="border-t border-border pt-8 text-xs text-muted-foreground max-w-2xl leading-relaxed">
        Novos módulos podem ser adicionados progressivamente e aparecerão automaticamente
        nesta central. A arquitetura permite, futuramente, restringir o acesso por perfil
        (por exemplo, o perfil <em className="italic">Equipe</em> verá apenas o módulo Equipe).
      </div>
    </div>
  );
}
