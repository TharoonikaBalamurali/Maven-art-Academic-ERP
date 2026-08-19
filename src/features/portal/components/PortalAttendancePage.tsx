import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton, type BadgeTone } from '@/shared/ui';
import { usePortalAttendance } from '../hooks/usePortal';
import type { PortalAttendance, PortalAttendanceStatus } from '../types';

const STATUS_LABEL: Record<string, string> = { present: 'Present', absent: 'Absent', late: 'Late' };
const STATUS_TONE: Record<string, BadgeTone> = { present: 'success', absent: 'danger', late: 'warning' };

/** Portal attendance (§7) — the caller's own record; percentage is backend-computed. */
export function PortalAttendancePage() {
  const query = usePortalAttendance();
  return (
    <>
      <PageHeader title="Attendance" description="Your attendance record, as computed by the backend." />
      <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody><Skeleton className="h-40 w-full" /></CardBody></Card>}>
        {query.data && <AttendanceView attendance={query.data} />}
      </QueryBoundary>
    </>
  );
}

function statusTone(status: PortalAttendanceStatus): BadgeTone { return STATUS_TONE[status] ?? 'neutral'; }

function AttendanceView({ attendance }: { attendance: PortalAttendance }) {
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card><CardBody className="flex flex-col gap-1"><span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Attendance</span><span className="text-metric font-semibold tabular-nums text-[var(--text)]">{attendance.percentage}%</span></CardBody></Card>
        <Card><CardBody className="flex flex-col gap-1"><span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Present</span><span className="text-metric font-semibold tabular-nums text-[var(--text)]">{attendance.present}</span></CardBody></Card>
        <Card><CardBody className="flex flex-col gap-1"><span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Sessions</span><span className="text-metric font-semibold tabular-nums text-[var(--text)]">{attendance.total}</span></CardBody></Card>
      </div>
      <ContentSection title="Recent">
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {attendance.recent.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div><p className="font-medium text-[var(--text)]">{r.subject}</p><p className="text-body-sm text-[var(--text-muted)]">{formatDate(r.date)}</p></div>
                <Badge tone={statusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </ContentSection>
    </>
  );
}
