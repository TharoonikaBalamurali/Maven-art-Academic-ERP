import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useFieldIds } from '@/lib/utils/id';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** `sheet` slides up from the bottom on small screens (mobile-first, §33). */
  variant?: 'center' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  children: ReactNode;
}

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' } as const;

/**
 * Dialog built on the native `<dialog>` element (step 20).
 *
 * Using the platform element gives us the focus trap, the top layer, inert
 * background content and Escape-to-close for free, all of which are difficult
 * to reimplement correctly. `Drawer` and `ConfirmDialog` build on this.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  variant = 'center',
  size = 'md',
  footer,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { id, labelId, descriptionId } = useFieldIds();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Fires for Escape and for form[method=dialog] submissions alike.
    const handleClose = () => onClose();
    // The backdrop is part of the dialog element, so a click landing directly
    // on the dialog (not its content wrapper) is a backdrop click.
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose();
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'w-full max-w-none bg-transparent p-0 text-[var(--text)] backdrop:bg-black/50',
        'm-0 max-h-none',
        variant === 'center'
          ? 'sm:m-auto'
          : 'mt-auto mb-0 sm:m-auto',
      )}
    >
      <div
        className={cn(
          'surface-card mx-auto flex max-h-[90dvh] w-full flex-col overflow-hidden shadow-modal',
          variant === 'center' ? 'rounded-t-overlay sm:rounded-overlay' : 'rounded-t-overlay sm:rounded-overlay',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="min-w-0">
            <h2 id={labelId} className="text-title font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-body text-[var(--text-muted)]">
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
