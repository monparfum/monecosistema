import { createFileRoute, redirect } from "@tanstack/react-router";
import { MEMBERS_APP_URL } from "@/lib/members-app";

// Atalho: <site>/app abre a área de membros (app separado). Sem endereço configurado, vai para o login.
export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    throw MEMBERS_APP_URL ? redirect({ href: `${MEMBERS_APP_URL}/app` }) : redirect({ to: "/login" });
  },
});
