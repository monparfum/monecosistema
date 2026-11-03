import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostsIndex } from "@/components/mon/posts";
import { categoriesQuery, getSiteUrl, listHead, postsQuery } from "@/lib/posts";

export const Route = createFileRoute("/blog/categoria/$categoria")({
  loader: async ({ params, context: { queryClient: qc } }) => {
    const [site, cats] = await Promise.all([getSiteUrl(), qc.ensureQueryData(categoriesQuery("blog")).catch(() => [])]);
    const cat = cats.find((c) => c.slug === params.categoria);
    if (!cat) throw notFound();
    await qc.ensureQueryData(postsQuery("blog", { categoria: cat.slug })).catch(() => null);
    return { site, cat };
  },
  head: ({ loaderData }) => listHead(loaderData?.site ?? "", "blog", loaderData?.cat),
  component: function BlogCategory() {
    const { categoria } = Route.useParams();
    return <PostsIndex kind="blog" categoria={categoria} />;
  },
});
