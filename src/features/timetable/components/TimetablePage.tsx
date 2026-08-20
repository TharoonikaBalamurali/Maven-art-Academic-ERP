import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, List, Columns3 } from 'lucide-react';
import { formatTimeRange } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import { Badge, Card, EmptyState, QueryBoundary, Select, Skeleton } from '@/shared/ui';
import { useTimetable, useTimetableOptions } from '../hooks/useTimetable';
import { WEEKDAYS, WEEKDAY_LABEL, type TimetableSlot, type Weekday } from '../types';

type TimetableView = 'week' | 'day' | 'agenda';

const VIEWS: { value: TimetableView; label: string; icon: typeof CalendarDays }[] = [
  { value: 'week', label: 'Week', icon: Columns3 },
  { value: 'day', label: 'Day', icon: CalendarDays },
  { value: 'agenda', label: 'Agenda', icon: List },
];

/** Segmented control for the calendar view. */
function ViewSwitcher({ view, onChange }: { view: TimetableView; onChange: (v: TimetableView) => void }) {
  return (
    <div role="group" aria-label="Calendar view" className="inline-flex rounded-control border border-[var(--border)] bg-[var(--surface-sunken)] p-0.5">
      {VIEWS.map((v) => {
        const Icon = v.icon;
        const active = view === v.value;
        return (
          <button
            key={v.value}
            type="button"
            onClick={() => onChange(v.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-3 text-body-sm font-medium transition-colors',
              active
                ? 'bg-[var(--surface-raised)] text-[var(--text)] shadow-raised'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Timetable (§20).
 *
 * A published weekly schedule laid out as day columns of class cards. Filters
 * for batch, faculty and room are the Batch / Faculty / Room views the
 * specification lists, applied server-side. The frontend only positions the
 * slots the backend returns — it never computes the schedule.
 */
export function TimetablePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = {
    batchId: searchParams.get('batchId') ?? undefined,
    facultyId: searchParams.get('facultyId') ?? undefined,
    room: searchParams.get('room') ?? undefined,
  };

  const viewParam = searchParams.get('view');
  const view: TimetableView = viewParam === 'day' || viewParam === 'agenda' ? viewParam : 'week';
  const [dayIndex, setDayIndex] = useState(() => {
    // Start on today when it is a teaching day, otherwise Monday.
    const idx = new Date().getDay() - 1;
    return idx >= 0 && idx < WEEKDAYS.length ? idx : 0;
  });

  const timetable = useTimetable(query);
  const options = useTimetableOptions();

  const byDay = useMemo(() => groupByDay(timetable.data ?? []), [timetable.data]);
  const activeFilters = [query.batchId, query.facultyId, query.room].filter(Boolean).length;

  function setFilter(key: 'batchId' | 'facultyId' | 'room', value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  function setView(next: TimetableView) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === 'week') params.delete('view');
        else params.set('view', next);
        return params;
      },
      { replace: true },
    );
  }

  function clearAll() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  const batchOptions = (options.data?.batches ?? []).map((b) => ({ value: b.id, label: b.name }));
  const facultyOptions = (options.data?.faculty ?? []).map((f) => ({ value: f.id, label: f.name }));
  const roomOptions = (options.data?.rooms ?? []).map((r) => ({ value: r, label: r }));

  return (
    <>
      <PageHeader
        title="Timetable"
        description="The published weekly schedule. Filter by batch, faculty or room."
        actions={<ViewSwitcher view={view} onChange={setView} />}
      />

      <Card className="mb-4 overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Select
            label="Batch"
            placeholder="All batches"
            containerClassName="sm:w-52"
            options={batchOptions}
            value={query.batchId ?? ''}
            onChange={(event) => setFilter('batchId', event.target.value)}
          />
          <Select
            label="Faculty"
            placeholder="All faculty"
            containerClassName="sm:w-48"
            options={facultyOptions}
            value={query.facultyId ?? ''}
            onChange={(event) => setFilter('facultyId', event.target.value)}
          />
          <Select
            label="Room"
            placeholder="All rooms"
            containerClassName="sm:w-40"
            options={roomOptions}
            value={query.room ?? ''}
            onChange={(event) => setFilter('room', event.target.value)}
          />
        </FilterBar>
      </Card>

      <QueryBoundary
        isPending={timetable.isPending}
        isError={timetable.isError}
        error={timetable.error}
        onRetry={() => void timetable.refetch()}
        loadingFallback={<WeekSkeleton />}
      >
        {(timetable.data ?? []).length === 0 ? (
          <Card>
            <EmptyState
              title="No classes scheduled"
              description={
                activeFilters > 0
                  ? 'No classes match the selected filters.'
                  : 'The weekly schedule is empty.'
              }
            />
          </Card>
        ) : view === 'week' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {WEEKDAYS.map((day) => (
              <DayColumn key={day} day={day} slots={byDay[day]} />
            ))}
          </div>
        ) : view === 'day' ? (
          <DayView
            day={WEEKDAYS[dayIndex] ?? 'Mon'}
            slots={byDay[WEEKDAYS[dayIndex] ?? 'Mon']}
            onPrev={() => setDayIndex((i) => Math.max(0, i - 1))}
            onNext={() => setDayIndex((i) => Math.min(WEEKDAYS.length - 1, i + 1))}
            canPrev={dayIndex > 0}
            canNext={dayIndex < WEEKDAYS.length - 1}
          />
        ) : (
          <AgendaView byDay={byDay} />
        )}
      </QueryBoundary>
    </>
  );
}

function groupByDay(slots: readonly TimetableSlot[]): Record<Weekday, TimetableSlot[]> {
  const grouped = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] } as Record<Weekday, TimetableSlot[]>;
  for (const slot of slots) grouped[slot.day]?.push(slot);
  for (const day of WEEKDAYS) grouped[day].sort((a, b) => a.start.localeCompare(b.start));
  return grouped;
}

function DayColumn({ day, slots }: { day: Weekday; slots: TimetableSlot[] }) {
  return (
    <section className="flex flex-col gap-2" aria-label={WEEKDAY_LABEL[day]}>
      <h2 className="sticky top-14 z-10 rounded-control bg-[var(--surface-sunken)] px-3 py-1.5 text-body-sm font-semibold text-[var(--text)]">
        {WEEKDAY_LABEL[day]}
        <span className="ml-1 font-normal text-[var(--text-subtle)]">({slots.length})</span>
      </h2>
      {slots.length === 0 ? (
        <p className="px-3 py-4 text-body-sm text-[var(--text-subtle)]">No classes</p>
      ) : (
        slots.map((slot) => <SlotCard key={slot.id} slot={slot} />)
      )}
    </section>
  );
}

/**
 * Day view — one teaching day at a time, ordered by start time, with a time
 * gutter so the sequence of the day reads at a glance.
 */
function DayView({
  day,
  slots,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  day: Weekday;
  slots: TimetableSlot[];
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous day"
          className="inline-flex size-9 items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="text-title font-semibold text-[var(--text)]">
          {WEEKDAY_LABEL[day]}
          <span className="ml-2 text-body-sm font-normal text-[var(--text-subtle)]">
            {slots.length} {slots.length === 1 ? 'class' : 'classes'}
          </span>
        </p>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next day"
          className="inline-flex size-9 items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      {slots.length === 0 ? (
        <p className="px-5 py-10 text-center text-body text-[var(--text-muted)]">No classes scheduled on {WEEKDAY_LABEL[day]}.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {slots.map((slot) => (
            <li key={slot.id} className="flex gap-4 px-5 py-4">
              <div className="w-28 shrink-0 border-r border-[var(--border)] pr-4">
                <p className="text-body-sm font-medium tabular-nums text-[var(--text)]">{slot.start}</p>
                <p className="text-caption tabular-nums text-[var(--text-subtle)]">{slot.end}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-[var(--text)]">{slot.subject}</p>
                <p className="mt-0.5 text-body-sm text-[var(--text-muted)]">{slot.faculty}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone="accent">{slot.batch}</Badge>
                  <Badge tone="neutral">{slot.room}</Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Agenda view — the whole week as one chronological list, grouped by day. The
 * densest way to scan or print a schedule.
 */
function AgendaView({ byDay }: { byDay: Record<Weekday, TimetableSlot[]> }) {
  return (
    <Card className="overflow-hidden">
      <ul>
        {WEEKDAYS.map((day) => {
          const slots = byDay[day];
          return (
            <li key={day}>
              <p className="sticky top-16 z-10 border-y border-[var(--border)] bg-[var(--surface-sunken)] px-5 py-2 text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                {WEEKDAY_LABEL[day]}
                <span className="ml-2 font-normal text-[var(--text-subtle)]">({slots.length})</span>
              </p>
              {slots.length === 0 ? (
                <p className="px-5 py-3 text-body-sm text-[var(--text-subtle)]">No classes</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {slots.map((slot) => (
                    <li key={slot.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                      <span className="w-32 shrink-0 text-body-sm tabular-nums text-[var(--text-muted)]">
                        {formatTimeRange(slot.start, slot.end)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-body font-medium text-[var(--text)]">{slot.subject}</span>
                      <span className="truncate text-body-sm text-[var(--text-muted)]">{slot.faculty}</span>
                      <Badge tone="accent">{slot.batch}</Badge>
                      <Badge tone="neutral">{slot.room}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function SlotCard({ slot }: { slot: TimetableSlot }) {
  return (
    <article
      className={cn(
        'surface-card flex flex-col gap-1 border-l-2 p-3',
        'border-l-[var(--accent)]',
      )}
    >
      <p className="text-body font-medium text-[var(--text)]">{slot.subject}</p>
      <p className="text-body-sm text-[var(--text-muted)]">{formatTimeRange(slot.start, slot.end)}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Badge tone="accent">{slot.batch}</Badge>
        <Badge tone="neutral">{slot.room}</Badge>
      </div>
      <p className="mt-0.5 text-caption text-[var(--text-subtle)]">{slot.faculty}</p>
    </article>
  );
}

function WeekSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {WEEKDAYS.map((day) => (
        <div key={day} className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}
