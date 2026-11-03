import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostsIndex } from "@/components/mon/posts";
import { categoriesQuery, getSiteUrl, listHead, postsQuery } from "@/lib/posts";

export const Route = createFileRoute("/noticias/categoria/$categoria")({
  loader: async ({ params, context: { queryClient: qc } }) => {
    const [site, cats] = await Promise.all([getSiteUrl(), qc.ensureQueryData(categoriesQuery("noticia")).catch(() => [])]);
    const cat = cats.find((c) => c.slug === params.categoria);
    if (!cat) throw notFound();
    await qc.ensureQueryData(postsQuery("noticia", { categoria: cat.slug })).catch(() => null);
    return { site, cat };
  },
  head: ({ loaderData }) => listHead(loaderData?.site ?? "", "noticia", loaderData?.cat),
  component: function NewsCategory() {
    const { categoria } = Route.useParams();
    return <PostsIndex kind="noticia" categoria={categoria} />;
  },
});
