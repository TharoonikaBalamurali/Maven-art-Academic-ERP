import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SortDirection } from '@/shared/types';

export interface Column<TRow> {
  id: string;
  header: string;
  cell: (row: TRow) => ReactNode;
  /** Enables the sort control. Sorting itself is performed by the backend (§31). */
  sortable?: boolean;
  align?: 'left' | 'right';
  /** Hides the column below `md`, for secondary data on narrow screens. */
  hideBelowMd?: boolean;
  /** Fixed column width, e.g. `'12rem'`. Useful for action and status columns. */
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface TableSort {
  sortBy: string;
  sortDir: SortDirection;
}

export interface RowSelection<TRow> {
  /** Ids of currently selected rows. */
  selectedIds: readonly string[];
  onChange: (selectedIds: string[]) => void;
  /** Rows that cannot be selected (e.g. locked records). */
  isSelectable?: (row: TRow) => boolean;
}

export interface DataTableProps<TRow> {
  columns: readonly Column<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow) => string;
  /** Accessible name for the table. */
  caption: string;
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  /** Enables the selection column and bulk actions. */
  selection?: RowSelection<TRow>;
  /** Per-row actions, rendered in a trailing column. */
  rowActions?: (row: TRow) => ReactNode;
  /** `compact` fits more rows per screen; `comfortable` is easier to scan. */
  density?: 'compact' | 'comfortable';
  /**
   * Card renderer used below the `sm` breakpoint. Management tables may omit it
   * and fall back to horizontal scrolling (§33: mobile = basic support);
   * Student/Parent tables should always provide one (mobile = first-class).
   */
  renderMobileCard?: (row: TRow) => ReactNode;
  className?: string;
}

/**
 * The ERP's table.
 *
 * Presentational only: it receives rows and reports sort/selection intent
 * upward. It never fetches, never paginates and never filters, which keeps
 * server-driven paging the only paging strategy (§31, §32) and makes the same
 * component usable by every future module.
 *
 * Visual decisions worth keeping: square inner corners (a table is a grid, not
 * a card), a header that stays legible while scrolling horizontally, tabular
 * figures so numeric columns align, and row hover/selection treated as
 * different states rather than the same grey.
 */
export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  caption,
  sort,
  onSortChange,
  selection,
  rowActions,
  density = 'comfortable',
  renderMobileCard,
  className,
}: DataTableProps<TRow>) {
  const cellPadding = density === 'compact' ? 'px-4 py-2' : 'px-4 py-3';

  const selectableRows = selection
    ? rows.filter((row) => selection.isSelectable?.(row) ?? true)
    : [];
  const selectedSet = new Set(selection?.selectedIds ?? []);
  const allSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selectedSet.has(rowKey(row)));
  const someSelected = selectableRows.some((row) => selectedSet.has(rowKey(row)));

  function nextSort(columnId: string): TableSort {
    if (sort?.sortBy === columnId) {
      return { sortBy: columnId, sortDir: sort.sortDir === 'asc' ? 'desc' : 'asc' };
    }
    return { sortBy: columnId, sortDir: 'asc' };
  }

  function toggleAll() {
    if (!selection) return;
    selection.onChange(allSelected ? [] : selectableRows.map(rowKey));
  }

  function toggleRow(id: string) {
    if (!selection) return;
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange([...next]);
  }

  return (
    <>
      {renderMobileCard && (
        <ul className="flex flex-col gap-2 sm:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)}>{renderMobileCard(row)}</li>
          ))}
        </ul>
      )}

      <div
        className={cn('w-full overflow-x-auto', renderMobileCard && 'hidden sm:block', className)}
      >
        <table className="w-full min-w-[44rem] border-collapse text-body">
          <caption className="sr-only">{caption}</caption>

          <thead>
            <tr className="border-b border-[var(--border)]">
              {selection && (
                <th scope="col" className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      // Indeterminate is a property, not an attribute.
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={toggleAll}
                    aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                    className="size-4 accent-[var(--accent)]"
                  />
                </th>
              )}

              {columns.map((column) => {
                const isSorted = sort?.sortBy === column.id;
                const SortIcon = !isSorted
                  ? ChevronsUpDown
                  : sort.sortDir === 'asc'
                    ? ArrowUp
                    : ArrowDown;

                return (
                  <th
                    key={column.id}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={
                      isSorted ? (sort.sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    className={cn(
                      'bg-[var(--surface-sunken)] px-4 py-2.5 text-left',
                      'text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase',
                      column.align === 'right' && 'text-right',
                      column.hideBelowMd && 'hidden md:table-cell',
                      column.headerClassName,
                    )}
                  >
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(nextSort(column.id))}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-control',
                          'hover:text-[var(--text)]',
                          isSorted && 'text-[var(--text)]',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        <SortIcon
                          className={cn(
                            'size-3 shrink-0',
                            !isSorted && 'text-[var(--text-subtle)]',
                          )}
                          aria-hidden="true"
                        />
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

              {rowActions && (
                <th scope="col" className="w-px bg-[var(--surface-sunken)] px-4 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const id = rowKey(row);
              const isSelected = selectedSet.has(id);
              const selectable = selection?.isSelectable?.(row) ?? true;

              return (
                <tr
                  key={id}
                  aria-selected={selection ? isSelected : undefined}
                  className={cn(
                    'border-b border-[var(--border)] last:border-0',
                    isSelected
                      ? 'bg-[var(--surface-selected)]'
                      : 'hover:bg-[var(--surface-hover)]',
                  )}
                >
                  {selection && (
                    <td className={cn(cellPadding, 'w-10')}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!selectable}
                        onChange={() => toggleRow(id)}
                        aria-label={isSelected ? 'Deselect row' : 'Select row'}
                        className="size-4 accent-[var(--accent)] disabled:opacity-40"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.id}
                      style={column.width ? { width: column.width } : undefined}
                      className={cn(
                        cellPadding,
                        'align-middle',
                        column.align === 'right' && 'text-right tabular-nums',
                        column.hideBelowMd && 'hidden md:table-cell',
                        column.cellClassName,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}

                  {rowActions && (
                    <td className={cn(cellPadding, 'text-right whitespace-nowrap')}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
