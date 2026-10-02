import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo: a página nova redireciona cursos para /cursos/<slug>
export const Route = createFileRoute("/produto/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/produtos/$slug", params: { slug: params.slug } });
  },
});
