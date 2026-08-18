import { describe, expect, it } from 'vitest';
import { toPermissionSet } from '@/features/auth/permissions';
import type { NavSection } from '@/shared/types';
import { MANAGEMENT_NAV } from './management.nav';
import { filterNavSections } from './filter';

const SECTIONS: readonly NavSection[] = [
  { id: 'top', items: [{ id: 'dashboard', label: 'Dashboard', to: '/x' }] },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'payments', label: 'Payments', to: '/payments', anyOf: ['payments.view'] },
      { id: 'receipts', label: 'Receipts', to: '/receipts', anyOf: ['receipts.view'] },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        to: '/settings',
        children: [
          { id: 'general', label: 'General', to: '/settings/general', anyOf: ['settings.view'] },
          { id: 'roles', label: 'Roles', to: '/settings/roles', anyOf: ['roles.update'] },
        ],
      },
    ],
  },
];

describe('navigation filtering', () => {
  it('keeps items with no permission requirement', () => {
    const result = filterNavSections(SECTIONS, toPermissionSet([]));
    expect(result.map((section) => section.id)).toEqual(['top']);
  });

  it('keeps only the items the user holds a permission for', () => {
    const result = filterNavSections(SECTIONS, toPermissionSet(['payments.view']));
    const finance = result.find((section) => section.id === 'finance');
    expect(finance?.items.map((item) => item.id)).toEqual(['payments']);
  });

  it('drops sections whose items were all filtered out', () => {
    const result = filterNavSections(SECTIONS, toPermissionSet(['payments.view']));
    expect(result.some((section) => section.id === 'admin')).toBe(false);
  });

  it('keeps a parent when at least one child survives, and prunes the rest', () => {
    const result = filterNavSections(SECTIONS, toPermissionSet(['settings.view']));
    const admin = result.find((section) => section.id === 'admin');
    expect(admin?.items).toHaveLength(1);
    expect(admin?.items[0]?.children?.map((child) => child.id)).toEqual(['general']);
  });

  it('drops a parent when no child survives, even though the parent has no own requirement', () => {
    const result = filterNavSections(SECTIONS, toPermissionSet(['payments.view']));
    expect(result.find((section) => section.id === 'admin')).toBeUndefined();
  });

  it('produces role-appropriate management navigation without any role check', () => {
    // An accounts-style permission set must not reveal academic or admin modules.
    const accounts = toPermissionSet([
      'students.view',
      'payments.view',
      'receipts.view',
      'fee_structures.view',
    ]);
    const labels = filterNavSections(MANAGEMENT_NAV, accounts)
      .flatMap((section) => section.items)
      .map((item) => item.label);

    expect(labels).toContain('Payments');
    expect(labels).toContain('Students');
    expect(labels).not.toContain('Audit Logs');
    expect(labels).not.toContain('Attendance');
  });
});
