import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  buttonClasses,
  Card,
  DataTable,
  EmptyState,
  Input,
  NoResultsState,
  Pagination,
  QueryBoundary,
  Select,
  TableSkeleton,
  type BadgeTone,
  type Column,
} from '@/shared/ui';
import { useStudentFilterOptions, useStudents } from '../hooks/useStudents';
import { STUDENT_STATUS_LABEL, type StudentListItem } from '../types';

const FILTER_KEYS = ['course', 'status', 'demoState'] as const;

const DEMO_STATE_OPTIONS = [
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Server error' },
  { value: 'forbidden', label: 'Forbidden' },
];

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  on_leave: 'warning',
  graduated: 'neutral',
};

const columns: readonly Column<StudentListItem>[] = [
  {
    id: 'registerNo',
    header: 'Register No.',
    sortable: true,
    width: '11rem',
    cell: (row) => <span className="font-mono text-body-sm">{row.registerNo}</span>,
  },
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'course',
    header: 'Course',
    sortable: true,
    hideBelowMd: true,
    cell: (row) => (
      <span>
        <span className="text-[var(--text)]">{row.courseCode}</span>
        <span className="ml-1 text-body-sm text-[var(--text-muted)]">{row.course}</span>
      </span>
    ),
  },
  { id: 'batch', header: 'Batch', hideBelowMd: true, cell: (row) => row.batch },
  { id: 'section', header: 'Section', width: '6rem', hideBelowMd: true, cell: (row) => row.section },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    width: '8rem',
    cell: (row) => (
      <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>
        {STUDENT_STATUS_LABEL[row.status] ?? row.status}
      </Badge>
    ),
  },
];

/**
 * Students list (§14.1) — the flagship management table.
 *
 * The reference list pattern applied to a real module: URL-held query state →
 * hook → service → API client, with server-side search, filtering, sorting and
 * pagination (§31, §32). Nothing in `app/`, `lib/` or `shared/` was changed to
 * build this — a module is a feature folder plus one route entry.
 *
 * Student *details* (the eight-tab record) is a separate unit; the row actions
 * link to the detail route, which currently renders a placeholder.
 */
export function StudentsPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'registerNo',
    defaultSortDir: 'asc',
    filterKeys: FILTER_KEYS,
  });

  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);

  const query = useStudents(list.query);
  const filterOptions = useStudentFilterOptions();
  const rows = query.data?.data ?? [];

  const activeFilters =
    (list.query.search ? 1 : 0) + Object.values(list.query.filters ?? {}).filter(Boolean).length;

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  const courseOptions = (filterOptions.data?.courses ?? []).map((c) => ({ value: c.id, label: c.name }));
  const statusOptions = (filterOptions.data?.statuses ?? []).map((s) => ({ value: s.value, label: s.label }));

  return (
    <>
      <PageHeader
        title="Students"
        description="Search, filter and manage student records across all programmes."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
        actions={
          <PermissionGuard permission="students.create">
            <Link to="/management/students/new" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden="true" />
              New student
            </Link>
          </PermissionGuard>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Name or register number"
            containerClassName="sm:w-64"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <Select
            label="Course"
            placeholder="All courses"
            containerClassName="sm:w-52"
            options={courseOptions}
            value={list.query.filters?.course?.toString() ?? ''}
            onChange={(event) => list.setFilter('course', event.target.value)}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            containerClassName="sm:w-40"
            options={statusOptions}
            value={list.query.filters?.status?.toString() ?? ''}
            onChange={(event) => list.setFilter('status', event.target.value)}
          />
          <Select
            label="Demo state"
            placeholder="Normal"
            description="Mock only — forces an API state."
            containerClassName="sm:w-40"
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
              <TableSkeleton rows={8} columns={6} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState
                title="No students yet"
                description="Student records will appear here once admissions are enrolled."
              />
            )
          ) : (
            <>
              <DataTable
                caption="Students"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={
                  list.query.sortBy
                    ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'asc' }
                    : undefined
                }
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <span className="flex items-center justify-end gap-3">
                    <Link
                      to={`/management/students/${row.id}`}
                      className="text-body-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      View
                    </Link>
                    <PermissionGuard permission="students.update">
                      <Link
                        to={`/management/students/${row.id}`}
                        className="text-body-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:underline"
                      >
                        Edit
                      </Link>
                    </PermissionGuard>
                  </span>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/students/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.name}</p>
                      <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>
                        {STUDENT_STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-body-sm text-[var(--text-muted)]">
                      {row.registerNo}
                    </p>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">
                      {row.courseCode} · {row.batch} · Section {row.section}
                    </p>
                  </Link>
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
