import { useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Archive, ArrowLeft, ShieldAlert } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { usePermissions } from '@/features/auth/hooks';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import {
  Badge,
  buttonClasses,
  Card,
  CardBody,
  QueryBoundary,
  Skeleton,
  Tabs,
  type BadgeTone,
  type TabDefinition,
} from '@/shared/ui';
import { useStudent } from '../hooks/useStudents';
import { StudentPhoto } from './StudentPhoto';
import { CloseAdmissionDialog } from './CloseAdmissionDialog';
import {
  CLOSURE_TYPE_LABEL,
  GENDER_LABEL,
  isClosedStatus,
  STUDENT_STATUS_LABEL,
  type StudentDetail,
  type StudentParentLink,
} from '../types';

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  on_leave: 'warning',
  completed: 'info',
  transferred: 'info',
  withdrawn: 'neutral',
  graduated: 'neutral',
};

const FEE_TONE: Record<string, BadgeTone> = { paid: 'success', partial: 'warning', overdue: 'danger' };

/** A label/value description list — the standard record-field layout. */
function DetailList({ items }: { items: readonly [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</dt>
          <dd className="mt-0.5 text-body break-words text-[var(--text)]">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A titled block within a tab. */
function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-3 text-body font-semibold text-[var(--text)]">{title}</h3>
      {children}
    </section>
  );
}

function SummaryTab({ children, moduleLabel, to, can }: { children: ReactNode; moduleLabel: string; to: string; can: string }) {
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
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className={`mt-1 text-metric font-semibold tabular-nums ${tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text)]'}`}>
        {value}
      </p>
    </div>
  );
}

function ParentCard({ parent }: { parent: StudentParentLink }) {
  return (
    <div className="rounded-control border border-[var(--border)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--text)]">{parent.name}</p>
          <Badge tone="neutral">{parent.relation}</Badge>
          {parent.isEmergencyContact && <Badge tone="danger">Emergency contact</Badge>}
        </div>
        <PermissionGuard permission="parents.view">
          <Link
            to={parent.parentId ? `/management/parents/${parent.parentId}` : `/management/parents?search=${encodeURIComponent(parent.name)}`}
            className="text-body-sm font-medium text-[var(--accent)] hover:underline"
          >
            View parent record →
          </Link>
        </PermissionGuard>
      </div>
      <DetailList
        items={[
          ['Primary contact', parent.phone],
          ['Alternate contact', parent.alternatePhone],
          ['Email', parent.email],
          ['Occupation', parent.occupation],
          ['Guardian status', parent.guardianStatus],
          ['Professional address', parent.professionalAddress],
          ['Residential address', parent.residentialAddress],
        ]}
      />
    </div>
  );
}

