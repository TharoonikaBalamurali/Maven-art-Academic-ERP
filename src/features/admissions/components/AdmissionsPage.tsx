import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDate } from '@/lib/utils/format';
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
import { useAdmissions } from '../hooks/useAdmissions';
import { admissionStageTone } from '../stage';
import { ADMISSION_STAGE_LABEL, type AdmissionListItem } from '../types';

const FILTER_KEYS = ['stage'] as const;

const STAGE_OPTIONS = [
  { value: 'offered', label: 'Offered' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'cancelled', label: 'Cancelled' },
];

const columns: readonly Column<AdmissionListItem>[] = [
  { id: 'applicant', header: 'Applicant', cell: (row) => <span className="font-medium">{row.applicant}</span> },
  { id: 'programme', header: 'Programme', hideBelowMd: true, cell: (row) => row.programme },
  {
    id: 'stage',
    header: 'Stage',
    width: '10rem',
    cell: (row) => <Badge tone={admissionStageTone(row.stage)}>{ADMISSION_STAGE_LABEL[row.stage] ?? row.stage}</Badge>,
  },
  {
    id: 'offeredAt',
    header: 'Offered',
    sortable: true,
    align: 'right',
    width: '10rem',
    cell: (row) => (row.offeredAt ? <time dateTime={row.offeredAt}>{formatDate(row.offeredAt)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
];

/** Admissions list (§17). */
export function AdmissionsPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'offeredAt',
    defaultSortDir: 'desc',
    filterKeys: FILTER_KEYS,
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useAdmissions(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.stage ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Admissions"
        description="Confirm admission offers and enrol admitted applicants."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Applicant or programme"
            containerClassName="sm:w-64"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <Select
            label="Stage"
            placeholder="All stages"
            containerClassName="sm:w-44"
            options={STAGE_OPTIONS}
            value={list.query.filters?.stage?.toString() ?? ''}
            onChange={(event) => list.setFilter('stage', event.target.value)}
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
              <EmptyState title="No admissions" description="Approved applications become admissions here." />
            )
          ) : (
            <>
              <DataTable
                caption="Admissions"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/admissions/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/admissions/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.applicant}</p>
                      <Badge tone={admissionStageTone(row.stage)}>{ADMISSION_STAGE_LABEL[row.stage] ?? row.stage}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.programme}</p>
                    {row.offeredAt && <p className="mt-1 text-caption text-[var(--text-subtle)]">Offered {formatDate(row.offeredAt)}</p>}
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
