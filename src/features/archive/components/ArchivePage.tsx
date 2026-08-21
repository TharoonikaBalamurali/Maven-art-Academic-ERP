import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDate, formatNumber } from '@/lib/utils/format';
import { ContentSection, FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Input,
  NoResultsState,
  Pagination,
  QueryBoundary,
  TableSkeleton,
  type Column,
} from '@/shared/ui';
import { useArchivedBatches, useClosedStudents } from '../hooks/useArchive';
import type { ArchivedBatchListItem, ClosedStudentRecord } from '../types';

const columns: readonly Column<ArchivedBatchListItem>[] = [
  { id: 'name', header: 'Batch', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'course', header: 'Course', hideBelowMd: true, cell: (row) => `${row.courseCode} — ${row.course}` },
  { id: 'academicYear', header: 'Academic year', width: '10rem', cell: (row) => row.academicYear },
  {
    id: 'outcomes',
    header: 'Outcomes',
    hideBelowMd: true,
    width: '16rem',
    cell: (row) => (
      <span className="flex flex-wrap gap-1.5">
        <Badge tone="success">{row.completed} completed</Badge>
        {row.transferred > 0 && <Badge tone="info">{row.transferred} transferred</Badge>}
        {row.withdrawn > 0 && <Badge tone="neutral">{row.withdrawn} withdrawn</Badge>}
      </span>
    ),
  },
  { id: 'totalStudents', header: 'Students', align: 'right', width: '7rem', cell: (row) => <span className="tabular-nums">{formatNumber(row.totalStudents)}</span> },
  {
    id: 'completedOn',
    header: 'Passed out',
    sortable: true,
    align: 'right',
    width: '10rem',
    cell: (row) => (row.completedOn ? <time dateTime={row.completedOn}>{formatDate(row.completedOn)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
];

/**
 * Archive (§ archive) — passed-out batches and their closed student records,
 * kept apart from the active roster so history never clutters current work.
 */
export function ArchivePage() {
  const list = useListQueryState({ defaultLimit: 10, defaultSortBy: 'completedOn', defaultSortDir: 'desc' });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useArchivedBatches(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = list.query.search ? 1 : 0;

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Archive"
        description="Passed-out batches and closed student records. Preserved permanently; never edited here."
        meta={query.data && <Badge tone="neutral">{query.data.total} batches</Badge>}
      />

      <p className="mb-4 inline-flex items-center gap-2 rounded-control border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-body-sm text-[var(--text-muted)]">
        <Archive className="size-4 shrink-0" aria-hidden="true" />
        Records here are read-only history. Active batches live under Batches.
      </p>

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input label="Search" type="search" placeholder="Batch or course" containerClassName="sm:w-72" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={<div className="p-3"><TableSkeleton rows={4} columns={6} /></div>}
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? <NoResultsState onClear={clearAll} /> : <EmptyState title="Nothing archived yet" description="Batches appear here once they pass out." />
          ) : (
            <>
              <DataTable
                caption="Archived batches"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/archive/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link to={`/management/archive/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.name}</p>
                      <Badge tone="neutral">{row.academicYear}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.courseCode} · {formatNumber(row.totalStudents)} students</p>
                  </Link>
                )}
              />
              {query.data && (
                <div className="border-t border-[var(--border)] p-3">
                  <Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} limit={query.data.limit} onPageChange={list.setPage} />
                </div>
              )}
            </>
          )}
        </QueryBoundary>
      </Card>

      <div className="mt-8">
        <ClosedStudents />
      </div>
    </>
  );
}

const OUTCOME_TONE: Record<string, 'success' | 'info' | 'neutral'> = {
  completed: 'success',
  transferred: 'info',
  withdrawn: 'neutral',
};
const OUTCOME_LABEL: Record<string, string> = { completed: 'Completed', transferred: 'Transferred', withdrawn: 'Withdrawn' };

const studentColumns: readonly Column<ClosedStudentRecord>[] = [
  { id: 'name', header: 'Student', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'registerNo', header: 'Register no.', hideBelowMd: true, cell: (row) => <span className="tabular-nums text-body-sm">{row.registerNo}</span> },
  { id: 'batch', header: 'Batch', hideBelowMd: true, cell: (row) => row.batch },
  { id: 'outcome', header: 'Outcome', width: '9rem', cell: (row) => <Badge tone={OUTCOME_TONE[row.outcome] ?? 'neutral'}>{OUTCOME_LABEL[row.outcome] ?? row.outcome}</Badge> },
  { id: 'tcNumber', header: 'TC no.', hideBelowMd: true, cell: (row) => <span className="tabular-nums text-body-sm">{row.tcNumber || '—'}</span> },
  { id: 'effectiveDate', header: 'Closed', align: 'right', width: '9rem', cell: (row) => <time dateTime={row.effectiveDate}>{formatDate(row.effectiveDate)}</time> },
];

/** Closed student records — independent of whether their batch has passed out. */
function ClosedStudents() {
  const list = useListQueryState({ defaultLimit: 10, defaultSortBy: 'effectiveDate', defaultSortDir: 'desc' });
  const query = useClosedStudents(list.query);
  const rows = query.data?.data ?? [];

  return (
    <ContentSection
      title="Closed student records"
      description="Admissions that ended — completed, transferred out or withdrawn."
    >
      <Card className="overflow-hidden">
        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={<div className="p-3"><TableSkeleton rows={3} columns={6} /></div>}
        >
          {rows.length === 0 ? (
            <EmptyState title="No closed records" description="Closing an admission files the record here." />
          ) : (
            <>
              <DataTable
                caption="Closed student records"
                columns={studentColumns}
                rows={rows}
                rowKey={(row) => row.id}
                density="compact"
                rowActions={(row) => (
                  <Link to={`/management/students/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open record
                  </Link>
                )}
              />
              {query.data && query.data.totalPages > 1 && (
                <div className="border-t border-[var(--border)] p-3">
                  <Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} limit={query.data.limit} onPageChange={list.setPage} />
                </div>
              )}
            </>
          )}
        </QueryBoundary>
      </Card>
    </ContentSection>
  );
}
