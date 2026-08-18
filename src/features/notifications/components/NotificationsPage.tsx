import { useEffect, useState } from 'react';
import { PageHeader } from '@/shared/layout/PageHeader';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import {
  Badge,
  Card,
  CardBody,
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
        <p className="truncate font-medium">{row.title}</p>
        <p className="truncate text-body-sm text-[var(--text-muted)]">{row.body}</p>
      </div>
    ),
  },
  {
    id: 'category',
    header: 'Category',
    cell: (row) => <Badge tone="accent">{row.category}</Badge>,
  },
  {
    id: 'read',
    header: 'Status',
    cell: (row) => (
      <Badge tone={row.read ? 'neutral' : 'warning'}>{row.read ? 'Read' : 'Unread'}</Badge>
    ),
  },
  {
    id: 'createdAt',
    header: 'Received',
    sortable: true,
    align: 'right',
    cell: (row) => <time dateTime={row.createdAt}>{formatDate(row.createdAt)}</time>,
  },
];

/**
 * Reference list page.
 *
 * This is the pattern every future module (Students, Payments, Attendance…)
 * follows: URL-held query state → hook → service → API client, with server-side
 * pagination and the shared data states. It exists to prove the foundation, not
 * to deliver the Notifications module.
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

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Reference implementation of the list architecture: server-side search, filtering, sorting and pagination."
      />

      <Card>
        <CardBody className="flex flex-col gap-4">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <Input
              label="Search"
              type="search"
              placeholder="Search notifications"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
            <Select
              label="Category"
              placeholder="All categories"
              options={CATEGORY_OPTIONS}
              value={list.query.filters?.category?.toString() ?? ''}
              onChange={(event) => list.setFilter('category', event.target.value)}
            />
            <Select
              label="Demo state (mock only)"
              placeholder="Normal"
              description="Forces the API to return a specific state."
              options={DEMO_STATE_OPTIONS}
              value={list.query.filters?.demoState?.toString() ?? ''}
              onChange={(event) => list.setFilter('demoState', event.target.value)}
            />
          </form>

          <QueryBoundary
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            loadingFallback={<TableSkeleton rows={6} columns={4} />}
          >
            {rows.length === 0 ? (
              list.isFiltered ? (
                <NoResultsState
                  onClear={() => {
                    setSearchDraft('');
                    list.clear();
                  }}
                />
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
                    <div className="surface-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{row.title}</p>
                        <Badge tone={row.read ? 'neutral' : 'warning'}>
                          {row.read ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-body text-[var(--text-muted)]">{row.body}</p>
                      <p className="mt-2 text-body-sm text-[var(--text-muted)]">
                        {row.category} · {formatDate(row.createdAt)}
                      </p>
                    </div>
                  )}
                />

                {query.data && (
                  <Pagination
                    page={query.data.page}
                    totalPages={query.data.totalPages}
                    total={query.data.total}
                    limit={query.data.limit}
                    onPageChange={list.setPage}
                  />
                )}
              </>
            )}
          </QueryBoundary>
        </CardBody>
      </Card>
    </>
  );
}
