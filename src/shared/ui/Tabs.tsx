import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { useFieldIds } from '@/lib/utils/id';

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  tabs: readonly TabDefinition[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}

/**
 * Tabs implementing the WAI-ARIA tabs pattern (step 20): roving tabindex, and
 * arrow/Home/End keys to move between tabs.
 */
export function Tabs({ tabs, activeId, onChange, label, className }: TabsProps) {
  const { id } = useFieldIds();
  const listRef = useRef<HTMLDivElement>(null);

  function focusTab(index: number) {
    const bounded = (index + tabs.length) % tabs.length;
    const tab = tabs[bounded];
    if (!tab) return;
    onChange(tab.id);
    listRef.current?.querySelector<HTMLButtonElement>(`#${id}-tab-${bounded}`)?.focus();
  }

  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeId));

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto border-b border-[var(--border)]"
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') { event.preventDefault(); focusTab(activeIndex + 1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); focusTab(activeIndex - 1); }
          if (event.key === 'Home') { event.preventDefault(); focusTab(0); }
          if (event.key === 'End') { event.preventDefault(); focusTab(tabs.length - 1); }
        }}
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              id={`${id}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                'min-h-11 shrink-0 border-b-2 px-3 text-body font-medium transition-colors',
                selected
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          hidden={tab.id !== activeId}
          tabIndex={0}
          className="pt-4"
        >
          {tab.id === activeId && tab.content}
        </div>
      ))}
    </div>
  );
}
