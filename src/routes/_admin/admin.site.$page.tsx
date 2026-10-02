import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/site/$page")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/studio/paginas/$slug", params: { slug: params.page } }); },
});
