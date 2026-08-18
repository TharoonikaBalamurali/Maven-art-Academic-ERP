import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedSearch } from './useDebouncedSearch';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebouncedSearch', () => {
  it('commits the user’s typing once, after the debounce settles', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(({ c }) => useDebouncedSearch(c, onCommit, 300), {
      initialProps: { c: '' },
    });

    act(() => result.current[1]('a'));
    act(() => result.current[1]('ar'));
    act(() => result.current[1]('arj'));
    expect(onCommit).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(300));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('arj');
  });

  it('reflects an external committed change into the draft (deep link / back button)', () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(({ c }) => useDebouncedSearch(c, onCommit, 300), {
      initialProps: { c: '' },
    });

    // The URL changes externally (e.g. navigating to ?search=sheikh).
    rerender({ c: 'sheikh' });
    expect(result.current[0]).toBe('sheikh');

    // Crucially, that external value is NOT clobbered back to empty.
    act(() => void vi.advanceTimersByTime(300));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('does not re-commit a value that already matches the committed term', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(({ c }) => useDebouncedSearch(c, onCommit, 300), {
      initialProps: { c: 'active' },
    });

    act(() => result.current[1]('active'));
    act(() => void vi.advanceTimersByTime(300));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('trims before committing', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(({ c }) => useDebouncedSearch(c, onCommit, 300), {
      initialProps: { c: '' },
    });

    act(() => result.current[1]('  farhan  '));
    act(() => void vi.advanceTimersByTime(300));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('farhan');
  });
});
