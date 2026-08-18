import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('withholds the new value until the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(299));
    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(1));
    expect(result.current).toBe('ab');
  });

  it('emits once for a burst of changes — the point of the hook', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '' },
    });

    for (const value of ['s', 'st', 'stu', 'stud']) {
      rerender({ value });
      act(() => void vi.advanceTimersByTime(100));
    }

    // Still nothing: each keystroke restarted the timer.
    expect(result.current).toBe('');

    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe('stud');
  });
});
