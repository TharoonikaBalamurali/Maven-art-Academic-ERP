import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton, type BadgeTone } from '@/shared/ui';
import { usePortalFees } from '../hooks/usePortal';
import type { PortalFees, PortalInstallmentStatus } from '../types';

const STATUS_LABEL: Record<string, string> = { paid: 'Paid', due: 'Due', upcoming: 'Upcoming', overdue: 'Overdue' };
const STATUS_TONE: Record<string, BadgeTone> = { paid: 'success', due: 'warning', upcoming: 'info', overdue: 'danger' };
function statusTone(status: PortalInstallmentStatus): BadgeTone { return STATUS_TONE[status] ?? 'neutral'; }

/** Portal fees (§7) — the caller's fee summary; all amounts backend-authoritative. */
export function PortalFeesPage() {
  const query = usePortalFees();
  return (
    <>
      <PageHeader title="Fees" description="Your fee summary, as reported by the backend." />
      <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody><Skeleton className="h-40 w-full" /></CardBody></Card>}>
        {query.data && <FeesView fees={query.data} />}
      </QueryBoundary>
    </>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <Card><CardBody className="flex flex-col gap-1">
      <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
      <span className={`tabular-nums ${emphasis ? 'text-metric font-semibold text-[var(--text)]' : 'text-body-lg text-[var(--text)]'}`}>{formatCurrency(value)}</span>
    </CardBody></Card>
  );
}

function FeesView({ fees }: { fees: PortalFees }) {
  return (
    <>
      {/* Assigned / paid / outstanding — each shown verbatim from the backend. */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Assigned" value={fees.assigned} />
        <Metric label="Paid" value={fees.paid} />
        <Metric label="Outstanding" value={fees.outstanding} emphasis />
      </div>
      <ContentSection title="Installments">
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {fees.installments.map((inst) => (
              <li key={inst.label} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-[var(--text)]">{inst.label}</p>
                  {inst.dueDate && <p className="text-body-sm text-[var(--text-muted)]">Due {formatDate(inst.dueDate)}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium text-[var(--text)]">{formatCurrency(inst.amount)}</span>
                  <Badge tone={statusTone(inst.status)}>{STATUS_LABEL[inst.status] ?? inst.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </ContentSection>
    </>
  );
}
