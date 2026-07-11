import type { LucideIcon } from "lucide-react";
import {
  ShoppingBag,
  Palette,
  Truck,
  Users,
  GraduationCap,
  Megaphone,
  Settings,
  Globe,
} from "lucide-react";

export type ModuleId =
  | "ecommerce"
  | "estudio"
  | "operacoes"
  | "crm"
  | "academy"
  | "marketing"
  | "administracao"
  | "site";

export type RoleId = "admin" | "editor" | "reviewer" | "customer" | "ops" | "marketing";

export type ModuleDef = {
  id: ModuleId;
  label: string;
  eyebrow: string;
  description: string;
  to: string;
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
    description: "Catálogo, pedidos e clientes da boutique.",
    to: "/admin",
    icon: ShoppingBag,
    items: ["Painel", "Produtos", "Categorias", "Pedidos", "Clientes"],
    requiredRoles: ["admin"],
  },
  {
    id: "estudio",
    label: "Estúdio",
    eyebrow: "Conteúdo",
    description: "Composição visual de páginas, blocos e mídia.",
    to: "/studio",
    icon: Palette,
    items: ["Páginas", "Mídia", "Templates"],
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
    description: "Ficha 360° do cliente com histórico, LTV e segmentos.",
    to: "/crm",
    icon: Users,
    items: ["Clientes", "Segmentos", "VIP", "Aniversários"],
    requiredRoles: ["admin"],
    status: "novo",
  },
  {
    id: "academy",
    label: "Academy",
    eyebrow: "Educação",
    description: "Área de membros com cursos, aulas e certificados.",
    to: "/academy",
    icon: GraduationCap,
    items: ["Cursos", "Alunos", "Certificados"],
    requiredRoles: ["admin"],
    status: "novo",
  },
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
