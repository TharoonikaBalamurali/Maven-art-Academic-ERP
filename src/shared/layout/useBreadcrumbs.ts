import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { NavItem, NavSection } from '@/shared/types';

export interface Crumb {
  label: string;
  /** Absent for the current page, which is not a link. */
  to?: string;
}

/**
 * Breadcrumbs derived from the navigation configuration.
 *
 * Deliberately not a second registry of route titles: the nav config already
 * names every module, so deriving from it means a module can never have a
 * breadcrumb that disagrees with its sidebar entry. Sub-routes that are not in
 * the nav (e.g. `/management/students/new`) fall back to a humanised segment.
 */
function humanise(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function flatten(sections: readonly NavSection[]): { item: NavItem; sectionLabel?: string }[] {
  const out: { item: NavItem; sectionLabel?: string }[] = [];
  const walk = (items: readonly NavItem[], sectionLabel?: string) => {
    for (const item of items) {
      out.push({ item, sectionLabel });
      if (item.children?.length) walk(item.children, sectionLabel);
    }
  };
  for (const section of sections) walk(section.items, section.label);
  return out;
}

export function useBreadcrumbs(
  navSections: readonly NavSection[],
  portalRoot: string,
  rootLabel = 'Dashboard',
): Crumb[] {
  const { pathname } = useLocation();

  return useMemo(() => {
    if (pathname === portalRoot) return [];

    const entries = flatten(navSections);

    // Longest matching nav entry wins, so `/students/new` resolves to Students.
    const match = entries
      .filter((entry) => entry.item.to !== portalRoot && pathname.startsWith(entry.item.to))
      .sort((a, b) => b.item.to.length - a.item.to.length)[0];

    const crumbs: Crumb[] = [{ label: rootLabel, to: portalRoot }];

    if (!match) {
      // Route outside the navigation (rare). Humanise what we have.
      const tail = pathname.slice(portalRoot.length).split('/').filter(Boolean);
      for (const segment of tail) crumbs.push({ label: humanise(segment) });
      return crumbs;
    }

    if (match.sectionLabel) crumbs.push({ label: match.sectionLabel });

    const remainder = pathname.slice(match.item.to.length).split('/').filter(Boolean);
    crumbs.push(
      remainder.length > 0 ? { label: match.item.label, to: match.item.to } : { label: match.item.label },
    );
    for (const segment of remainder) crumbs.push({ label: humanise(segment) });

    return crumbs;
  }, [pathname, navSections, portalRoot, rootLabel]);
}
