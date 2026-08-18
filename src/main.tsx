import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppErrorBoundary } from '@/app/router/ErrorBoundary';
import { router } from '@/app/router';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found in index.html.');

/**
 * Create the React root exactly once per page load.
 *
 * Vite can re-execute this module during hot updates. Calling `createRoot` a
 * second time on the same element mounts a *second* React tree into it, so the
 * whole application renders twice, overlapping. Caching the root on
 * `import.meta.hot.data` (which survives hot updates) makes re-execution
 * re-render the existing tree instead of creating a new one.
 */
interface HotData {
  root?: Root;
}

const hotData = import.meta.hot?.data as HotData | undefined;

const root: Root = hotData?.root ?? createRoot(container);

if (hotData) hotData.root = root;

root.render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);

// A full module dispose (e.g. the dev server restarting) must tear the tree
// down, otherwise the next load would attach to a container React still owns.
import.meta.hot?.dispose(() => {
  if (!import.meta.hot?.data) root.unmount();
});
