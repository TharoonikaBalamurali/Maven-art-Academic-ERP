import { AlertCircle } from 'lucide-react';

/** Form-level error banner. Announced immediately because it follows a submit. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-control border border-[var(--danger)] bg-[var(--danger-surface)] px-3 py-2 text-body text-[var(--danger)]"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
