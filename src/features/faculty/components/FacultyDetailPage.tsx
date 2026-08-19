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
import { useFacultyMember } from '../hooks/useFaculty';
import type { FacultyBatch } from '../types';

const batchColumns: readonly Column<FacultyBatch>[] = [
  {
    id: 'name',
    header: 'Batch',
    cell: (row) => (
      <Link to={`/management/batches/${row.id}`} className="font-medium text-[var(--accent)] hover:underline">
        {row.name}
      </Link>
    ),
  },
  { id: 'course', header: 'Course', hideBelowMd: true, cell: (row) => row.course },
  { id: 'students', header: 'Students', align: 'right', width: '8rem', cell: (row) => row.studentCount },
];

/** Faculty detail (§6). Assigned batches and subjects as related collections. */
export function FacultyDetailPage() {
  const { facultyId = '' } = useParams();
  const query = useFacultyMember(facultyId);

  return (
    <>
      <Link
        to="/management/faculty"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to faculty
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
            <PageHeader title={query.data.name} description={query.data.email} />

            <Card className="mb-4">
              <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Batches</p>
                  <p className="mt-0.5 text-metric font-semibold tabular-nums text-[var(--text)]">{query.data.batchCount}</p>
                </div>
                <div>
                  <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Students</p>
                  <p className="mt-0.5 text-metric font-semibold tabular-nums text-[var(--text)]">{query.data.studentCount}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Subjects</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {query.data.subjects.length > 0 ? (
                      query.data.subjects.map((subject) => (
                        <Badge key={subject} tone="accent">
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-body-sm text-[var(--text-subtle)]">None recorded</span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            <ContentSection title="Assigned batches">
              <Card className="overflow-hidden">
                {query.data.batches.length === 0 ? (
                  <EmptyState title="No batches assigned" description="This faculty member has no batches yet." />
                ) : (
                  <DataTable
                    caption={`Batches taught by ${query.data.name}`}
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
