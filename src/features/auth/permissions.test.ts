import { describe, expect, it } from 'vitest';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  satisfies,
  toPermissionSet,
} from './permissions';

const granted = toPermissionSet(['students.view', 'students.create', 'payments.view']);

describe('permission algebra', () => {
  it('grants only permissions the backend returned', () => {
    expect(hasPermission(granted, 'students.view')).toBe(true);
    expect(hasPermission(granted, 'students.delete')).toBe(false);
  });

  it('accepts backend permissions that are not in the frontend catalogue', () => {
    // Forward compatibility: the backend may add permissions between releases.
    const future = toPermissionSet(['modules.something.new']);
    expect(hasPermission(future, 'modules.something.new')).toBe(true);
  });

  it('treats an empty requirement as "no permission required"', () => {
    // Navigation items such as Dashboard declare no permission; they must stay
    // visible rather than being filtered out.
    expect(hasAnyPermission(granted, [])).toBe(true);
    expect(hasAllPermissions(granted, [])).toBe(true);
    expect(satisfies(granted, {})).toBe(true);
  });

  it('requires one match for anyOf and every match for allOf', () => {
    expect(hasAnyPermission(granted, ['students.delete', 'payments.view'])).toBe(true);
    expect(hasAnyPermission(granted, ['students.delete', 'audit.view'])).toBe(false);

    expect(hasAllPermissions(granted, ['students.view', 'students.create'])).toBe(true);
    expect(hasAllPermissions(granted, ['students.view', 'students.delete'])).toBe(false);
  });

  it('requires both clauses when a requirement declares anyOf and allOf', () => {
    expect(
      satisfies(granted, { anyOf: ['students.view'], allOf: ['payments.view'] }),
    ).toBe(true);
    expect(
      satisfies(granted, { anyOf: ['students.view'], allOf: ['audit.view'] }),
    ).toBe(false);
    expect(
      satisfies(granted, { anyOf: ['audit.view'], allOf: ['students.view'] }),
    ).toBe(false);
  });

  it('denies everything for a user with no permissions', () => {
    const none = toPermissionSet([]);
    expect(hasPermission(none, 'students.view')).toBe(false);
    expect(satisfies(none, { anyOf: ['students.view'] })).toBe(false);
  });
});
