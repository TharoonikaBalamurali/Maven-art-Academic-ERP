import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils/cn';
import { useFieldIds } from '@/lib/utils/id';

export interface DropdownProps {
  /** Rendered as the trigger content. */
  trigger: ReactNode;
  triggerLabel: string;
  align?: 'start' | 'end';
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}

/**
 * Menu button (step 16). Used by the header profile menu.
 *
 * Implements the essentials of the WAI-ARIA menu-button pattern: outside
 * clicks close it, Escape closes it, and the expanded state is exposed through
 * `aria-expanded`.
 *
 * Focus returns to the trigger only when the menu was dismissed deliberately
 * (Escape, or selecting an item). Closing by clicking elsewhere leaves focus
 * where the user put it.
 *
 * `close` reaches items through context rather than a render prop, so no ref
 * is read while rendering.
 */
const DropdownContext = createContext<{ close: () => void } | null>(null);

export function Dropdown({
  trigger,
  triggerLabel,
  align = 'end',
  children,
  className,
  triggerClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const { id } = useFieldIds();

  const close = useCallback(() => {
    restoreFocus.current = true;
    setOpen(false);
  }, []);

  const contextValue = useMemo(() => ({ close }), [close]);

  useEffect(() => {
    if (open) return;
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    triggerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        restoreFocus.current = true;
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={triggerLabel}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-md px-2 hover:bg-[var(--surface-sunken)]',
          triggerClassName,
        )}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={id}
          role="menu"
          className={cn(
            'surface-card absolute z-50 mt-1 min-w-52 rounded-md p-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <DropdownContext.Provider value={contextValue}>{children}</DropdownContext.Provider>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  onSelect,
  children,
  destructive = false,
  keepOpen = false,
}: {
  onSelect: () => void;
  children: ReactNode;
  destructive?: boolean;
  /** Leaves the menu open after selection (e.g. a multi-choice group). */
  keepOpen?: boolean;
}) {
  const context = useContext(DropdownContext);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect();
        if (!keepOpen) context?.close();
      }}
      className={cn(
        'flex min-h-11 w-full items-center gap-2 rounded px-3 text-left text-sm hover:bg-[var(--surface-sunken)]',
        destructive ? 'text-[var(--danger)]' : 'text-[var(--text)]',
      )}
    >
      {children}
    </button>
  );
}
