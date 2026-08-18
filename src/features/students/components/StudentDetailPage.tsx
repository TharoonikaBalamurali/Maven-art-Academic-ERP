import { type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import {
  Badge,
  buttonClasses,
  Card,
  CardBody,
  QueryBoundary,
  Tabs,
  type BadgeTone,
  type TabDefinition,
} from '@/shared/ui';
import { Skeleton } from '@/shared/ui';
import { useStudent } from '../hooks/useStudents';
import { STUDENT_STATUS_LABEL, type StudentDetail } from '../types';

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  on_leave: 'warning',
  graduated: 'neutral',
};

const FEE_TONE: Record<string, BadgeTone> = { paid: 'success', partial: 'warning', overdue: 'danger' };

/** A label/value description list — the standard record-field layout. */
function DetailList({ items }: { items: readonly [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            {label}
          </dt>
          <dd className="mt-0.5 text-body break-words text-[var(--text)]">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A cross-module summary tab: a few backend figures plus a link to the module. */
function SummaryTab({
  children,
  moduleLabel,
  to,
  can,
}: {
  children: ReactNode;
  moduleLabel: string;
  to: string;
  can: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {children}
      <PermissionGuard permission={can}>
        <Link to={to} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
          Open {moduleLabel}
        </Link>
      </PermissionGuard>
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: ReactNode; tone?: 'danger' }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-metric font-semibold tabular-nums ${
          tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function buildTabs(student: StudentDetail): TabDefinition[] {
  const { personal, academic, parents, enrollment, summary } = student;

  return [
    {
      id: 'personal',
      label: 'Personal',
      content: (
        <DetailList
          items={[
            ['Full name', student.name],
            ['Date of birth', formatDate(personal.dateOfBirth)],
            ['Email', personal.email],
            ['Phone', personal.phone],
            ['Blood group', personal.bloodGroup],
            ['Admission date', formatDate(personal.admissionDate)],
            ['Address', personal.address],
          ]}
        />
      ),
    },
    {
      id: 'academic',
      label: 'Academic',
      content: (
        <DetailList
          items={[
            ['Course', `${academic.courseCode} — ${academic.course}`],
            ['Batch', academic.batch],
            ['Section', academic.section],
            ['Year', academic.year],
            ['Enrollment status', academic.enrollmentStatus],
          ]}
        />
      ),
    },
    {
      id: 'parents',
      label: 'Parents',
      content:
        parents.length === 0 ? (
          <p className="text-body text-[var(--text-muted)]">No parent records linked.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {parents.map((parent) => (
              <div key={parent.id} className="rounded-control border border-[var(--border)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{parent.name}</p>
                  <Badge tone="neutral">{parent.relation}</Badge>
                </div>
                <DetailList items={[['Phone', parent.phone], ['Email', parent.email]]} />
              </div>
            ))}
          </div>
        ),
    },
    {
      id: 'enrollment',
      label: 'Enrollment',
      content: (
        <DetailList
          items={[
            ['Course', enrollment.course],
            ['Batch', enrollment.batch],
            ['Status', enrollment.status],
            ['Start date', formatDate(enrollment.startDate)],
            ['End date', enrollment.endDate ? formatDate(enrollment.endDate) : 'Ongoing'],
          ]}
        />
      ),
    },
    {
      id: 'attendance',
      label: 'Attendance',
      content: (
        <SummaryTab moduleLabel="attendance" to="/management/attendance" can="attendance.view">
          <div className="flex flex-wrap gap-8">
            <Figure
              label="Attendance"
              value={formatPercent(summary.attendance.percent)}
              tone={summary.attendance.percent < 75 ? 'danger' : undefined}
            />
            <Figure
              label="Sessions attended"
              value={`${summary.attendance.present}/${summary.attendance.total}`}
            />
          </div>
          {summary.attendance.percent < 75 && (
            <p className="text-body-sm text-[var(--danger)]">Below the 75% attendance requirement.</p>
          )}
        </SummaryTab>
      ),
    },
    {
      id: 'fees',
      label: 'Fees',
      content: (
        <SummaryTab moduleLabel="fee record" to="/management/payments" can="payments.view">
          <div className="flex flex-wrap items-start gap-8">
            <Figure label="Total fees" value={formatCurrency(summary.fees.total)} />
            <Figure label="Paid" value={formatCurrency(summary.fees.paid)} />
            <Figure
              label="Pending"
              value={formatCurrency(summary.fees.pending)}
              tone={summary.fees.pending > 0 ? 'danger' : undefined}
            />
            <div>
              <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Status
              </p>
              <p className="mt-2">
                <Badge tone={FEE_TONE[summary.fees.status] ?? 'neutral'}>
                  {summary.fees.status[0]?.toUpperCase()}
                  {summary.fees.status.slice(1)}
                </Badge>
              </p>
            </div>
          </div>
          <p className="text-body-sm text-[var(--text-muted)]">
            Balances are provided by the finance system; this is a summary.
          </p>
        </SummaryTab>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      content: (
        <SummaryTab moduleLabel="progress" to="/management/progress" can="progress.view">
          {summary.progress ? (
            <div className="flex flex-wrap gap-8">
              <Figure label="Latest assessment" value={summary.progress.lastSubject} />
              <Figure label="Grade" value={summary.progress.grade} />
            </div>
          ) : (
            <p className="text-body text-[var(--text-muted)]">No assessments recorded yet.</p>
          )}
        </SummaryTab>
      ),
    },
    {
      id: 'certificates',
      label: 'Certificates',
      content: (
        <SummaryTab moduleLabel="certificates" to="/management/certificates" can="certificates.view">
          <Figure label="Certificates issued" value={summary.certificates.count} />
          {summary.certificates.count === 0 && (
            <p className="text-body text-[var(--text-muted)]">No certificates issued yet.</p>
          )}
        </SummaryTab>
      ),
    },
  ];
}

function DetailSkeleton() {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * Student details (§14.1) — the record view, and the reusable detail-page
 * pattern: fetch one entity by route param, render an identity header and a
 * deep-linkable tab set. The student's own fields (personal, academic, parent,
 * enrollment) are shown in full; the cross-module tabs show backend rollup
 * summaries with a link to the full module, so this page does not reimplement
 * Attendance, Fees, Progress or Certificates.
 */
export function StudentDetailPage() {
  const { studentId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useStudent(studentId);

  const tabs = query.data ? buildTabs(query.data) : [];
  const requestedTab = searchParams.get('tab') ?? 'personal';
  const activeTab = tabs.some((t) => t.id === requestedTab) ? requestedTab : 'personal';

  function selectTab(id: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id === 'personal') next.delete('tab');
        else next.set('tab', id);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <>
      <Link
        to="/management/students"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to students
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<DetailSkeleton />}
      >
        {query.data && (
          <>
            <PageHeader
              title={query.data.name}
              description={`${query.data.registerNo} · ${query.data.courseCode} · ${query.data.batch} · Section ${query.data.section}`}
              meta={
                <Badge tone={STATUS_TONE[query.data.status] ?? 'neutral'}>
                  {STUDENT_STATUS_LABEL[query.data.status] ?? query.data.status}
                </Badge>
              }
              actions={
                <PermissionGuard permission="students.update">
                  <Link
                    to={`/management/students/${query.data.id}/edit`}
                    className={buttonClasses({ variant: 'secondary' })}
                  >
                    Edit
                  </Link>
                </PermissionGuard>
              }
            />

            <Card>
              <CardBody>
                <Tabs
                  label="Student record"
                  tabs={tabs}
                  activeId={activeTab}
                  onChange={selectTab}
                />
              </CardBody>
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
