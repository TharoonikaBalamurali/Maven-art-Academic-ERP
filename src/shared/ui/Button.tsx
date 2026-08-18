import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * Variants carry meaning, not decoration:
 *   primary   — the one affirmative action on a screen
 *   secondary — supporting actions
 *   ghost     — toolbar / icon actions inside dense chrome
 *   danger    — destructive, always paired with confirmation
 *   link      — inline navigation that must not look like a button
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]',
  secondary:
    'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
  ghost: 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
  link: 'text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-hover)]',
};

/**
 * `md` and above meet the 44px touch target. `sm` is reserved for controls
 * inside dense data tables, where a 44px row would waste vertical space.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-2.5 text-body-sm gap-1.5',
  md: 'min-h-11 px-3.5 text-body gap-2',
  lg: 'min-h-12 px-5 text-title gap-2',
  icon: 'min-h-11 min-w-11 px-0 gap-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction. */
  loading?: boolean;
  /** Announced to assistive technology while `loading` is true. */
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel = 'Working…',
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control font-medium',
        'transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : leadingIcon}
      {children != null && children !== '' && <span>{children}</span>}
      {loading ? <span className="sr-only">{loadingLabel}</span> : trailingIcon}
    </button>
  );
});
