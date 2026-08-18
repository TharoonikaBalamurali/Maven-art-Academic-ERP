import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Permission-guarded action buttons belong here. */
  actions?: ReactNode;
}

/** Consistent page title block. Always renders the page's single `h1`. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-page font-semibold text-[var(--text)]">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-body text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
