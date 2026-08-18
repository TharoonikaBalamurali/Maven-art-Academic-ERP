import { cn } from '@/lib/utils/cn';
import { env } from '@/config/env';

/**
 * Product identity.
 *
 * Restrained on purpose: a monogram tile, the product name and the portal it
 * belongs to. An ERP's chrome should identify the system at a glance and then
 * get out of the way of the data — so there is no logotype, no gradient and no
 * decorative flourish here.
 */
export function BrandMark({
  portalLabel,
  compact = false,
  className,
}: {
  portalLabel?: string;
  /** Monogram only — used by the collapsed sidebar. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-control',
          'bg-[var(--accent)] text-caption font-bold tracking-tight text-[var(--accent-contrast)]',
        )}
      >
        MA
      </span>

      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-body font-semibold text-[var(--text)]">
            {env.appName}
          </span>
          {portalLabel && (
            <span className="truncate text-caption text-[var(--text-subtle)]">{portalLabel}</span>
          )}
        </span>
      )}
    </span>
  );
}
