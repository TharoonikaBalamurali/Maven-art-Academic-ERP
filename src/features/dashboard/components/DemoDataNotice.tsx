import { Info } from 'lucide-react';
import { env } from '@/config/env';

/**
 * Makes clear that the figures on a dashboard are demonstration data served by
 * the mock API, not authoritative institutional data. Shown only in mock mode,
 * so it disappears the moment the real backend is connected — satisfying
 * "clearly treat mock data as demonstration data" and "do not make fake data
 * appear authoritative".
 */
export function DemoDataNotice() {
  if (env.apiMode !== 'mock') return null;

  return (
    <div className="mb-4 flex items-start gap-2 rounded-control border border-[var(--info)] bg-[var(--info-surface)] px-3 py-2 text-body-sm text-[var(--info)]">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-medium">Demonstration data.</span> Figures are served by the mock API
        for preview. They are replaced by live institutional data once the backend is connected.
      </p>
    </div>
  );
}
