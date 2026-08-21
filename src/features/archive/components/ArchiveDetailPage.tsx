import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, DataTable, QueryBoundary, Skeleton, type BadgeTone, type Column } from '@/shared/ui';
import { useArchivedBatch } from '../hooks/useArchive';
import type { ArchivedBatchDetail, ArchivedStudent } from '../types';

const OUTCOME_TONE: Record<string, BadgeTone> = {
  completed: 'success',
  transferred: 'info',
  withdrawn: 'neutral',
};
const OUTCOME_LABEL: Record<string, string> = {
  completed: 'Completed',
  transferred: 'Transferred',
  withdrawn: 'Withdrawn',
};

const studentColumns: readonly Column<ArchivedStudent>[] = [
  { id: 'name', header: 'Student', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'registerNo', header: 'Register no.', hideBelowMd: true, cell: (row) => <span className="tabular-nums text-body-sm">{row.registerNo}</span> },
  { id: 'outcome', header: 'Outcome', width: '9rem', cell: (row) => <Badge tone={OUTCOME_TONE[row.outcome] ?? 'neutral'}>{OUTCOME_LABEL[row.outcome] ?? row.outcome}</Badge> },
  { id: 'tcNumber', header: 'TC no.', hideBelowMd: true, cell: (row) => <span className="tabular-nums text-body-sm">{row.tcNumber || '—'}</span> },
  { id: 'destination', header: 'Destination', hideBelowMd: true, cell: (row) => row.destination || '—' },
  { id: 'effectiveDate', header: 'Effective', align: 'right', width: '9rem', cell: (row) => <time dateTime={row.effectiveDate}>{formatDate(row.effectiveDate)}</time> },
];

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children || '—'}</p>
    </div>
  );
}

/** An archived batch and the closed student records belonging to it. */
export function ArchiveDetailPage() {
  const { batchId = '' } = useParams();
  const query = useArchivedBatch(batchId);

  return (
    <>
      <Link to="/management/archive" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to archive
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-64" /><Skeleton className="h-40 w-full" /></CardBody></Card>}
      >
        {query.data && <BatchView batch={query.data} />}
      </QueryBoundary>
    </>
  );
}

function BatchView({ batch }: { batch: ArchivedBatchDetail }) {
  return (
    <>
      <PageHeader
        title={batch.name}
        description={`${batch.courseCode} — ${batch.course} · Section ${batch.section}`}
        meta={<Badge tone="neutral">{batch.academicYear}</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Students', formatNumber(batch.totalStudents)],
          ['Completed', formatNumber(batch.completed)],
          ['Transferred', formatNumber(batch.transferred)],
          ['Withdrawn', formatNumber(batch.withdrawn)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardBody className="flex flex-col gap-1">
              <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
              <span className="text-metric font-semibold tabular-nums text-[var(--text)]">{value}</span>
            </CardBody>
          </Card>
        ))}
      </div>

      <ContentSection title="Batch record">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info label="Course">{`${batch.courseCode} — ${batch.course}`}</Info>
            <Info label="Section">{batch.section}</Info>
            <Info label="Class teacher">{batch.facultyName}</Info>
            <Info label="Started">{batch.startedOn ? formatDate(batch.startedOn) : '—'}</Info>
            <Info label="Passed out">{batch.completedOn ? formatDate(batch.completedOn) : '—'}</Info>
          </CardBody>
        </Card>
      </ContentSection>

      <ContentSection title="Closed student records" description="Students whose admission ended while in this batch.">
        <Card className="overflow-hidden">
          {batch.students.length === 0 ? (
            <CardBody className="py-8 text-center text-body-sm text-[var(--text-subtle)]">
              No closed records for this batch. Students who completed with the batch are counted above.
            </CardBody>
          ) : (
            <DataTable caption="Closed student records" columns={studentColumns} rows={batch.students} rowKey={(row) => row.id} density="compact" />
          )}
        </Card>
      </ContentSection>
    </>
  );
}
