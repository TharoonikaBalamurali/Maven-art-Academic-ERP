import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SortDirection } from '@/shared/types';

export interface Column<TRow> {
  id: string;
  header: string;
  cell: (row: TRow) => ReactNode;
  /** Enables the sort control. Sorting itself is performed by the backend (§31). */
  sortable?: boolean;
  align?: 'left' | 'right';
  headerClassName?: string;
  cellClassName?: string;
}

export interface TableSort {
  sortBy: string;
  sortDir: SortDirection;
}

export interface DataTableProps<TRow> {
  columns: readonly Column<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow) => string;
  /** Accessible name for the table. */
  caption: string;
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  /**
   * Card renderer used below the `sm` breakpoint. Management tables may omit
   * it and fall back to horizontal scrolling (§33: mobile = basic support);
   * Student/Parent tables should always provide one (mobile = first-class).
   */
  renderMobileCard?: (row: TRow) => ReactNode;
  className?: string;
}

/**
 * Presentational table (step 16).
 *
 * It knows nothing about fetching, pagination or filtering — it receives rows
 * and reports sort intent upwards. That keeps it reusable for every future ERP
 * module and keeps server-side paging the only paging strategy (§31, §32).
 */
export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  caption,
  sort,
  onSortChange,
  renderMobileCard,
  className,
}: DataTableProps<TRow>) {
  function nextSort(columnId: string): TableSort {
    if (sort?.sortBy === columnId) {
      return { sortBy: columnId, sortDir: sort.sortDir === 'asc' ? 'desc' : 'asc' };
    }
    return { sortBy: columnId, sortDir: 'asc' };
  }

  return (
    <>
      {renderMobileCard && (
        <ul className="flex flex-col gap-3 sm:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)}>{renderMobileCard(row)}</li>
          ))}
        </ul>
      )}

      <div
        className={cn(
          'w-full overflow-x-auto',
          renderMobileCard && 'hidden sm:block',
          className,
        )}
      >
        <table className="w-full min-w-[40rem] border-collapse text-body">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              {columns.map((column) => {
                const isSorted = sort?.sortBy === column.id;
                const SortIcon = !isSorted ? ArrowUpDown : sort.sortDir === 'asc' ? ArrowUp : ArrowDown;

                return (
                  <th
                    key={column.id}
                    scope="col"
                    // aria-sort tells assistive tech the current ordering.
                    aria-sort={isSorted ? (sort.sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'px-3 py-2 text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase',
                      column.align === 'right' && 'text-right',
                      column.headerClassName,
                    )}
                  >
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(nextSort(column.id))}
                        className="inline-flex items-center gap-1 rounded hover:text-[var(--text)]"
                      >
                        {column.header}
                        <SortIcon className="size-3" aria-hidden="true" />
                        <span className="sr-only">
                          {isSorted
                            ? `Sorted ${sort.sortDir === 'asc' ? 'ascending' : 'descending'}. Activate to reverse.`
                            : 'Not sorted. Activate to sort.'}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-sunken)]"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      'px-3 py-2.5 align-middle',
                      column.align === 'right' && 'text-right',
                      column.cellClassName,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
