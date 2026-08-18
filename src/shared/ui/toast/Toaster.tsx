import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useToastStore, type Toast, type ToastTone } from './toast.store';

const TONE_STYLES: Record<ToastTone, string> = {
  info: 'border-[var(--border)]',
  success: 'border-[var(--success)]',
  error: 'border-[var(--danger)]',
};

const TONE_ICONS = { info: Info, success: CheckCircle2, error: AlertCircle } as const;

const AUTO_DISMISS_MS = 6000;

function ToastRow({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = TONE_ICONS[toast.tone];

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [toast.id, dismiss]);

  return (
    <li
      className={cn(
        'surface-card pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 p-3 shadow-lg',
        TONE_STYLES[toast.tone],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label={`Dismiss: ${toast.title}`}
        className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * Toast region. `role="status"` + `aria-live="polite"` means new messages are
 * announced without stealing focus (step 20).
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 sm:inset-x-auto sm:right-0 sm:justify-end"
    >
      <ul className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((entry) => (
          <ToastRow key={entry.id} toast={entry} />
        ))}
      </ul>
    </div>
  );
}
