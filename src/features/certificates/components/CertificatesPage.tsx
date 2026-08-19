import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDate } from '@/lib/utils/format';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Button,
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
import { useCertificates } from '../hooks/useCertificates';
import { certificateStatusTone } from '../status';
import { CERTIFICATE_STATUS_LABEL, CERTIFICATE_TYPE_LABEL, type CertificateListItem } from '../types';
import { IssueCertificateDialog } from './IssueCertificateDialog';

const FILTER_KEYS = ['status', 'type'] as const;

const STATUS_OPTIONS = Object.entries(CERTIFICATE_STATUS_LABEL).map(([value, label]) => ({ value, label }));

const columns: readonly Column<CertificateListItem>[] = [
  { id: 'certificateNo', header: 'Certificate No.', cell: (row) => <span className="font-medium tabular-nums">{row.certificateNo}</span> },
  { id: 'student', header: 'Student', cell: (row) => row.student },
  { id: 'type', header: 'Type', hideBelowMd: true, cell: (row) => CERTIFICATE_TYPE_LABEL[row.type] ?? row.type },
  {
    id: 'status',
    header: 'Status',
    width: '8rem',
    cell: (row) => <Badge tone={certificateStatusTone(row.status)}>{CERTIFICATE_STATUS_LABEL[row.status] ?? row.status}</Badge>,
  },
  {
    id: 'issuedAt',
    header: 'Issued',
    sortable: true,
    align: 'right',
    width: '10rem',
    cell: (row) => (row.issuedAt ? <time dateTime={row.issuedAt}>{formatDate(row.issuedAt)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
];

/** Certificates list (§27). */
export function CertificatesPage() {
  const [issuing, setIssuing] = useState(false);
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'issuedAt',
    defaultSortDir: 'desc',
    filterKeys: FILTER_KEYS,
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useCertificates(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0) + (list.query.filters?.type ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Certificates issued and stored by the backend."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
        actions={
          <PermissionGuard permission="certificates.issue">
            <Button onClick={() => setIssuing(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Issue certificate
            </Button>
          </PermissionGuard>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Student or certificate no."
            containerClassName="sm:w-64"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            containerClassName="sm:w-40"
            options={STATUS_OPTIONS}
            value={list.query.filters?.status?.toString() ?? ''}
            onChange={(event) => list.setFilter('status', event.target.value)}
          />
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={
            <div className="p-3">
              <TableSkeleton rows={5} columns={5} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState title="No certificates" description="Issued certificates appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Certificates"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/certificates/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/certificates/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium tabular-nums">{row.certificateNo}</p>
                      <Badge tone={certificateStatusTone(row.status)}>{CERTIFICATE_STATUS_LABEL[row.status] ?? row.status}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.student}</p>
                    <p className="mt-0.5 text-caption text-[var(--text-subtle)]">{CERTIFICATE_TYPE_LABEL[row.type] ?? row.type}</p>
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

      <IssueCertificateDialog open={issuing} onClose={() => setIssuing(false)} />
    </>
  );
}