function buildTabs(student: StudentDetail): TabDefinition[] {
  const { personal, academic, parents, siblings, medical, enrollment, summary } = student;
  const hasMedical =
    medical.foodAllergies || medical.otherAllergies || medical.accessibility || medical.emergencyContact || medical.notes;

  return [
    {
      id: 'biodata',
      label: 'Biodata',
      content: (
        <>
          <SubSection title="Identity">
            <DetailList
              items={[
                ['First name', personal.firstName],
                ['Middle name', personal.middleName],
                ['Last name', personal.lastName],
                ['Date of birth', formatDate(personal.dateOfBirth)],
                ['Age', personal.age !== null ? `${personal.age} years` : '—'],
                ['Gender', GENDER_LABEL[personal.gender] ?? personal.gender],
                ['Blood group', personal.bloodGroup],
              ]}
            />
          </SubSection>
          <SubSection title="Contact">
            <DetailList
              items={[
                ['Mobile number', personal.phone],
                ['Alternate contact', personal.alternatePhone],
                ['Email', personal.email],
              ]}
            />
          </SubSection>
          <SubSection title="Address">
            <DetailList
              items={[
                ['Address line 1', personal.address.line1],
                ['Address line 2', personal.address.line2],
                ['Area / locality', personal.address.area],
                ['City', personal.address.city],
                ['District', personal.address.district],
                ['State', personal.address.state],
                ['Country', personal.address.country],
                ['Postal code', personal.address.postalCode],
              ]}
            />
          </SubSection>
          {hasMedical && (
            <SubSection title="Health & special information">
              <div className="mb-3 flex items-center gap-2 text-body-sm text-[var(--text-muted)]">
                <ShieldAlert className="size-4 text-[var(--warning)]" aria-hidden="true" />
                Confidential — visible to authorized staff only.
              </div>
              <DetailList
                items={[
                  ['Food allergies', medical.foodAllergies],
                  ['Other allergies', medical.otherAllergies],
                  ['Accessibility / support', medical.accessibility],
                  ['Emergency contact', medical.emergencyContact],
                  ['Notes', medical.notes],
                ]}
              />
            </SubSection>
          )}
        </>
      ),
    },
    {
      id: 'admission',
      label: 'Admission',
      content: (
        <>
          <SubSection title="Identifiers">
            <DetailList
              items={[
                ['Student ID', student.id],
                ['Register number', student.registerNo],
                ['Admission number', student.admissionNo],
                ['Roll number', student.rollNo],
              ]}
            />
          </SubSection>
          <SubSection title="Admission details">
            <DetailList
              items={[
                ['Course / class', `${academic.courseCode} — ${academic.course}`],
                ['Section', academic.section],
                ['Batch', academic.batch],
                ['Academic year', academic.year],
                ['Date of admission', formatDate(personal.admissionDate)],
                ['Date of joining', formatDate(student.joiningDate)],
                ['Current status', STUDENT_STATUS_LABEL[student.status] ?? student.status],
                ['Enrollment status', academic.enrollmentStatus],
              ]}
            />
          </SubSection>
          <SubSection title="Previous institution">
            <DetailList
              items={[
                ['Institution', student.previousInstitution.name],
                ['Last class', student.previousInstitution.lastClass],
                ['Board / university', student.previousInstitution.boardOrUniversity],
                ['TC number', student.previousInstitution.tcNumber],
                ['TC date', student.previousInstitution.tcDate ? formatDate(student.previousInstitution.tcDate) : ''],
                ['Year of leaving', student.previousInstitution.yearOfLeaving],
                ['Reason for leaving', student.previousInstitution.reasonForLeaving],
              ]}
            />
          </SubSection>
          {student.closure && (
            <SubSection title="Admission closure">
              <DetailList
                items={[
                  ['Closure type', CLOSURE_TYPE_LABEL[student.closure.type] ?? student.closure.type],
                  ['Effective date', formatDate(student.closure.effectiveDate)],
                  ['Reason', student.closure.reason],
                  ['TC number issued', student.closure.tcNumber],
                  ['TC issued on', student.closure.tcIssuedOn ? formatDate(student.closure.tcIssuedOn) : ''],
                  ['Destination', student.closure.destination],
                  ['Clearance', student.closure.clearance],
                  ['Remarks', student.closure.remarks],
                  ['Closed by', student.closure.closedBy],
                  ['Closed on', formatDate(student.closure.closedOn)],
                ]}
              />
            </SubSection>
          )}
          <SubSection title="Enrollment">
            <DetailList
              items={[
                ['Course', enrollment.course],
                ['Batch', enrollment.batch],
                ['Status', enrollment.status],
                ['Start date', formatDate(enrollment.startDate)],
                ['End date', enrollment.endDate ? formatDate(enrollment.endDate) : 'Ongoing'],
              ]}
            />
          </SubSection>
        </>
      ),
    },
    {
      id: 'parents',
      label: 'Parent / Guardian',
      content:
        parents.length === 0 ? (
          <p className="text-body text-[var(--text-muted)]">No parent or guardian records linked.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {parents.map((parent) => (
              <ParentCard key={parent.id} parent={parent} />
            ))}
          </div>
        ),
    },
    {
      id: 'family',
      label: 'Family',
      content:
        siblings.length === 0 ? (
          <p className="text-body text-[var(--text-muted)]">No siblings or family members recorded.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {siblings.map((sib) => (
              <div key={sib.id} className="rounded-control border border-[var(--border)] p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--text)]">{sib.name}</p>
                  <Badge tone="neutral">{sib.relation}</Badge>
                </div>
                <DetailList
                  items={[
                    ['Date of birth', sib.dateOfBirth ? formatDate(sib.dateOfBirth) : '—'],
                    ['Institution', sib.institution],
                    ['Class', sib.className],
                  ]}
                />
              </div>
            ))}
          </div>
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
      id: 'attendance',
      label: 'Attendance',
      content: (
        <SummaryTab moduleLabel="attendance" to="/management/attendance" can="attendance.view">
          <div className="flex flex-wrap gap-8">
            <Figure label="Attendance" value={formatPercent(summary.attendance.percent)} tone={summary.attendance.percent < 75 ? 'danger' : undefined} />
            <Figure label="Sessions attended" value={`${summary.attendance.present}/${summary.attendance.total}`} />
          </div>
          {summary.attendance.percent < 75 && <p className="text-body-sm text-[var(--danger)]">Below the 75% attendance requirement.</p>}
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
            <Figure label="Pending" value={formatCurrency(summary.fees.pending)} tone={summary.fees.pending > 0 ? 'danger' : undefined} />
            <div>
              <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Status</p>
              <p className="mt-2">
                <Badge tone={FEE_TONE[summary.fees.status] ?? 'neutral'}>
                  {summary.fees.status[0]?.toUpperCase()}
                  {summary.fees.status.slice(1)}
                </Badge>
              </p>
            </div>
          </div>
          <p className="text-body-sm text-[var(--text-muted)]">Balances are provided by the finance system; this is a summary.</p>
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
          {summary.certificates.count === 0 && <p className="text-body text-[var(--text-muted)]">No certificates issued yet.</p>}
        </SummaryTab>
      ),
    },
  ];
}

/** Identity header: photo + name + key identifiers + status. */
function ProfileHeader({ student }: { student: StudentDetail }) {
  const { can } = usePermissions();
  const [closing, setClosing] = useState(false);
  const closed = isClosedStatus(student.status);
  return (
    <>
    {closed && student.closure && (
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-control border border-[var(--border-strong)] bg-[var(--surface-sunken)] px-4 py-3">
        <Archive className="size-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        <p className="text-body text-[var(--text)]">
          <span className="font-medium">Admission closed</span> — {CLOSURE_TYPE_LABEL[student.closure.type] ?? student.closure.type} on{' '}
          {formatDate(student.closure.effectiveDate)}. This record is read-only and preserved in the archive.
        </p>
        <PermissionGuard permission="batches.view">
          <Link to={`/management/archive/${student.batchId}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
            View in archive
          </Link>
        </PermissionGuard>
      </div>
    )}
    <Card className="mb-4">
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <StudentPhoto studentId={student.id} name={student.name} photoUrl={student.photoUrl} canEdit={can('students.update')} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-page font-semibold tracking-tight text-[var(--text)]">{student.name}</h1>
            <Badge tone={STATUS_TONE[student.status] ?? 'neutral'}>
              {STUDENT_STATUS_LABEL[student.status] ?? student.status}
            </Badge>
          </div>
          <p className="mt-1 text-body text-[var(--text-muted)]">
            {student.courseCode} · {student.batch} · Section {student.section}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            {[
              ['Student ID', student.id],
              ['Register no.', student.registerNo],
              ['Admission no.', student.admissionNo],
              ['Roll no.', student.rollNo],
              ['Course', student.course],
              ['Joined', formatDate(student.joiningDate)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</dt>
                <dd className="truncate text-body-sm text-[var(--text)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {!closed && (
            <PermissionGuard permission="students.update">
              <Link to={`/management/students/${student.id}/edit`} className={buttonClasses({ variant: 'secondary' })}>
                Edit
              </Link>
              <button type="button" onClick={() => setClosing(true)} className={buttonClasses({ variant: 'danger' })}>
                Close admission
              </button>
            </PermissionGuard>
          )}
        </div>
      </CardBody>
    </Card>
    {closing && (
      <CloseAdmissionDialog studentId={student.id} studentName={student.name} onClose={() => setClosing(false)} />
    )}
    </>
  );
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
 * Student 360° (§14.1, § biodata).
 *
 * A profile header (photo + identity + key identifiers) over a deep-linkable
 * tab set: Biodata, Admission, Parent/Guardian, Family, Academic, and the
 * cross-module rollup summaries (Attendance, Fees, Progress, Certificates). The
 * student's own record is shown in full; the rollups are backend summaries that
 * link to their module, so this page never reimplements those modules.
 */
export function StudentDetailPage() {
  const { studentId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useStudent(studentId);

  const tabs = query.data ? buildTabs(query.data) : [];
  const requestedTab = searchParams.get('tab') ?? 'biodata';
  const activeTab = tabs.some((t) => t.id === requestedTab) ? requestedTab : 'biodata';

  function selectTab(id: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id === 'biodata') next.delete('tab');
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
            <ProfileHeader student={query.data} />
            <Card>
              <CardBody>
                <Tabs label="Student record" tabs={tabs} activeId={activeTab} onChange={selectTab} />
              </CardBody>
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
