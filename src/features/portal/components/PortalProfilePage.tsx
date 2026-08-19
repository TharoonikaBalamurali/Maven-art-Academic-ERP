import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { usePortalProfile } from '../hooks/usePortal';
import type { PortalProfile } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Portal profile (§7) — the authenticated student's own record, read-only.
 * The backend scopes this to the caller; changes go through the institution.
 */
export function PortalProfilePage() {
  const query = usePortalProfile();
  return (
    <QueryBoundary
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-40 w-full" /></CardBody></Card>}
    >
      {query.data && <ProfileView profile={query.data} />}
    </QueryBoundary>
  );
}

function ProfileView({ profile }: { profile: PortalProfile }) {
  return (
    <>
      <PageHeader title={profile.name} description={`${profile.course} · ${profile.batch}`} meta={<Badge tone="neutral">{profile.registerNo}</Badge>} />
      <ContentSection title="Personal">
        <Card><CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Email">{profile.email}</Info>
          <Info label="Phone">{profile.phone}</Info>
          <Info label="Date of birth">{profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '—'}</Info>
          <Info label="Address">{profile.address}</Info>
        </CardBody></Card>
      </ContentSection>
      <ContentSection title="Academic">
        <Card><CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Register number">{profile.registerNo}</Info>
          <Info label="Course">{profile.course}</Info>
          <Info label="Batch">{profile.batch}</Info>
          <Info label="Admitted on">{profile.admittedOn ? formatDate(profile.admittedOn) : '—'}</Info>
        </CardBody></Card>
      </ContentSection>
      <ContentSection title="Guardian">
        <Card><CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Name">{profile.guardianName}</Info>
          <Info label="Phone">{profile.guardianPhone}</Info>
        </CardBody></Card>
      </ContentSection>
      <p className="mt-4 text-body-sm text-[var(--text-subtle)]">To correct any detail, please contact the institution office.</p>
    </>
  );
}
