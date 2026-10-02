import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ModuleShell } from "@/components/module-shell";

let generated = false;

export const Route = createFileRoute("/_financeiro")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
    // Mantém 12 meses de receitas/despesas fixas gerados à frente (idempotente; não bloqueia a tela)
    if (!generated) { generated = true; void supabase.rpc("fin_generate_recurrences", { _months: 12 }).then(() => undefined); }
  },
  component: () => (
    <ModuleShell
      moduleLabel="Financeiro"
      nav={[
        { to: "/financeiro", label: "Painel", exact: true },
        { to: "/financeiro/lancamentos", label: "Lançamentos" },
        { to: "/financeiro/a-pagar", label: "A pagar" },
        { to: "/financeiro/a-receber", label: "A receber" },
        { to: "/financeiro/recorrencias", label: "Fixas e recorrentes" },
        { to: "/financeiro/fluxo-de-caixa", label: "Fluxo de caixa" },
        { to: "/financeiro/dre", label: "DRE" },
        { to: "/financeiro/cadastros", label: "Contas e categorias" },
      ]}
    />
  ),
});
