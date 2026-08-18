import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Crumb } from './useBreadcrumbs';

/**
 * Breadcrumb trail (§7 of the review brief).
 *
 * Rendered only when there is somewhere to go back to, so dashboards are not
 * cluttered with a single dead crumb. The current page is marked with
 * `aria-current="page"` and is not a link.
 */
export function Breadcrumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-body-sm text-[var(--text-muted)]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li>
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="rounded-control px-0.5 hover:text-[var(--text)] hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className="text-[var(--text)]">
                    {crumb.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-[var(--text-subtle)]">
                  <ChevronRight className="size-3.5" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
