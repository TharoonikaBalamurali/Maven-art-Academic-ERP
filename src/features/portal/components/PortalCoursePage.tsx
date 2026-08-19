import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { usePortalCourse } from '../hooks/usePortal';
import type { PortalCourse } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p><p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p></div>;
}

/** Portal course (§7) — the caller's own course and batch. */
export function PortalCoursePage() {
  const query = usePortalCourse();
  return (
    <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-32 w-full" /></CardBody></Card>}>
      {query.data && <CourseView course={query.data} />}
    </QueryBoundary>
  );
}

function CourseView({ course }: { course: PortalCourse }) {
  return (
    <>
      <PageHeader title={course.course} description={course.batch} meta={<Badge tone="neutral">{course.code}</Badge>} />
      <Card className="mb-4"><CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Info label="Batch">{course.batch}</Info>
        <Info label="Class teacher">{course.facultyName}</Info>
        <Info label="Started">{course.startedOn ? formatDate(course.startedOn) : '—'}</Info>
      </CardBody></Card>
      <ContentSection title="Subjects">
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {course.subjects.map((s) => (
              <li key={s.name} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-[var(--text)]">{s.name}</span>
                <span className="text-body-sm text-[var(--text-muted)]">{s.faculty}</span>
              </li>
            ))}
          </ul>
        </Card>
      </ContentSection>
    </>
  );
}
