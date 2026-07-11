import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ModuleShell } from "@/components/module-shell";

export const Route = createFileRoute("/_ops")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: OpsLayout,
});

function OpsLayout() {
  return (
    <ModuleShell
      moduleLabel="Operações"
      nav={[
        { to: "/ops", label: "Painel", exact: true },
        { to: "/ops/pedidos", label: "Pedidos" },
        { to: "/ops/producao", label: "Produção" },
        { to: "/ops/expedicao", label: "Expedição" },
      ]}
    />
  );
}
