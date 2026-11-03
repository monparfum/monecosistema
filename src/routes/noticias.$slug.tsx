import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostArticle } from "@/components/mon/posts";
import { getSiteUrl, postHead, postQuery, postsQuery } from "@/lib/posts";

export const Route = createFileRoute("/noticias/$slug")({
  loader: async ({ params, context: { queryClient: qc } }) => {
    const [site, post] = await Promise.all([getSiteUrl(), qc.ensureQueryData(postQuery("noticia", params.slug)).catch(() => null)]);
    if (!post) throw notFound();
    await qc.ensureQueryData(postsQuery("noticia", { limit: 4 })).catch(() => null);
    return { site, post };
  },
  head: ({ loaderData }) => (loaderData ? postHead(loaderData.site, loaderData.post) : {}),
  component: function NewsPost() {
    const { slug } = Route.useParams();
    return <PostArticle kind="noticia" slug={slug} />;
  },
});
