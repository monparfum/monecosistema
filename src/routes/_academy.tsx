import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ModuleShell } from "@/components/module-shell";

export const Route = createFileRoute("/_academy")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: () => (
    <ModuleShell
      moduleLabel="Academy"
      nav={[
        { to: "/academy", label: "Painel", exact: true },
        { to: "/academy/cursos", label: "Cursos" },
        { to: "/academy/alunos", label: "Alunos" },
        { to: "/academy/certificados", label: "Certificados" },
      ]}
    />
  ),
});
