import { satisfies, type PermissionSet } from '@/features/auth/permissions';
import type { NavItem, NavSection } from '@/shared/types';

/**
 * Filters a navigation tree against the permissions the backend granted (§36).
 *
 * Rules:
 *  - an item is kept when its own requirement is satisfied;
 *  - a parent with children is kept when any child survives, even if the parent
 *    itself declares no permission;
 *  - a section with no surviving items disappears entirely, so no empty
 *    group headings are rendered.
 */
export function filterNavItems(
  items: readonly NavItem[],
  granted: PermissionSet,
): readonly NavItem[] {
  const result: NavItem[] = [];

  for (const item of items) {
    const children = item.children ? filterNavItems(item.children, granted) : undefined;
    const hasSurvivingChildren = children !== undefined && children.length > 0;
    const selfAllowed = satisfies(granted, { anyOf: item.anyOf ?? [], allOf: item.allOf ?? [] });

    if (item.children && item.children.length > 0) {
      if (hasSurvivingChildren) result.push({ ...item, children });
      continue;
    }
    if (selfAllowed) result.push(item);
  }

  return result;
}

export function filterNavSections(
  sections: readonly NavSection[],
  granted: PermissionSet,
): readonly NavSection[] {
  return sections
    .map((section) => ({ ...section, items: filterNavItems(section.items, granted) }))
    .filter((section) => section.items.length > 0);
}
