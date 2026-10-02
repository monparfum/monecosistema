import { createFileRoute, redirect } from "@tanstack/react-router";

// Contatos do site (newsletter, quiz, Atelier, contato) moraram para o Marketing
export const Route = createFileRoute("/_admin/admin/contatos")({
  beforeLoad: () => { throw redirect({ to: "/marketing/contatos" }); },
});
