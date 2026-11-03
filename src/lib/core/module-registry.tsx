import type { LucideIcon } from "lucide-react";
import { MEMBERS_APP_URL } from "@/lib/members-app";
import {
  ShoppingBag,
  Palette,
  Truck,
  Users,
  GraduationCap,
  Megaphone,
  Settings,
  Globe,
  Landmark,
} from "lucide-react";

export type ModuleId =
  | "ecommerce"
  | "estudio"
  | "operacoes"
  | "crm"
  | "membros"
  | "marketing"
  | "financeiro"
  | "administracao"
  | "site";

export type RoleId = "admin" | "editor" | "reviewer" | "customer" | "ops" | "marketing";

export type ModuleDef = {
  id: ModuleId;
  label: string;
  eyebrow: string;
  description: string;
  to: string;
  href?: string; // link externo (abre outro sistema)
  icon: LucideIcon;
  items: string[];
  requiredRoles: RoleId[]; // vazio = qualquer admin; usado quando permissões granulares forem ligadas
  status?: "novo" | "beta";
};

export const MODULES: ModuleDef[] = [
  {
    id: "ecommerce",
    label: "E-commerce",
    eyebrow: "Comércio",
    description: "Vendas, pedidos, produtos, estoque, cupons e clientes da loja.",
    to: "/admin",
    icon: ShoppingBag,
    items: ["Pedidos", "Produtos", "Estoque", "Cupons", "Clientes"],
    requiredRoles: ["admin"],
  },
  {
    id: "estudio",
    label: "Estúdio",
    eyebrow: "Conteúdo",
    description: "Páginas do site, notícias, blog e mídia.",
    to: "/studio",
    icon: Palette,
    items: ["Páginas", "Notícias", "Blog", "Mídia"],
    requiredRoles: ["admin", "editor", "reviewer"],
  },
  {
    id: "operacoes",
    label: "Operações",
    eyebrow: "Logística",
    description: "Pedidos, produção, expedição e entrega em uma linha.",
    to: "/ops",
    icon: Truck,
    items: ["Pedidos", "Produção", "Expedição", "Entrega"],
    requiredRoles: ["admin", "ops"],
    status: "novo",
  },
  {
    id: "crm",
    label: "CRM",
    eyebrow: "Relacionamento",
    description: "Clientes corporativos: propostas, empresas, eventos e follow-ups.",
    to: "/crm",
    icon: Users,
    items: ["Oportunidades", "Empresas", "Prospecção", "Follow-ups"],
    requiredRoles: ["admin"],
    status: "novo",
  },
  ...(MEMBERS_APP_URL ? [{
    id: "membros" as const,
    label: "Área de membros",
    eyebrow: "Cursos",
    description: "Sua área de membros: cursos, aulas, alunos, provas e certificados. Abre em outra aba.",
    to: "/",
    href: `${MEMBERS_APP_URL}/app`,
    icon: GraduationCap,
    items: ["Cursos", "Alunos", "Vendas", "Provas"],
    requiredRoles: ["admin" as const],
  }] : []),
  {
    id: "marketing",
    label: "Marketing",
    eyebrow: "Inteligência",
    description: "Campanhas, funis, social analytics e IA de conteúdo.",
    to: "/marketing",
    icon: Megaphone,
    items: ["Campanhas", "Calendário", "Social", "Automações", "IA"],
    requiredRoles: ["admin", "marketing"],
    status: "novo",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    eyebrow: "Gestão",
    description: "Entradas e saídas, contas a pagar e receber, fluxo de caixa e DRE. Vendas da loja e do CRM entram sozinhas.",
    to: "/financeiro",
    icon: Landmark,
    items: ["Lançamentos", "A pagar", "A receber", "Fluxo", "DRE"],
    requiredRoles: ["admin"],
    status: "novo",
  },
  {
    id: "administracao",
    label: "Administração",
    eyebrow: "Plataforma",
    description: "Usuários, papéis, integrações, logs e segurança.",
    to: "/administracao",
    icon: Settings,
    items: ["Usuários", "Papéis", "Integrações", "Logs", "Empresa"],
    requiredRoles: ["admin"],
    status: "novo",
  },
  {
    id: "site",
    label: "Site",
    eyebrow: "Vitrine",
    description: "Ver a loja pública tal como o cliente vê.",
    to: "/",
    icon: Globe,
    items: ["Home", "Catálogo", "Editorial"],
    requiredRoles: [],
  },
];

export function getModule(id: ModuleId) {
  return MODULES.find((m) => m.id === id);
}
