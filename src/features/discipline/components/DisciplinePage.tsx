import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDate } from '@/lib/utils/format';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, Input, NoResultsState, Pagination, QueryBoundary, Select, TableSkeleton, type Column } from '@/shared/ui';
import { useDisciplineCases } from '../hooks/useDiscipline';
import { disciplineSeverityTone, disciplineStatusTone } from '../status';
import { DISCIPLINE_SEVERITY_LABEL, DISCIPLINE_STATUS_LABEL, type DisciplineListItem } from '../types';

const FILTER_KEYS = ['status', 'severity'] as const;
const STATUS_OPTIONS = Object.entries(DISCIPLINE_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const SEVERITY_OPTIONS = Object.entries(DISCIPLINE_SEVERITY_LABEL).map(([value, label]) => ({ value, label }));

const columns: readonly Column<DisciplineListItem>[] = [
  { id: 'incidentNo', header: 'Incident', cell: (row) => <span className="font-medium tabular-nums">{row.incidentNo}</span> },
  { id: 'student', header: 'Student', cell: (row) => row.student },
  { id: 'category', header: 'Category', hideBelowMd: true, cell: (row) => row.category },
  { id: 'severity', header: 'Severity', width: '8rem', cell: (row) => <Badge tone={disciplineSeverityTone(row.severity)}>{DISCIPLINE_SEVERITY_LABEL[row.severity] ?? row.severity}</Badge> },
  { id: 'status', header: 'Status', width: '10rem', cell: (row) => <Badge tone={disciplineStatusTone(row.status)}>{DISCIPLINE_STATUS_LABEL[row.status] ?? row.status}</Badge> },
  { id: 'date', header: 'Date', align: 'right', width: '9rem', cell: (row) => <time dateTime={row.date}>{formatDate(row.date)}</time> },
];

/** Discipline cases (§ student affairs) — confidential, permission-gated. */
export function DisciplinePage() {
  const list = useListQueryState({ defaultLimit: 10, defaultSortBy: 'date', defaultSortDir: 'desc', filterKeys: FILTER_KEYS });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useDisciplineCases(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0) + (list.query.filters?.severity ? 1 : 0);

  function clearAll() { setSearchDraft(''); list.clear(); }

  return (
    <>
      <PageHeader title="Discipline" description="Incident records. Confidential — visible to authorized staff only." meta={query.data && <Badge tone="neutral">{query.data.total} cases</Badge>} />

      <p className="mb-4 inline-flex items-center gap-2 rounded-control border border-[var(--warning)] bg-[var(--warning-surface)] px-3 py-2 text-body-sm text-[var(--warning)]">
        <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
        Case details are confidential and must not be shared outside the discipline committee.
      </p>

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input label="Search" type="search" placeholder="Student, incident no. or category" containerClassName="sm:w-72" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
          <Select label="Status" placeholder="All statuses" containerClassName="sm:w-44" options={STATUS_OPTIONS} value={list.query.filters?.status?.toString() ?? ''} onChange={(e) => list.setFilter('status', e.target.value)} />
          <Select label="Severity" placeholder="All" containerClassName="sm:w-36" options={SEVERITY_OPTIONS} value={list.query.filters?.severity?.toString() ?? ''} onChange={(e) => list.setFilter('severity', e.target.value)} />
        </FilterBar>

        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={5} columns={6} /></div>}>
          {rows.length === 0 ? (
            activeFilters > 0 ? <NoResultsState onClear={clearAll} /> : <EmptyState title="No discipline cases" description="Recorded incidents appear here." />
          ) : (
            <>
              <DataTable
                caption="Discipline cases" columns={columns} rows={rows} rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => <Link to={`/management/discipline/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">Open</Link>}
                renderMobileCard={(row) => (
                  <Link to={`/management/discipline/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-2"><p className="font-medium">{row.student}</p><Badge tone={disciplineStatusTone(row.status)}>{DISCIPLINE_STATUS_LABEL[row.status] ?? row.status}</Badge></div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.incidentNo} · {row.category}</p>
                  </Link>
                )}
              />
              {query.data && <div className="border-t border-[var(--border)] p-3"><Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} limit={query.data.limit} onPageChange={list.setPage} /></div>}
            </>
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
