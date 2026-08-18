import { Link } from 'react-router-dom';
import { useCurrentIdentity } from '@/features/auth/hooks';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Badge, Card, CardBody, CardHeader } from '@/shared/ui';

/**
 * Student / Parent dashboard placeholder.
 *
 * Real widgets (§13) arrive in Phase 6. This verifies that the portal shell,
 * permission-driven sections and mobile layout work.
 */
export function StudentParentDashboard() {
  const identity = useCurrentIdentity();

  return (
    <>
      <PageHeader
        title={`Hello, ${identity.profile.displayName}`}
        description="Your dashboard is delivered in Phase 6. Navigation, permissions and layout are already active."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <CardBody className="flex flex-col gap-1 text-sm">
            <p className="font-medium">{identity.profile.fullName}</p>
            <p className="text-[var(--text-muted)]">{identity.user.email}</p>
            <p className="mt-2">
              <Badge tone="accent">{identity.role}</Badge>
            </p>
          </CardBody>
        </Card>

        {/* Parents only — the backend grants portal.children.view (§8, §37). */}
        <PermissionGuard permission="portal.children.view">
          <Card>
            <CardHeader title="My Children" description="Parent-only section." />
            <CardBody className="text-sm text-[var(--text-muted)]">
              <p>
                Student selection changes the contextual data shown across the portal. Delivered in
                Phase 6.
              </p>
              <Link to="/portal/children" className="mt-2 inline-block text-[var(--accent)] underline">
                Open My Children
              </Link>
            </CardBody>
          </Card>
        </PermissionGuard>
      </div>
    </>
  );
}
