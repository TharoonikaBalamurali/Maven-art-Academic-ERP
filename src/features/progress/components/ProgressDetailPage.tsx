import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useProgress } from '../hooks/useProgress';
import { progressStatusTone } from '../status';
import { PROGRESS_STATUS_LABEL, type ProgressDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Academic progress detail (§26).
 *
 * Shows the captured score and the backend-computed grade and result. The
 * grade and result are displayed verbatim from the backend — the frontend never
 * derives a grade from score/maxScore or decides pass/fail (academic invariant).
 */
export function ProgressDetailPage() {
  const { progressId = '' } = useParams();
  const query = useProgress(progressId);

  return (
    <>
      <Link
        to="/management/progress"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to progress
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
              <Skeleton className="h-32 w-full" />
            </CardBody>
          </Card>
        }
      >
        {query.data && <ProgressDetailView progress={query.data} />}
      </QueryBoundary>
    </>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
      <span className={`tabular-nums ${emphasis ? 'text-metric font-semibold text-[var(--text)]' : 'text-body-lg text-[var(--text)]'}`}>{value}</span>
    </div>
  );
}

function ProgressDetailView({ progress }: { progress: ProgressDetail }) {
  const scoreText = progress.score === null ? '—' : `${progress.score} / ${progress.maxScore}`;

  return (
    <>
      <PageHeader
        title={progress.student}
        description={`${progress.assessment} · ${progress.course}`}
        meta={<Badge tone={progressStatusTone(progress.status)}>{PROGRESS_STATUS_LABEL[progress.status] ?? progress.status}</Badge>}
      />

      <Card className="mb-4">
        {/* Score is captured data; grade and result are backend-computed. */}
        <CardBody className="grid grid-cols-3 gap-4">
          <Metric label="Score" value={scoreText} />
          <Metric label="Grade" value={progress.grade ?? '—'} emphasis />
          <Metric label="Result" value={progress.result ?? '—'} />
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Course">{progress.course}</Info>
          <Info label="Batch">{progress.batch}</Info>
          <Info label="Assessment type">{progress.assessmentType}</Info>
          <Info label="Assessed on">{progress.assessedOn ? formatDate(progress.assessedOn) : '—'}</Info>
          <Info label="Faculty">{progress.faculty}</Info>
        </CardBody>
      </Card>

      {progress.remarks && (
        <ContentSection title="Remarks">
          <Card>
            <CardBody className="text-body">{progress.remarks}</CardBody>
          </Card>
        </ContentSection>
      )}
    </>
  );
}
