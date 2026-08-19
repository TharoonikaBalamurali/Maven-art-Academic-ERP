import { formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, QueryBoundary, TableSkeleton, type BadgeTone, type Column } from '@/shared/ui';
import { usePortalProgress } from '../hooks/usePortal';
import type { PortalProgressRecord, PortalProgressStatus } from '../types';

const STATUS_LABEL: Record<string, string> = { graded: 'Graded', pending: 'Pending', absent: 'Absent' };
const STATUS_TONE: Record<string, BadgeTone> = { graded: 'success', pending: 'warning', absent: 'danger' };
function statusTone(status: PortalProgressStatus): BadgeTone { return STATUS_TONE[status] ?? 'neutral'; }

const columns: readonly Column<PortalProgressRecord>[] = [
  { id: 'assessment', header: 'Assessment', cell: (row) => <span className="font-medium">{row.assessment}</span> },
  { id: 'type', header: 'Type', hideBelowMd: true, cell: (row) => row.type },
  { id: 'status', header: 'Status', width: '8rem', cell: (row) => <Badge tone={statusTone(row.status)}>{STATUS_LABEL[row.status] ?? row.status}</Badge> },
  { id: 'score', header: 'Score', align: 'right', width: '7rem', cell: (row) => <span className="tabular-nums">{row.score === null ? '—' : `${row.score} / ${row.maxScore}`}</span> },
  { id: 'grade', header: 'Grade', align: 'right', width: '6rem', cell: (row) => (row.grade ? <span className="font-semibold">{row.grade}</span> : <span className="text-[var(--text-subtle)]">—</span>) },
];

/** Portal progress (§7) — the caller's assessments; grades are backend-computed. */
export function PortalProgressPage() {
  const query = usePortalProgress();
  const rows = query.data?.records ?? [];
  return (
    <>
      <PageHeader title="Progress" description="Your assessment results. Grades are computed by the backend." />
      <Card className="overflow-hidden">
        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={4} columns={5} /></div>}>
          {rows.length === 0 ? (
            <EmptyState title="No results yet" description="Your assessment results will appear here." />
          ) : (
            <DataTable
              caption="Progress" columns={columns} rows={rows} rowKey={(row) => row.id}
              renderMobileCard={(row) => (
                <div className="border-b border-[var(--border)] px-3 py-3 last:border-0">
                  <div className="flex items-start justify-between gap-2"><p className="font-medium">{row.assessment}</p><Badge tone={statusTone(row.status)}>{STATUS_LABEL[row.status] ?? row.status}</Badge></div>
                  <p className="mt-1 flex items-center justify-between text-body-sm">
                    <span className="tabular-nums">{row.score === null ? '—' : `${row.score} / ${row.maxScore}`}{row.date ? ` · ${formatDate(row.date)}` : ''}</span>
                    {row.grade && <span className="font-semibold">{row.grade}</span>}
                  </p>
                </div>
              )}
            />
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
