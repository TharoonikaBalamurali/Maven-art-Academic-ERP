import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useDisciplineCase } from '../hooks/useDiscipline';
import { disciplineSeverityTone, disciplineStatusTone } from '../status';
import { DISCIPLINE_SEVERITY_LABEL, DISCIPLINE_STATUS_LABEL, type DisciplineDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children || '—'}</p>
    </div>
  );
}

/** Discipline case detail (§ student affairs) — confidential. */
export function DisciplineDetailPage() {
  const { caseId = '' } = useParams();
  const query = useDisciplineCase(caseId);

  return (
    <>
      <Link to="/management/discipline" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to discipline
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-32 w-full" /></CardBody></Card>}
      >
        {query.data && <CaseView record={query.data} />}
      </QueryBoundary>
    </>
  );
}

function CaseView({ record }: { record: DisciplineDetail }) {
  return (
    <>
      <PageHeader
        title={record.incidentNo}
        description={`${record.student} · ${record.category}`}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={disciplineStatusTone(record.status)}>{DISCIPLINE_STATUS_LABEL[record.status] ?? record.status}</Badge>
            <Badge tone={disciplineSeverityTone(record.severity)}>{DISCIPLINE_SEVERITY_LABEL[record.severity] ?? record.severity} severity</Badge>
          </span>
        }
      />

      <p className="mb-4 inline-flex items-center gap-2 rounded-control border border-[var(--warning)] bg-[var(--warning-surface)] px-3 py-2 text-body-sm text-[var(--warning)]">
        <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
        Confidential record.
      </p>

      <ContentSection title="Incident">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info label="Student">
              <PermissionGuard
                permission="students.view"
                fallback={<span>{record.student}</span>}
              >
                <Link to={`/management/students/${record.studentId}`} className="text-[var(--accent)] hover:underline">
                  {record.student}
                </Link>
              </PermissionGuard>
            </Info>
            <Info label="Register no.">{record.registerNo}</Info>
            <Info label="Category">{record.category}</Info>
            <Info label="Date">{formatDate(record.date)}</Info>
            <Info label="Time">{record.time}</Info>
            <Info label="Location">{record.location}</Info>
            <Info label="Reported by">{record.reportedBy}</Info>
          </CardBody>
        </Card>
      </ContentSection>

      <ContentSection title="Description">
        <Card><CardBody className="text-body text-[var(--text)]">{record.description}</CardBody></Card>
      </ContentSection>

      <ContentSection title="Action & resolution">
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label="Action taken">{record.actionTaken}</Info>
            <Info label="Resolution">{record.resolution}</Info>
            <Info label="Follow-up date">{record.followUpDate ? formatDate(record.followUpDate) : '—'}</Info>
            <Info label="Remarks">{record.remarks}</Info>
          </CardBody>
        </Card>
      </ContentSection>
    </>
  );
}
