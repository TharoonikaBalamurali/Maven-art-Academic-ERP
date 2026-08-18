import { Suspense, lazy, type ComponentType, type ReactElement } from 'react';
import { LoadingState } from '@/shared/ui';

/**
 * Route-level code splitting.
 *
 * Every page element goes through this helper, so a module's code is fetched
 * only when a user with the right permission actually navigates to it. Without
 * it, the entry chunk would grow with every one of the ~30 modules the
 * specification defines.
 *
 * Usage — the import must be a static string so the bundler can see it:
 *
 *   lazyRoute(() => import('@/features/students/components/StudentsPage'),
 *             (m) => m.StudentsPage)
 */
export function lazyRoute<TModule>(
  loader: () => Promise<TModule>,
  pick: (module: TModule) => ComponentType,
): ReactElement {
  const Component = lazy(async () => ({ default: pick(await loader()) }));

  return (
    <Suspense fallback={<LoadingState label="Loading page…" />}>
      <Component />
    </Suspense>
  );
}
