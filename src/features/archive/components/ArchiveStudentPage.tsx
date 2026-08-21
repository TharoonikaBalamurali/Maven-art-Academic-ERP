import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton, type BadgeTone } from '@/shared/ui';
import { useArchivedStudent } from '../hooks/useArchive';
import type { ArchivedStudentDetail } from '../types';

const OUTCOME_TONE: Record<string, BadgeTone> = { completed: 'success', transferred: 'info', withdrawn: 'neutral' };
const OUTCOME_LABEL: Record<string, string> = { completed: 'Completed', transferred: 'Transferred', withdrawn: 'Withdrawn' };

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children || '—'}</p>
    </div>
  );
}

/**
 * A passed-out student's permanent leaving record (§ archive): identity, the
 * group studied, the board-examination result with per-subject marks, exit
 * remarks and the certificate issued. Every mark, percentage and grade is the
 * backend's authoritative result, shown verbatim.
 */
export function ArchiveStudentPage() {
  const { studentId = '' } = useParams();
  const query = useArchivedStudent(studentId);

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
        {query.data && <StudentView record={query.data} />}
      </QueryBoundary>
    </>
  );
}

function StudentView({ record }: { record: ArchivedStudentDetail }) {
  const exam = record.boardExam;

  return (
    <>
      <PageHeader
        title={record.name}
        description={`${record.group} · ${record.batch}`}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={OUTCOME_TONE[record.outcome] ?? 'neutral'}>{OUTCOME_LABEL[record.outcome] ?? record.outcome}</Badge>
            <Badge tone="neutral">{record.academicYear}</Badge>
          </span>
        }
      />

      {exam && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Board percentage', `${exam.percentage}%`],
            ['Grade', exam.grade],
            ['Result', exam.result],
            ['Exam year', exam.year],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardBody className="flex flex-col gap-1">
                <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
                <span className="text-metric font-semibold tabular-nums text-[var(--text)]">{value}</span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ContentSection title="Student record">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info label="Register number">{record.registerNo}</Info>
            <Info label="Admission number">{record.admissionNo}</Info>
            <Info label="Roll number">{record.rollNo}</Info>
            <Info label="Group studied">{record.group}</Info>
            <Info label="Section">{record.section}</Info>
            <Info label="Course">{record.course}</Info>
            <Info label="Batch">
              <Link to={`/management/archive/${record.batchId}`} className="text-[var(--accent)] hover:underline">
                {record.batch}
              </Link>
            </Info>
            <Info label="Left on">{formatDate(record.effectiveDate)}</Info>
            <Info label="TC number">{record.tcNumber}</Info>
            {record.destination && <Info label="Destination">{record.destination}</Info>}
          </CardBody>
        </Card>
      </ContentSection>

      <ContentSection title="Board examination" description={exam ? exam.examName : undefined}>
        <Card className="overflow-hidden">
          {exam ? (
            <table className="w-full text-body">
              <caption className="sr-only">{exam.examName} subject marks</caption>
              <thead>
                <tr className="border-b border-[var(--border)] text-caption text-[var(--text-muted)] uppercase">
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold tracking-wide">Subject</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold tracking-wide">Marks</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold tracking-wide">Grade</th>
                </tr>
              </thead>
              <tbody>
                {exam.subjects.map((s) => (
                  <tr key={s.subject} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--text)]">{s.subject}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--text)]">{s.marks} / {s.maxMarks}</td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--text)]">{s.grade}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Percentage and grade are the backend's result, not a client sum. */}
                <tr className="border-t border-[var(--border)] bg-[var(--surface-hover)]">
                  <th scope="row" className="px-4 py-3 text-left font-semibold text-[var(--text)]">Overall</th>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--text)]">{exam.percentage}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">{exam.grade}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <CardBody className="flex items-center gap-2 py-8 text-center text-body-sm text-[var(--text-subtle)]">
              <GraduationCap className="size-4" aria-hidden="true" />
              No board result — this student left before completing the course.
            </CardBody>
          )}
        </Card>
      </ContentSection>

      <ContentSection title="Remarks">
        <Card><CardBody className="text-body text-[var(--text)]">{record.remarks || 'No remarks recorded.'}</CardBody></Card>
      </ContentSection>
    </>
  );
}
