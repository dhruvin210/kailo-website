/**
 * Site-wide CMS settings, for the chrome that lives outside any one route.
 *
 * The root route loads `global` and the category list once per navigation and both
 * are read back from its loader data here — which means they are present in the SSR
 * HTML and identical at hydration, unlike a `useQuery` that would find an empty
 * cache on the client. Either can be `null` when the CMS is unreachable; callers
 * fall back to their hardcoded content.
 */

import { Route as RootRoute } from "@/routes/__root";
import type { StrapiCategory } from "./normalize";
import type { GlobalSettings } from "./queries";

export const useGlobal = (): GlobalSettings | null => RootRoute.useLoaderData().global;

/** Drives the footer's Products column; `global` has no category list of its own. */
export const useSiteCategories = (): StrapiCategory[] | null =>
  RootRoute.useLoaderData().categories;
