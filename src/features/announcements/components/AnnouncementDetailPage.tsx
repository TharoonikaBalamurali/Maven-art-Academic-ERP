import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useAnnouncement } from '../hooks/useAnnouncements';
import { announcementStatusTone } from '../status';
import { ANNOUNCEMENT_AUDIENCE_LABEL, ANNOUNCEMENT_STATUS_LABEL, type AnnouncementDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children || '—'}</p>
    </div>
  );
}

/** Announcement detail (§ communication). */
export function AnnouncementDetailPage() {
  const { announcementId = '' } = useParams();
  const query = useAnnouncement(announcementId);

  return (
    <>
      <Link to="/management/announcements" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to announcements
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-64" /><Skeleton className="h-32 w-full" /></CardBody></Card>}
      >
        {query.data && <AnnouncementView record={query.data} />}
      </QueryBoundary>
    </>
  );
}

function AnnouncementView({ record }: { record: AnnouncementDetail }) {
  return (
    <>
      <PageHeader
        title={record.title}
        description={`By ${record.author}`}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={announcementStatusTone(record.status)}>{ANNOUNCEMENT_STATUS_LABEL[record.status] ?? record.status}</Badge>
            <Badge tone="neutral">{ANNOUNCEMENT_AUDIENCE_LABEL[record.audience] ?? record.audience}</Badge>
          </span>
        }
      />

      <ContentSection title="Message">
        <Card>
          <CardBody className="text-body whitespace-pre-line text-[var(--text)]">{record.body}</CardBody>
        </Card>
      </ContentSection>

      <ContentSection title="Delivery">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info label="Audience">{ANNOUNCEMENT_AUDIENCE_LABEL[record.audience] ?? record.audience}</Info>
            <Info label="Published">{record.publishedAt ? formatDate(record.publishedAt) : '—'}</Info>
            <Info label="Scheduled for">{record.scheduledFor ? formatDate(record.scheduledFor) : '—'}</Info>
            <Info label="Recipients">{record.recipients !== null ? formatNumber(record.recipients) : 'Pending delivery'}</Info>
            <Info label="Author">{record.author}</Info>
          </CardBody>
        </Card>
      </ContentSection>

      <p className="text-body-sm text-[var(--text-subtle)]">
        Audience resolution and delivery are handled by the backend.
      </p>
    </>
  );
}
