import { createFileRoute } from "@tanstack/react-router";
import { PostsIndex } from "@/components/mon/posts";
import { categoriesQuery, getSiteUrl, listHead, postsQuery } from "@/lib/posts";

export const Route = createFileRoute("/noticias/")({
  loader: async ({ context: { queryClient: qc } }) => {
    const [site] = await Promise.all([
      getSiteUrl(),
      qc.ensureQueryData(postsQuery("noticia")).catch(() => null),
      qc.ensureQueryData(categoriesQuery("noticia")).catch(() => null),
      qc.ensureQueryData(postsQuery("blog", { limit: 3 })).catch(() => null),
    ]);
    return { site };
  },
  head: ({ loaderData }) => listHead(loaderData?.site ?? "", "noticia"),
  component: () => <PostsIndex kind="noticia" />,
});
