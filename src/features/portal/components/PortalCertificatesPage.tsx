import { formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, QueryBoundary, TableSkeleton, type BadgeTone, type Column } from '@/shared/ui';
import { CERTIFICATE_STATUS_LABEL, CERTIFICATE_TYPE_LABEL } from '@/features/certificates/types';
import { usePortalCertificates } from '../hooks/usePortal';
import type { PortalCertificateRecord, PortalCertificateStatus } from '../types';

const STATUS_TONE: Record<string, BadgeTone> = { issued: 'success', requested: 'warning', revoked: 'danger' };
function statusTone(status: PortalCertificateStatus): BadgeTone { return STATUS_TONE[status] ?? 'neutral'; }

const columns: readonly Column<PortalCertificateRecord>[] = [
  { id: 'certificateNo', header: 'Certificate No.', cell: (row) => <span className="font-medium tabular-nums">{row.certificateNo}</span> },
  { id: 'type', header: 'Type', cell: (row) => CERTIFICATE_TYPE_LABEL[row.type] ?? row.type },
  { id: 'status', header: 'Status', width: '8rem', cell: (row) => <Badge tone={statusTone(row.status)}>{CERTIFICATE_STATUS_LABEL[row.status] ?? row.status}</Badge> },
  { id: 'issuedAt', header: 'Issued', align: 'right', width: '10rem', cell: (row) => (row.issuedAt ? <time dateTime={row.issuedAt}>{formatDate(row.issuedAt)}</time> : '—') },
];

/** Portal certificates (§7) — certificates issued to the caller by the backend. */
export function PortalCertificatesPage() {
  const query = usePortalCertificates();
  const rows = query.data?.records ?? [];
  return (
    <>
      <PageHeader title="Certificates" description="Certificates issued to you by the institution." />
      <Card className="overflow-hidden">
        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={3} columns={4} /></div>}>
          {rows.length === 0 ? (
            <EmptyState title="No certificates" description="Certificates issued to you will appear here." />
          ) : (
            <DataTable
              caption="Certificates" columns={columns} rows={rows} rowKey={(row) => row.id}
              renderMobileCard={(row) => (
                <div className="border-b border-[var(--border)] px-3 py-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium tabular-nums">{row.certificateNo}</p>
                    <Badge tone={statusTone(row.status)}>{CERTIFICATE_STATUS_LABEL[row.status] ?? row.status}</Badge>
                  </div>
                  <p className="mt-1 text-body-sm text-[var(--text-muted)]">{CERTIFICATE_TYPE_LABEL[row.type] ?? row.type}{row.issuedAt ? ` · ${formatDate(row.issuedAt)}` : ''}</p>
                </div>
              )}
            />
          )}
        </QueryBoundary>
      </Card>
      <p className="mt-4 text-body-sm text-[var(--text-subtle)]">Certificate documents are issued and stored by the institution.</p>
    </>
  );
}
