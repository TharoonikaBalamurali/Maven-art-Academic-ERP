import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Input,
  NoResultsState,
  Pagination,
  QueryBoundary,
  Select,
  TableSkeleton,
  type Column,
} from '@/shared/ui';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types';

const CATEGORY_OPTIONS = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'fees', label: 'Fees' },
  { value: 'academic', label: 'Academic' },
  { value: 'admission', label: 'Admission' },
  { value: 'system', label: 'System' },
];

/**
 * Mock-only control that forces the API into each state from §28, so the
 * loading/empty/error/forbidden paths can be exercised in a browser without
 * editing code. Hidden once a real backend is connected.
 */
const DEMO_STATE_OPTIONS = [
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Server error' },
  { value: 'forbidden', label: 'Forbidden' },
  { value: 'not_found', label: 'Not found' },
];

const FILTER_KEYS = ['category', 'demoState'] as const;

const CATEGORY_TONE = {
  attendance: 'info',
  fees: 'warning',
  academic: 'accent',
  admission: 'success',
  system: 'neutral',
} as const;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const columns: readonly Column<Notification>[] = [
  {
    id: 'title',
    header: 'Notification',
    cell: (row) => (
      <div className="min-w-0">
        <p className={row.read ? 'truncate' : 'truncate font-medium'}>{row.title}</p>
        <p className="truncate text-body-sm text-[var(--text-muted)]">{row.body}</p>
      </div>
    ),
  },
  {
    id: 'category',
    header: 'Category',
    width: '9rem',
    hideBelowMd: true,
    cell: (row) => (
      <Badge tone={CATEGORY_TONE[row.category as keyof typeof CATEGORY_TONE] ?? 'neutral'}>
        {row.category}
      </Badge>
    ),
  },
  {
    id: 'read',
    header: 'Status',
    width: '7rem',
    cell: (row) => (
      <Badge tone={row.read ? 'neutral' : 'warning'}>{row.read ? 'Read' : 'Unread'}</Badge>
    ),
  },
  {
    id: 'createdAt',
    header: 'Received',
    sortable: true,
    align: 'right',
    width: '10rem',
    cell: (row) => (
      <time dateTime={row.createdAt} className="text-[var(--text-muted)]">
        {formatDate(row.createdAt)}
      </time>
    ),
  },
];

/**
 * Reference list page.
 *
 * This is the pattern every future module (Students, Payments, Attendance…)
 * follows: URL-held query state → hook → service → API client, with
 * server-side pagination and the shared data states. It exists to prove the
 * foundation, not to deliver the Notifications module.
 */
export function NotificationsPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'createdAt',
    defaultSortDir: 'desc',
    filterKeys: FILTER_KEYS,
  });

  // The input stays responsive while the debounced value drives the request,
  // so typing costs one backend call rather than one per keystroke (§31).
  const [searchDraft, setSearchDraft] = useState(list.query.search ?? '');
  const debouncedSearch = useDebouncedValue(searchDraft.trim(), 300);
  const committedSearch = list.query.search ?? '';

  useEffect(() => {
    if (debouncedSearch !== committedSearch) list.setSearch(debouncedSearch);
  }, [debouncedSearch, committedSearch, list]);

  const query = useNotifications(list.query);
  const rows = query.data?.data ?? [];

  const activeFilters =
    (list.query.search ? 1 : 0) + Object.values(list.query.filters ?? {}).filter(Boolean).length;

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Reference implementation of the list architecture: server-side search, filtering, sorting and pagination."
        meta={<Badge tone="accent">Foundation</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Search notifications"
            containerClassName="sm:w-64"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <Select
            label="Category"
            placeholder="All categories"
            containerClassName="sm:w-44"
            options={CATEGORY_OPTIONS}
            value={list.query.filters?.category?.toString() ?? ''}
            onChange={(event) => list.setFilter('category', event.target.value)}
          />
          <Select
            label="Demo state"
            placeholder="Normal"
            description="Mock only — forces an API state."
            containerClassName="sm:w-44"
            options={DEMO_STATE_OPTIONS}
            value={list.query.filters?.demoState?.toString() ?? ''}
            onChange={(event) => list.setFilter('demoState', event.target.value)}
          />
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={
            <div className="p-3">
              <TableSkeleton rows={6} columns={4} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState
                title="No notifications"
                description="Notifications sent to you will appear here."
              />
            )
          ) : (
            <>
              <DataTable
                caption="Notifications"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={
                  list.query.sortBy
                    ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' }
                    : undefined
                }
                onSortChange={list.setSort}
                renderMobileCard={(row) => (
                  <div className="border-b border-[var(--border)] px-3 py-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={row.read ? '' : 'font-medium'}>{row.title}</p>
                      <Badge tone={row.read ? 'neutral' : 'warning'}>
                        {row.read ? 'Read' : 'Unread'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.body}</p>
                    <p className="mt-2 text-caption text-[var(--text-subtle)]">
                      {row.category} · {formatDate(row.createdAt)}
                    </p>
                  </div>
                )}
              />

              {query.data && (
                <div className="border-t border-[var(--border)] p-3">
                  <Pagination
                    page={query.data.page}
                    totalPages={query.data.totalPages}
                    total={query.data.total}
                    limit={query.data.limit}
                    onPageChange={list.setPage}
                  />
                </div>
              )}
            </>
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
