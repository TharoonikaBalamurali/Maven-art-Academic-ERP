import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Card,
  CardBody,
  DataTable,
  EmptyState,
  QueryBoundary,
  Skeleton,
  type Column,
} from '@/shared/ui';
import { useCourse } from '../hooks/useCourses';
import type { CourseBatch } from '../types';

const batchColumns: readonly Column<CourseBatch>[] = [
  {
    id: 'name',
    header: 'Batch',
    cell: (row) => (
      <Link to={`/management/batches/${row.id}`} className="font-medium text-[var(--accent)] hover:underline">
        {row.name}
      </Link>
    ),
  },
  { id: 'faculty', header: 'Faculty', hideBelowMd: true, cell: (row) => row.faculty },
  { id: 'section', header: 'Section', width: '6rem', hideBelowMd: true, cell: (row) => row.section },
  { id: 'students', header: 'Students', align: 'right', width: '8rem', cell: (row) => row.studentCount },
  {
    id: 'active',
    header: 'Status',
    width: '7rem',
    cell: (row) => <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Inactive'}</Badge>,
  },
];

/** Course detail (§19). A course *has* batches; they stay a related collection. */
export function CourseDetailPage() {
  const { courseId = '' } = useParams();
  const query = useCourse(courseId);

  return (
    <>
      <Link
        to="/management/courses"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to courses
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
              description={`Programme code ${query.data.code}`}
              meta={<Badge tone="accent">{query.data.code}</Badge>}
            />

            <Card className="mb-4">
              <CardBody className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Batches</p>
                  <p className="mt-0.5 text-metric font-semibold tabular-nums text-[var(--text)]">{query.data.batchCount}</p>
                </div>
                <div>
                  <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Students</p>
                  <p className="mt-0.5 text-metric font-semibold tabular-nums text-[var(--text)]">{query.data.studentCount}</p>
                </div>
              </CardBody>
            </Card>

            <ContentSection title="Batches">
              <Card className="overflow-hidden">
                {query.data.batches.length === 0 ? (
                  <EmptyState title="No batches" description="This course has no batches yet." />
                ) : (
                  <DataTable
                    caption={`Batches in ${query.data.name}`}
                    columns={batchColumns}
                    rows={query.data.batches}
                    rowKey={(row) => row.id}
                    density="compact"
                  />
                )}
              </Card>
            </ContentSection>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
