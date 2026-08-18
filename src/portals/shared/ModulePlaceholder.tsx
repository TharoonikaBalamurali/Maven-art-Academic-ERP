import { Construction } from 'lucide-react';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody } from '@/shared/ui';
import type { PermissionKey } from '@/shared/types';
import {
  MODULE_STATUS_LABEL,
  MODULE_STATUS_TONE,
  type ModuleStatus,
} from './module-status';

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return <Badge tone={MODULE_STATUS_TONE[status]}>{MODULE_STATUS_LABEL[status]}</Badge>;
}

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  /** Permission the route guard is enforcing — shown so it can be verified. */
  permission?: PermissionKey;
  /** Which specification phase delivers this module (§43). */
  phase: string;
}

/**
 * Placeholder for a module this phase deliberately does not implement.
 *
 * These exist so the routing, guard and navigation architecture can be
 * verified against the full module list from §3.1 and §37 without building any
 * business functionality. Each is replaced by its real module in the phase
 * named below.
 */
export function ModulePlaceholder({
  title,
  description,
  permission,
  phase,
}: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={<ModuleStatusBadge status="placeholder" />}
      />

      <Card>
        <CardBody className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-control bg-[var(--warning-surface)] text-[var(--warning)]"
          >
            <Construction className="size-4" />
          </span>
          <div className="flex flex-col gap-1 text-body">
            <p className="font-medium text-[var(--text)]">Not implemented yet</p>
            <p className="text-[var(--text-muted)]">
              This module is scheduled for <strong className="text-[var(--text)]">{phase}</strong>.
              The route, permission guard and navigation entry are already in place, so delivering
              it means replacing this page — not changing the architecture.
            </p>
            {permission && (
              <p className="mt-1 text-body-sm text-[var(--text-subtle)]">
                Route permission:{' '}
                <code className="rounded-control bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-caption">
                  {permission}
                </code>
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </>
  );
}
