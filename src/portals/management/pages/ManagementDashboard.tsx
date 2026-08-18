import { useCurrentIdentity, usePermissions } from '@/features/auth/hooks';
import { PageHeader } from '@/shared/layout/PageHeader';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { Badge, Button, Card, CardBody, CardHeader } from '@/shared/ui';

/**
 * Management dashboard placeholder.
 *
 * Day 1 scope explicitly excludes real dashboard widgets (§13 belongs to
 * Phase 2). What is here instead is a verification surface: it shows the
 * identity, role and permission set the backend granted, which is how the
 * permission architecture is checked in a browser.
 */
export function ManagementDashboard() {
  const identity = useCurrentIdentity();
  const { permissionSet } = usePermissions();
  const permissions = [...permissionSet].sort();

  return (
    <>
      <PageHeader
        title={`Welcome, ${identity.profile.displayName}`}
        description="Role-specific dashboard widgets are delivered in Phase 2. This page currently verifies the session and permission foundation."
        actions={
          // Demonstrates permission-driven actions (§35). Admin sees it; Faculty does not.
          <PermissionGuard permission="students.create">
            <Button size="sm">New student</Button>
          </PermissionGuard>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Session" />
          <CardBody className="flex flex-col gap-1 text-sm">
            <p className="font-medium">{identity.profile.fullName}</p>
            <p className="text-[var(--text-muted)]">{identity.user.email}</p>
            <p className="mt-2">
              <Badge tone="accent">{identity.role}</Badge>
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Granted permissions"
            description="Returned by the backend and used to build navigation and route guards."
            actions={<Badge>{permissions.length}</Badge>}
          />
          <CardBody>
            <ul className="flex flex-wrap gap-1.5">
              {permissions.map((permission) => (
                <li key={permission}>
                  <code className="rounded bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-xs">
                    {permission}
                  </code>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
