import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useFieldIds } from '@/lib/utils/id';
import { Button } from './Button';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  children: ReactNode;
}

/**
 * Edge panel, used for mobile navigation and future filter panels.
 *
 * Like `Modal`, it is a native `<dialog>` so focus trapping and Escape work
 * without a custom implementation.
 */
export function Drawer({ open, onClose, title, side = 'left', children }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { id, labelId } = useFieldIds();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
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
      className={cn(
        'm-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-[var(--text)] backdrop:bg-black/50',
        side === 'left' ? 'mr-auto' : 'ml-auto',
      )}
    >
      <div className="surface-card flex h-dvh w-[85vw] max-w-xs flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
          <h2 id={labelId} className="text-title font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close menu">
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}
