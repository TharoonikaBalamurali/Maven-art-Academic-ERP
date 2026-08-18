import { useCurrentIdentity } from '@/features/auth/hooks';
import { PageHeader } from '@/shared/layout/page';
import { Badge, QueryBoundary } from '@/shared/ui';
import { DashboardGridSkeleton } from './DashboardSkeleton';
import { DemoDataNotice } from './DemoDataNotice';
import { useDashboardSummary } from '../hooks/useDashboard';
import { AdminDashboard } from './AdminDashboard';
import { AccountsDashboard } from './AccountsDashboard';
import { FacultyDashboard } from './FacultyDashboard';

const AUTHORITY_META: Record<string, { label: string; description: string }> = {
  admin: {
    label: 'Administrator',
    description: 'Operational overview of the academy — admissions, attendance and finance at a glance.',
  },
  accounts: {
    label: 'Accounts',
    description: 'Collections, outstanding balances and the day’s financial activity.',
  },
  faculty: {
    label: 'Faculty',
    description: 'Your classes, batches and attendance for today.',
  },
};

/**
 * Management dashboard entry (§13).
 *
 * The role selects which purpose-built dashboard renders — Admin operational,
 * Accounts financial, Faculty academic — and the backend returns the matching
 * payload, which this component narrows on `authority`. This is the legitimate
 * use of the role (choosing an experience, like portal selection); every widget
 * inside is still permission-gated.
 */
export function ManagementDashboard() {
  const identity = useCurrentIdentity();
  const query = useDashboardSummary();
  const meta = AUTHORITY_META[identity.role];

  return (
    <>
      <PageHeader
        title={`Welcome, ${identity.profile.displayName}`}
        description={meta?.description}
        meta={meta && <Badge tone="accent">{meta.label}</Badge>}
      />

      <DemoDataNotice />

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<DashboardGridSkeleton />}
      >
        {query.data?.authority === 'admin' && <AdminDashboard data={query.data} />}
        {query.data?.authority === 'accounts' && <AccountsDashboard data={query.data} />}
        {query.data?.authority === 'faculty' && <FacultyDashboard data={query.data} />}
      </QueryBoundary>
    </>
  );
}
