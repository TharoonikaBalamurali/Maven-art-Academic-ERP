import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/shared/layout/page';
import { Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useStudent } from '../hooks/useStudents';
import type { StudentDetail } from '../types';
import { StudentForm, type StudentFormValues } from './StudentForm';

const EMPTY_STUDENT: StudentFormValues = {
  name: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  email: '',
  phone: '',
  alternatePhone: '',
  rollNo: '',
  admissionNo: '',
  address: { line1: '', line2: '', area: '', city: '', district: '', state: '', country: 'India', postalCode: '' },
  courseId: '',
  batchId: '',
  section: '',
  status: 'active',
  medical: { foodAllergies: '', otherAllergies: '', accessibility: '', emergencyContact: '', notes: '' },
  previousInstitution: { name: '', lastClass: '', tcNumber: '', tcDate: '', boardOrUniversity: '', yearOfLeaving: '', reasonForLeaving: '' },
};

/**
 * Create / edit a student (§14.1).
 *
 * One form serves both: create starts empty, edit prefills from the record.
 * The form exercises the shared form system end to end — `useApiForm` +
 * `FormSection`/`FormActions`, client-side shape validation for fast feedback,
 * and server-side 422 field errors mapped back onto the inputs (§30).
 */
function toFormValues(detail: StudentDetail): StudentFormValues {
  return {
    name: detail.name,
    gender: detail.personal.gender,
    dateOfBirth: detail.personal.dateOfBirth,
    bloodGroup: detail.personal.bloodGroup,
    email: detail.personal.email,
    phone: detail.personal.phone,
    alternatePhone: detail.personal.alternatePhone,
    rollNo: detail.rollNo,
    admissionNo: detail.admissionNo,
    address: { ...detail.personal.address },
    courseId: detail.courseId,
    batchId: detail.batchId,
    section: detail.section,
    status: detail.status,
    medical: { ...detail.medical },
    previousInstitution: { ...detail.previousInstitution },
  };
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function StudentCreatePage() {
  return (
    <>
      <BackLink to="/management/students" label="Back to students" />
      <PageHeader title="New student" description="Create a student record." />
      <Card>
        <CardBody>
          <StudentForm mode="create" initialValues={EMPTY_STUDENT} />
        </CardBody>
      </Card>
    </>
  );
}

export function StudentEditPage() {
  const { studentId = '' } = useParams();
  const query = useStudent(studentId);

  return (
    <>
      <BackLink to={`/management/students/${studentId}`} label="Back to student" />
      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={
          <Card>
            <CardBody className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardBody>
          </Card>
        }
      >
        {query.data && (
          <>
            <PageHeader
              title={`Edit ${query.data.name}`}
              description={`${query.data.registerNo} · update the student record.`}
            />
            <Card>
              <CardBody>
                <StudentForm
                  mode="edit"
                  studentId={studentId}
                  initialValues={toFormValues(query.data)}
                />
              </CardBody>
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
