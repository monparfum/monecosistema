import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ModuleShell } from "@/components/module-shell";

export const Route = createFileRoute("/_administracao")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: () => (
    <ModuleShell
      moduleLabel="Administração"
      nav={[
        { to: "/administracao", label: "Painel", exact: true },
        { to: "/administracao/usuarios", label: "Usuários" },
        { to: "/administracao/papeis", label: "Papéis" },
        { to: "/administracao/integracoes", label: "Integrações" },
        { to: "/administracao/logs", label: "Logs" },
        { to: "/administracao/empresa", label: "Empresa" },
      ]}
    />
  ),
});
