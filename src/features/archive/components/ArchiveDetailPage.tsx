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
  {
    id: 'name',
    header: 'Student',
    cell: (row) => (
      <div className="min-w-0">
        <Link to={`/management/archive/students/${row.id}`} className="font-medium text-[var(--accent)] hover:underline">
          {row.name}
        </Link>
        <p className="truncate text-body-sm text-[var(--text-muted)]">{row.registerNo}</p>
      </div>
    ),
  },
  { id: 'group', header: 'Group studied', hideBelowMd: true, cell: (row) => row.group },
  { id: 'rollNo', header: 'Roll no.', hideBelowMd: true, width: '9rem', cell: (row) => <span className="tabular-nums text-body-sm">{row.rollNo || '—'}</span> },
  {
    id: 'percentage',
    header: 'Board %',
    align: 'right',
    width: '8rem',
    // Backend-computed percentage — displayed verbatim.
    cell: (row) =>
      row.boardExam ? (
        <span className="font-medium tabular-nums">{row.boardExam.percentage}%</span>
      ) : (
        <span className="text-[var(--text-subtle)]">—</span>
      ),
  },
  {
    id: 'grade',
    header: 'Grade',
    align: 'right',
    width: '6rem',
    cell: (row) => (row.boardExam ? <span className="font-semibold">{row.boardExam.grade}</span> : <span className="text-[var(--text-subtle)]">—</span>),
  },
  { id: 'outcome', header: 'Outcome', width: '9rem', cell: (row) => <Badge tone={OUTCOME_TONE[row.outcome] ?? 'neutral'}>{OUTCOME_LABEL[row.outcome] ?? row.outcome}</Badge> },
  { id: 'tcNumber', header: 'TC no.', align: 'right', hideBelowMd: true, width: '10rem', cell: (row) => <span className="tabular-nums text-body-sm">{row.tcNumber || '—'}</span> },
];

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children || '—'}</p>
    </div>
  );
}

/** An archived batch: its record, section headcounts, and the full leaving roster. */
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
        description={`${batch.courseCode} — ${batch.course}`}
        meta={<Badge tone="neutral">{batch.academicYear}</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          ['Students', formatNumber(batch.totalStudents)],
          ['Sections', formatNumber(batch.sections.length)],
          ['Completed', formatNumber(batch.completed)],
          ['Transferred', formatNumber(batch.transferred)],
          ['Batch average', batch.averagePercentage !== null ? `${batch.averagePercentage}%` : '—'],
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
            <Info label="Class teacher">{batch.facultyName}</Info>
            <Info label="Academic year">{batch.academicYear}</Info>
            <Info label="Started">{batch.startedOn ? formatDate(batch.startedOn) : '—'}</Info>
            <Info label="Passed out">{batch.completedOn ? formatDate(batch.completedOn) : '—'}</Info>
            <Info label="Withdrawn">{formatNumber(batch.withdrawn)}</Info>
          </CardBody>
        </Card>
      </ContentSection>

      {batch.sections.map((section) => (
        <ContentSection
          key={section.section}
          title={`Section ${section.section}`}
          description={`${formatNumber(section.studentCount)} ${section.studentCount === 1 ? 'student' : 'students'} passed out from this section.`}
        >
          <Card className="overflow-hidden">
            <DataTable
              caption={`Section ${section.section} leaving roster`}
              columns={studentColumns}
              rows={section.students}
              rowKey={(row) => row.id}
              density="compact"
              renderMobileCard={(row) => (
                <Link to={`/management/archive/students/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{row.name}</p>
                    <Badge tone={OUTCOME_TONE[row.outcome] ?? 'neutral'}>{OUTCOME_LABEL[row.outcome] ?? row.outcome}</Badge>
                  </div>
                  <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.group}</p>
                  {row.boardExam && <p className="mt-0.5 text-caption text-[var(--text-subtle)]">{row.boardExam.percentage}% · {row.boardExam.grade}</p>}
                </Link>
              )}
            />
          </Card>
        </ContentSection>
      ))}
    </>
  );
}
