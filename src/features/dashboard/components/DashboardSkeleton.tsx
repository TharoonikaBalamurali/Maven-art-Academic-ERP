import { Card, CardBody, Skeleton } from '@/shared/ui';
import { DashboardGrid } from '@/shared/dashboard';

/**
 * Loading placeholder shaped like a dashboard: a KPI band over two wide panels.
 * Matching the eventual layout keeps the load transition calm instead of a
 * full-page spinner jumping to a dense grid.
 */
export function DashboardGridSkeleton() {
  return (
    <>
      <DashboardGrid className="mb-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardBody className="flex flex-col gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
            </CardBody>
          </Card>
        ))}
      </DashboardGrid>
      <DashboardGrid>
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i} className="sm:col-span-2">
            <CardBody className="flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 4 }, (_, r) => (
                <Skeleton key={r} className="h-6 w-full" />
              ))}
            </CardBody>
          </Card>
        ))}
      </DashboardGrid>
    </>
  );
}
