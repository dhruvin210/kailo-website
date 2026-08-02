import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ErrorComponent, NotFoundComponent } from "./routes/__root";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // `errorComponent` on the root route only covers the root's own render, so
    // without these a CMS read failing inside a page's loader would fall through
    // to the router's built-in error box. Routes that define their own — like
    // `/products/$id` — still take precedence.
    defaultErrorComponent: ErrorComponent,
    defaultNotFoundComponent: NotFoundComponent,
  });

  return router;
};
