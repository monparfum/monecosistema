import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostArticle } from "@/components/mon/posts";
import { getSiteUrl, postHead, postQuery, postsQuery } from "@/lib/posts";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, context: { queryClient: qc } }) => {
    const [site, post] = await Promise.all([getSiteUrl(), qc.ensureQueryData(postQuery("blog", params.slug)).catch(() => null)]);
    if (!post) throw notFound();
    await qc.ensureQueryData(postsQuery("blog", { limit: 4 })).catch(() => null);
    return { site, post };
  },
  head: ({ loaderData }) => (loaderData ? postHead(loaderData.site, loaderData.post) : {}),
  component: function BlogPost() {
    const { slug } = Route.useParams();
    return <PostArticle kind="blog" slug={slug} />;
  },
});
