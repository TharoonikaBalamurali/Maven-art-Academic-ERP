import type { RouteObject } from 'react-router-dom';

/**
 * Content-width strategy (Day 2A).
 *
 * The shell no longer caps every page at one universal max-width. Instead each
 * page type gets a width that suits its content:
 *
 *   wide    — data grids, lists and dashboards: use the available viewport
 *   detail  — a single record: a balanced, readable measure
 *   form    — an editing form: a narrow, comfortable column
 *
 * The width is declared on the route (`handle.pageWidth`) so a module inherits
 * the right width from its route shape, with no per-page styling. `withPageWidth`
 * infers a sensible default from the path — list/index routes stay wide, `:param`
 * routes read as detail, and `/new`·`/edit` routes read as forms — so most routes
 * need no annotation at all. An explicit `handle.pageWidth` always wins.
 */
export type PageWidth = 'wide' | 'detail' | 'form';

export const PAGE_WIDTH_VAR: Record<PageWidth, string> = {
  wide: 'var(--container-wide)',
  detail: 'var(--container-detail)',
  form: 'var(--container-form)',
};

export interface PageWidthHandle {
  pageWidth?: PageWidth;
}

/** Reads the most specific matched route's declared width, else a portal default. */
export function resolvePageWidth(
  matches: readonly { handle?: unknown }[],
  fallback: PageWidth,
): PageWidth {
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const handle = matches[i]?.handle as PageWidthHandle | undefined;
    if (handle?.pageWidth) return handle.pageWidth;
  }
  return fallback;
}

/** Infers `pageWidth` from each route's path unless it already declares one. */
export function inferPageWidth(path: string | undefined): PageWidth | undefined {
  if (!path) return undefined; // index/dashboard → portal default
  if (/\/(new|edit)$/.test(path)) return 'form';
  if (path.includes(':')) return 'detail';
  return undefined; // list/collection → portal default (wide for management)
}

/**
 * Annotates a route tree with an inferred `pageWidth` handle, preserving any
 * explicit `handle`. Applied once where routes are assembled, so every current
 * and future route participates without touching page components.
 */
export function withPageWidth(routes: RouteObject[]): RouteObject[] {
  return routes.map((route) => {
    const existing = route.handle as PageWidthHandle | undefined;
    if (existing?.pageWidth) return route;
    const inferred = inferPageWidth(route.path);
    if (!inferred) return route;
    return { ...route, handle: { ...(existing ?? {}), pageWidth: inferred } };
  });
}
