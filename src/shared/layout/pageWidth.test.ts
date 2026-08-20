import { describe, expect, it } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { inferPageWidth, resolvePageWidth, withPageWidth } from './pageWidth';

describe('inferPageWidth', () => {
  it('leaves list and index routes to the portal default', () => {
    expect(inferPageWidth('students')).toBeUndefined();
    expect(inferPageWidth('fee-structures')).toBeUndefined();
    expect(inferPageWidth(undefined)).toBeUndefined();
  });

  it('reads a :param route as a detail page', () => {
    expect(inferPageWidth('students/:studentId')).toBe('detail');
    expect(inferPageWidth('applications/:applicationId')).toBe('detail');
  });

  it('reads new/edit routes as forms', () => {
    expect(inferPageWidth('students/new')).toBe('form');
    expect(inferPageWidth('students/:studentId/edit')).toBe('form');
  });
});

describe('withPageWidth', () => {
  it('annotates routes with an inferred pageWidth handle', () => {
    const input: RouteObject[] = [
      { index: true },
      { path: 'students' },
      { path: 'students/new' },
      { path: 'students/:studentId' },
      { path: 'students/:studentId/edit' },
    ];
    const out = withPageWidth(input);
    expect((out[0]?.handle as { pageWidth?: string } | undefined)?.pageWidth).toBeUndefined();
    expect((out[1]?.handle as { pageWidth?: string } | undefined)?.pageWidth).toBeUndefined();
    expect((out[2]?.handle as { pageWidth?: string })?.pageWidth).toBe('form');
    expect((out[3]?.handle as { pageWidth?: string })?.pageWidth).toBe('detail');
    expect((out[4]?.handle as { pageWidth?: string })?.pageWidth).toBe('form');
  });

  it('never overrides an explicit handle', () => {
    const out = withPageWidth([{ path: 'students/:id', handle: { pageWidth: 'wide' } }]);
    expect((out[0]?.handle as { pageWidth?: string }).pageWidth).toBe('wide');
  });
});

describe('resolvePageWidth', () => {
  it('returns the most specific matched route width', () => {
    const matches = [{ handle: undefined }, { handle: { pageWidth: 'detail' } }];
    expect(resolvePageWidth(matches, 'wide')).toBe('detail');
  });

  it('falls back to the portal default when nothing is declared', () => {
    expect(resolvePageWidth([{ handle: undefined }, {}], 'wide')).toBe('wide');
    expect(resolvePageWidth([], 'detail')).toBe('detail');
  });
});
