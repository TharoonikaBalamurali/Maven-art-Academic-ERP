import { describe, expect, it } from 'vitest';
import { cn } from './cn';

/**
 * Regression tests for the design-token merge configuration.
 *
 * These exist because the failure they guard against is silent: without the
 * `extendTailwindMerge` config, a custom font-size token combined with a text
 * colour is dropped, and the component simply renders at the inherited size.
 * Nothing errors, nothing warns, and the type scale quietly stops working.
 */
describe('cn — design token awareness', () => {
  it('keeps a custom font size alongside a text colour', () => {
    const result = cn('text-metric', 'font-semibold', 'text-[var(--text-subtle)]');
    expect(result).toContain('text-metric');
    expect(result).toContain('text-[var(--text-subtle)]');
  });

  it.each(['text-caption', 'text-body-sm', 'text-body', 'text-title', 'text-page', 'text-metric'])(
    'keeps %s when a colour is also applied',
    (size) => {
      expect(cn(size, 'text-[var(--text-muted)]')).toContain(size);
    },
  );

  it('still lets one font size override another', () => {
    expect(cn('text-body', 'text-metric')).toBe('text-metric');
    // Built-in and custom sizes must resolve against each other too.
    expect(cn('text-metric', 'text-sm')).toBe('text-sm');
  });

  it('resolves custom radius tokens as a single group', () => {
    expect(cn('rounded-control', 'rounded-full')).toBe('rounded-full');
    expect(cn('rounded-surface', 'rounded-overlay')).toBe('rounded-overlay');
  });

  it('resolves custom elevation tokens as a single group', () => {
    expect(cn('shadow-overlay', 'shadow-none')).toBe('shadow-none');
    expect(cn('shadow-raised', 'shadow-modal')).toBe('shadow-modal');
  });

  it('leaves unrelated utilities untouched', () => {
    const result = cn('flex items-center gap-2', 'text-body', 'text-[var(--accent)]');
    expect(result).toContain('flex');
    expect(result).toContain('items-center');
    expect(result).toContain('gap-2');
    expect(result).toContain('text-body');
  });

  it('supports conditional and falsy inputs', () => {
    const hidden = false;
    expect(cn('a', hidden && 'b', undefined, null, 'c')).toBe('a c');
  });
});
