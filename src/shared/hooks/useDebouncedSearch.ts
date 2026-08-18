import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Two-way binding for a search box whose committed value lives in the URL.
 *
 * A search input needs a responsive local draft, but the committed term also
 * lives in the URL (so a filtered list is shareable and survives reload). Those
 * two can fight: naively syncing the draft to the committed value on every
 * change clobbers external URL changes — deep-linking to `?search=x` or using
 * the browser back button would wipe the term the moment the stale draft
 * debounced.
 *
 * This hook resolves it:
 *  - user typing flows draft → (debounced) → `onCommit` (which writes the URL);
 *  - external committed changes (back/forward, "clear filters", a shared link)
 *    flow committed → draft, using React's render-phase state-sync pattern so no
 *    effect clobbers them.
 */
export function useDebouncedSearch(
  committed: string,
  onCommit: (value: string) => void,
  delayMs = 300,
): readonly [string, (value: string) => void] {
  const [draft, setDraft] = useState(committed);
  const [seenCommitted, setSeenCommitted] = useState(committed);
  const debounced = useDebouncedValue(draft.trim(), delayMs);

  // Render-phase sync: when the committed value changes from outside the input,
  // reflect it in the draft. This is React's endorsed pattern for adjusting
  // state in response to a prop change, and it avoids a clobbering effect.
  if (committed !== seenCommitted) {
    setSeenCommitted(committed);
    setDraft(committed);
  }

  // Latest `onCommit` and `committed` are read through refs so the push effect
  // can depend only on the debounced draft — it must react to the user's typing
  // settling, not to external committed-value changes (handled above). Refs are
  // updated in an effect (not during render) and this effect is declared first,
  // so it runs before the push effect on every commit.
  const onCommitRef = useRef(onCommit);
  const committedRef = useRef(committed);
  useEffect(() => {
    onCommitRef.current = onCommit;
    committedRef.current = committed;
  });

  useEffect(() => {
    if (debounced !== committedRef.current) onCommitRef.current(debounced);
  }, [debounced]);

  return [draft, setDraft] as const;
}
