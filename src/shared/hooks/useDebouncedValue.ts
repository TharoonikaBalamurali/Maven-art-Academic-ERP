import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly-changing value.
 *
 * Used for search inputs so typing produces one request after a pause rather
 * than one per keystroke — important because ERP search is server-side (§31)
 * and every keystroke would otherwise hit the backend.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
