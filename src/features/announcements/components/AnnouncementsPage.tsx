import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Megaphone, Plus } from 'lucide-react';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDate } from '@/lib/utils/format';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  Modal,
  NoResultsState,
  Pagination,
  QueryBoundary,
  Select,
  TableSkeleton,
  toast,
  type Column,
} from '@/shared/ui';
import { useAnnouncements, useCreateAnnouncement } from '../hooks/useAnnouncements';
import { announcementStatusTone } from '../status';
import {
  ANNOUNCEMENT_AUDIENCE_LABEL,
  ANNOUNCEMENT_STATUS_LABEL,
  type AnnouncementAudience,
  type AnnouncementListItem,
} from '../types';

const FILTER_KEYS = ['status', 'audience'] as const;
const STATUS_OPTIONS = Object.entries(ANNOUNCEMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const AUDIENCE_OPTIONS = Object.entries(ANNOUNCEMENT_AUDIENCE_LABEL).map(([value, label]) => ({ value, label }));

const columns: readonly Column<AnnouncementListItem>[] = [
  { id: 'title', header: 'Announcement', cell: (row) => <span className="font-medium">{row.title}</span> },
  { id: 'audience', header: 'Audience', width: '9rem', cell: (row) => <Badge tone="neutral">{ANNOUNCEMENT_AUDIENCE_LABEL[row.audience] ?? row.audience}</Badge> },
  { id: 'author', header: 'Author', hideBelowMd: true, cell: (row) => row.author },
  { id: 'status', header: 'Status', width: '9rem', cell: (row) => <Badge tone={announcementStatusTone(row.status)}>{ANNOUNCEMENT_STATUS_LABEL[row.status] ?? row.status}</Badge> },
  {
    id: 'date',
    header: 'Date',
    sortable: true,
    align: 'right',
    width: '10rem',
    cell: (row) => (row.date ? <time dateTime={row.date}>{formatDate(row.date)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
];

/** Announcements (§ communication). */
export function AnnouncementsPage() {
  const [composing, setComposing] = useState(false);
  const list = useListQueryState({ defaultLimit: 10, defaultSortBy: 'date', defaultSortDir: 'desc', filterKeys: FILTER_KEYS });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useAnnouncements(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters =
    (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0) + (list.query.filters?.audience ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Institutional communication. Delivery to each audience is handled by the backend."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
        actions={
          <PermissionGuard permission="announcements.create">
            <Button onClick={() => setComposing(true)}>
              <Plus className="size-4" aria-hidden="true" />
              New announcement
            </Button>
          </PermissionGuard>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input label="Search" type="search" placeholder="Title" containerClassName="sm:w-64" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
          <Select label="Status" placeholder="All statuses" containerClassName="sm:w-40" options={STATUS_OPTIONS} value={list.query.filters?.status?.toString() ?? ''} onChange={(e) => list.setFilter('status', e.target.value)} />
          <Select label="Audience" placeholder="All audiences" containerClassName="sm:w-40" options={AUDIENCE_OPTIONS} value={list.query.filters?.audience?.toString() ?? ''} onChange={(e) => list.setFilter('audience', e.target.value)} />
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={<div className="p-3"><TableSkeleton rows={4} columns={5} /></div>}
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? <NoResultsState onClear={clearAll} /> : <EmptyState title="No announcements" description="Published and scheduled announcements appear here." />
          ) : (
            <>
              <DataTable
                caption="Announcements"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/announcements/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link to={`/management/announcements/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.title}</p>
                      <Badge tone={announcementStatusTone(row.status)}>{ANNOUNCEMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">
                      {ANNOUNCEMENT_AUDIENCE_LABEL[row.audience] ?? row.audience} · {row.author}
                    </p>
                  </Link>
                )}
              />
              {query.data && (
                <div className="border-t border-[var(--border)] p-3">
                  <Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} limit={query.data.limit} onPageChange={list.setPage} />
                </div>
              )}
            </>
          )}
        </QueryBoundary>
      </Card>

      {composing && <ComposeDialog onClose={() => setComposing(false)} />}
    </>
  );
}

function ComposeDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const create = useCreateAnnouncement();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [scheduledFor, setScheduledFor] = useState('');

  const valid = title.trim().length > 0 && body.trim().length > 0;

  async function submit() {
    if (!valid) return;
    try {
      const created = await create.mutateAsync({ title, body, audience, scheduledFor: scheduledFor || undefined });
      toast.success(scheduledFor ? 'Announcement scheduled' : 'Announcement published', created.title);
      onClose();
      navigate(`/management/announcements/${created.id}`);
    } catch {
      toast.error('Could not save', 'Check the details and try again.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New announcement"
      description="The backend delivers this to the selected audience."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={create.isPending} disabled={!valid} onClick={() => void submit()}>
            {scheduledFor ? 'Schedule' : 'Publish'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
        <div>
          <label htmlFor="ann-body" className="mb-1.5 block text-body font-medium">
            Message <span className="text-[var(--danger)]">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <textarea
            id="ann-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)] px-3.5 py-2 text-body text-[var(--text)]"
          />
        </div>
        <Select label="Audience" options={AUDIENCE_OPTIONS} value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)} />
        <Input label="Schedule for" type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} description="Leave empty to publish immediately." />
        <p className="inline-flex items-center gap-1.5 text-caption text-[var(--text-subtle)]">
          <Megaphone className="size-3.5" aria-hidden="true" />
          Recipients are resolved by the backend when it delivers.
        </p>
      </div>
    </Modal>
  );
}
