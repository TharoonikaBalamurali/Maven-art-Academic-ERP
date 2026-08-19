import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useSettings } from '../hooks/useSettings';
import type { Settings } from '../types';

/** Institution settings (§ administration) — read-only; editing needs settings.update. */
export function SettingsPage() {
  const query = useSettings();
  return (
    <QueryBoundary
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-40 w-full" /></CardBody></Card>}
    >
      {query.data && <SettingsView settings={query.data} />}
    </QueryBoundary>
  );
}

function SettingsView({ settings }: { settings: Settings }) {
  return (
    <>
      <PageHeader
        title="Settings"
        description={settings.updatedAt ? `Institution configuration · last updated ${formatDate(settings.updatedAt)}` : 'Institution configuration'}
      />
      <div className="flex flex-col gap-4">
        {settings.sections.map((section) => (
          <ContentSection key={section.title} title={section.title} description={section.description ?? undefined}>
            <Card>
              <dl className="divide-y divide-[var(--border)]">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-body-sm text-[var(--text-muted)]">{item.label}</dt>
                    <dd className="text-body font-medium text-[var(--text)] text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </ContentSection>
        ))}
      </div>
      <p className="mt-4 text-body-sm text-[var(--text-subtle)]">These values are configured by the backend; editing requires the settings.update permission.</p>
    </>
  );
}
