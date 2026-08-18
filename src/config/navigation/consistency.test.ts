import { describe, expect, it } from 'vitest';
import { authContract } from '@/features/auth/api/auth.contract';
import { notificationsContract } from '@/features/notifications/api/notifications.contract';
import { MOCK_PERMISSIONS_BY_ROLE } from '@/mocks/fixtures';
import { isKnownPermission, ROLES, type NavItem, type NavSection } from '@/shared/types';
import { MANAGEMENT_NAV } from './management.nav';
import { STUDENT_PARENT_NAV } from './student-parent.nav';

/**
 * Foundation consistency checks.
 *
 * These catch the class of bug that is invisible until a user with the wrong
 * role signs in: a navigation entry guarded by a permission that no longer
 * exists, a typo that silently hides a module forever, or a role whose mock
 * fixture drifts from the permission catalogue.
 */
function collectPermissions(sections: readonly NavSection[]): string[] {
  const out: string[] = [];
  const walk = (items: readonly NavItem[]) => {
    for (const item of items) {
      out.push(...(item.anyOf ?? []), ...(item.allOf ?? []));
      if (item.children) walk(item.children);
    }
  };
  for (const section of sections) walk(section.items);
  return out;
}

describe('navigation / permission consistency', () => {
  it('references only permissions that exist in the catalogue', () => {
    const referenced = [
      ...collectPermissions(MANAGEMENT_NAV),
      ...collectPermissions(STUDENT_PARENT_NAV),
    ];

    expect(referenced.length).toBeGreaterThan(0);
    const unknown = referenced.filter((permission) => !isKnownPermission(permission));
    expect(unknown).toEqual([]);
  });

  it('gives every navigation item a unique id and a route', () => {
    for (const nav of [MANAGEMENT_NAV, STUDENT_PARENT_NAV]) {
      const ids = collectItems(nav).map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(collectItems(nav).every((item) => item.to.startsWith('/'))).toBe(true);
    }
  });

  it('keeps mock role fixtures within the permission catalogue', () => {
    for (const role of ROLES) {
      const unknown = MOCK_PERMISSIONS_BY_ROLE[role].filter(
        (permission) => !isKnownPermission(permission),
      );
      expect(unknown, `role ${role} grants unknown permissions`).toEqual([]);
    }
  });

  it('gives every role a non-empty permission set and a reachable landing page', () => {
    for (const role of ROLES) {
      expect(MOCK_PERMISSIONS_BY_ROLE[role].length).toBeGreaterThan(0);
    }
  });

  it('declares a known permission on every authenticated endpoint contract', () => {
    const endpoints = [...Object.values(authContract), ...Object.values(notificationsContract)];

    for (const endpoint of endpoints) {
      if (endpoint.permission) {
        expect(isKnownPermission(endpoint.permission)).toBe(true);
      }
    }
  });

  it('keeps the auth endpoints permission-free — they establish identity', () => {
    // Requiring a permission to discover your own permissions is circular.
    expect(authContract.login.permission).toBeUndefined();
    expect(authContract.me.permission).toBeUndefined();
    expect(authContract.login.auth).toBe(false);
  });
});

function collectItems(sections: readonly NavSection[]): NavItem[] {
  const out: NavItem[] = [];
  const walk = (items: readonly NavItem[]) => {
    for (const item of items) {
      out.push(item);
      if (item.children) walk(item.children);
    }
  };
  for (const section of sections) walk(section.items);
  return out;
}
