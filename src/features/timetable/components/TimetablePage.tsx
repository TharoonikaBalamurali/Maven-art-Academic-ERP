import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatTimeRange } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import { Badge, Card, EmptyState, QueryBoundary, Select, Skeleton } from '@/shared/ui';
import { useTimetable, useTimetableOptions } from '../hooks/useTimetable';
import { WEEKDAYS, WEEKDAY_LABEL, type TimetableSlot, type Weekday } from '../types';

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
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {WEEKDAYS.map((day) => (
              <DayColumn key={day} day={day} slots={byDay[day]} />
            ))}
          </div>
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
