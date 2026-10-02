import { createFileRoute, redirect } from "@tanstack/react-router";

// Edição das páginas fica no Estúdio (com prévia ao vivo)
export const Route = createFileRoute("/_admin/admin/site/")({
  beforeLoad: () => { throw redirect({ to: "/studio/paginas" }); },
});
