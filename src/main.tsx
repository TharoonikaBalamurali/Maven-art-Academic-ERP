import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppErrorBoundary } from '@/app/router/ErrorBoundary';
import { router } from '@/app/router';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found in index.html.');

createRoot(container).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);
