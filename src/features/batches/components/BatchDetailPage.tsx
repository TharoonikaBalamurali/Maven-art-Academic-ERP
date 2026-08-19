import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatTimeRange } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Card,
  CardBody,
  DataTable,
  EmptyState,
  QueryBoundary,
  Skeleton,
  Tabs,
  type BadgeTone,
  type Column,
  type TabDefinition,
} from '@/shared/ui';
import { STUDENT_STATUS_LABEL } from '@/features/students/types';
import { useBatch } from '../hooks/useBatches';
import type { BatchDetail, BatchRosterStudent, BatchScheduleSlot } from '../types';

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  on_leave: 'warning',
  graduated: 'neutral',
};

const studentColumns: readonly Column<BatchRosterStudent>[] = [
  { id: 'registerNo', header: 'Register No.', width: '11rem', cell: (row) => <span className="font-mono text-body-sm">{row.registerNo}</span> },
  {
    id: 'name',
    header: 'Name',
    cell: (row) => (
      <Link to={`/management/students/${row.id}`} className="font-medium text-[var(--accent)] hover:underline">
        {row.name}
      </Link>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    width: '8rem',
    cell: (row) => (
      <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>
        {STUDENT_STATUS_LABEL[row.status] ?? row.status}
      </Badge>
    ),
  },
];

const scheduleColumns: readonly Column<BatchScheduleSlot>[] = [
  { id: 'subject', header: 'Subject', cell: (row) => <span className="font-medium">{row.subject}</span> },
  { id: 'faculty', header: 'Faculty', hideBelowMd: true, cell: (row) => row.faculty },
  { id: 'room', header: 'Room', width: '9rem', cell: (row) => row.room },
  { id: 'time', header: 'Time', align: 'right', width: '13rem', cell: (row) => formatTimeRange(row.start, row.end) },
];

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body text-[var(--text)]">{children}</p>
    </div>
  );
}

function buildTabs(batch: BatchDetail): TabDefinition[] {
  return [
    {
      id: 'students',
      label: `Students (${batch.studentCount})`,
      content:
        batch.students.length === 0 ? (
          <EmptyState title="No students enrolled" description="Enrolled students will appear here." />
        ) : (
          <div className="-mx-4 -mb-4">
            <DataTable
              caption={`Students in ${batch.name}`}
              columns={studentColumns}
              rows={batch.students}
              rowKey={(row) => row.id}
              density="compact"
            />
          </div>
        ),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      content:
        batch.schedule.length === 0 ? (
          <EmptyState title="No scheduled classes" description="This batch has no classes scheduled." />
        ) : (
          <div className="-mx-4 -mb-4">
            <DataTable
              caption={`Schedule for ${batch.name}`}
              columns={scheduleColumns}
              rows={batch.schedule}
              rowKey={(row) => row.id}
              density="compact"
            />
          </div>
        ),
    },
  ];
}

/**
 * Batch details (§19) — the relational view.
 *
 * The header keeps Course, Faculty and enrolment as distinct linked facts, and
 * the tabs present the batch's Students and Schedule. None of these are folded
 * into the batch record: a batch *references* a course and a faculty member,
 * and *has* a roster and a schedule.
 */
export function BatchDetailPage() {
  const { batchId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useBatch(batchId);

  const tabs = query.data ? buildTabs(query.data) : [];
  const requested = searchParams.get('tab') ?? 'students';
  const activeTab = tabs.some((t) => t.id === requested) ? requested : 'students';

  function selectTab(id: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id === 'students') next.delete('tab');
        else next.set('tab', id);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <>
      <Link
        to="/management/batches"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to batches
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={
          <Card>
            <CardBody className="flex flex-col gap-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-20 w-full" />
            </CardBody>
          </Card>
        }
      >
        {query.data && (
          <>
            <PageHeader
              title={query.data.name}
              description={`Section ${query.data.section}`}
              meta={
                <Badge tone={query.data.active ? 'success' : 'neutral'}>
                  {query.data.active ? 'Active' : 'Inactive'}
                </Badge>
              }
            />

            <Card className="mb-4">
              <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <InfoItem label="Course">
                  {query.data.course.code}
                  <span className="ml-1 text-body-sm text-[var(--text-muted)]">{query.data.course.name}</span>
                </InfoItem>
                <InfoItem label="Faculty">{query.data.faculty.name}</InfoItem>
                <InfoItem label="Section">{query.data.section}</InfoItem>
                <InfoItem label="Students">{query.data.studentCount}</InfoItem>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Tabs label="Batch details" tabs={tabs} activeId={activeTab} onChange={selectTab} />
              </CardBody>
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
