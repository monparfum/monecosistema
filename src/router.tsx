import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // O que os loaders buscaram no servidor (catálogo, textos) vai junto no HTML
    dehydrate: () => ({ queries: JSON.stringify(dehydrate(queryClient)) }),
    hydrate: (d) => hydrate(queryClient, JSON.parse(d.queries)),
  });

  return router;
};
