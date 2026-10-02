import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ModuleShell } from "@/components/module-shell";

export const Route = createFileRoute("/_marketing")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login", search: { redirect: location.href } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", s.session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/" });
  },
  component: () => (
    <ModuleShell
      moduleLabel="Marketing"
      nav={[
        { to: "/marketing", label: "Painel", exact: true },
        { to: "/marketing/contatos", label: "Contatos do site" },
        { to: "/marketing/campanhas", label: "Campanhas" },
        { to: "/marketing/calendario", label: "Calendário" },
        { to: "/marketing/social", label: "Social" },
        { to: "/marketing/automacoes", label: "Automações" },
        { to: "/marketing/ia", label: "IA de Marketing" },
      ]}
    />
  ),
});
