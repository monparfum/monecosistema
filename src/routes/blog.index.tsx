import { createFileRoute } from "@tanstack/react-router";
import { PostsIndex } from "@/components/mon/posts";
import { categoriesQuery, getSiteUrl, listHead, postsQuery } from "@/lib/posts";

export const Route = createFileRoute("/blog/")({
  loader: async ({ context: { queryClient: qc } }) => {
    const [site] = await Promise.all([
      getSiteUrl(),
      qc.ensureQueryData(postsQuery("blog")).catch(() => null),
      qc.ensureQueryData(categoriesQuery("blog")).catch(() => null),
    ]);
    return { site };
  },
  head: ({ loaderData }) => listHead(loaderData?.site ?? "", "blog"),
  component: () => <PostsIndex kind="blog" />,
});
