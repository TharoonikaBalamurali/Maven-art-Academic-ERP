import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardBody } from '@/shared/ui';
import type { PermissionKey } from '@/shared/types';

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  /** Permission the route guard is enforcing — shown for verification. */
  permission?: PermissionKey;
  /** Which specification phase delivers this module (§43). */
  phase: string;
}

/**
 * Placeholder for a module that Day 1 deliberately does not implement.
 *
 * These exist so the routing, guard and navigation architecture can be verified
 * against the full module list from §3.1 and §37 without building any business
 * functionality. Each is replaced by its real module in the phase named below.
 */
export function ModulePlaceholder({
  title,
  description,
  permission,
  phase,
}: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardBody className="flex flex-col gap-2 text-sm">
          <p className="text-[var(--text-muted)]">
            This module is scheduled for <strong className="text-[var(--text)]">{phase}</strong>. The
            route, permission guard and navigation entry are already in place.
          </p>
          {permission && (
            <p className="text-xs text-[var(--text-muted)]">
              Route permission: <code className="font-mono">{permission}</code>
            </p>
          )}
        </CardBody>
      </Card>
    </>
  );
}
