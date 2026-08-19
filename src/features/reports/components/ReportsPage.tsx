import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Input,
  NoResultsState,
  QueryBoundary,
  Select,
  TableSkeleton,
  type Column,
} from '@/shared/ui';
import { useReports } from '../hooks/useReports';
import { reportCategoryTone } from '../category';
import { REPORT_CATEGORY_LABEL, type ReportListItem } from '../types';

const FILTER_KEYS = ['category'] as const;

const CATEGORY_OPTIONS = [
  { value: 'financial', label: 'Financial' },
  { value: 'operational', label: 'Operational' },
];

const columns: readonly Column<ReportListItem>[] = [
  { id: 'name', header: 'Report', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'description', header: 'Description', hideBelowMd: true, cell: (row) => row.description },
  {
    id: 'category',
    header: 'Category',
    width: '9rem',
    cell: (row) => <Badge tone={reportCategoryTone(row.category)}>{REPORT_CATEGORY_LABEL[row.category] ?? row.category}</Badge>,
  },
];

/** Reports catalog (§ reporting). */
export function ReportsPage() {
  const list = useListQueryState({ defaultLimit: 20, filterKeys: FILTER_KEYS });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useReports(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.category ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Operational and financial reports, computed by the backend."
        meta={query.data && <Badge tone="neutral">{query.data.total} reports</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Report name"
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
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={
            <div className="p-3">
              <TableSkeleton rows={5} columns={3} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState title="No reports" description="Reports appear here." />
            )
          ) : (
            <DataTable
              caption="Reports"
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              rowActions={(row) => (
                <Link to={`/management/reports/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                  Open
                </Link>
              )}
              renderMobileCard={(row) => (
                <Link
                  to={`/management/reports/${row.id}`}
                  className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{row.name}</p>
                    <Badge tone={reportCategoryTone(row.category)}>{REPORT_CATEGORY_LABEL[row.category] ?? row.category}</Badge>
                  </div>
                  <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.description}</p>
                </Link>
              )}
            />
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
