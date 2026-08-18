import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Tailwind class merging, taught about this project's design tokens.
 *
 * WHY THIS CONFIGURATION EXISTS — do not remove it.
 *
 * `tailwind-merge` resolves conflicting utilities by grouping them. It knows
 * Tailwind's built-in scales, but not ours. Without the extension below it
 * classifies `text-body`, `text-caption` and `text-metric` as *text colours*,
 * so any component doing
 *
 *     cn('text-metric', 'text-[var(--text-subtle)]')
 *
 * silently loses its font size — the two classes look like competing colours
 * and the last one wins. That is exactly how the type scale ended up only
 * half-applied: sidebar links and dashboard metrics fell back to the inherited
 * 16px while the tokens were, correctly, present in the stylesheet.
 *
 * Registering the custom scales fixes the size loss and also makes radius and
 * elevation overridable in the normal way (`cn(base, 'rounded-full')` now
 * actually wins). `cn.test.ts` locks this behaviour.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['caption', 'body-sm', 'body', 'title', 'page', 'metric'] }],
      rounded: [{ rounded: ['control', 'surface', 'overlay'] }],
      shadow: [{ shadow: ['raised', 'overlay', 'modal'] }],
    },
  },
});

/** Conditional class names with conflicting Tailwind utilities resolved. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
