import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * A compact month calendar for the portal dashboard.
 *
 * Presentational only — it highlights today and marks days that carry an
 * upcoming activity (dates supplied by the backend overview). It performs no
 * scheduling logic; it just lays out the current month.
 */
export function PortalCalendar({ activityDates = [] }: { activityDates?: readonly string[] }) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const activitySet = useMemo(() => new Set(activityDates), [activityDates]);

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="inline-flex size-8 items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="text-body font-semibold text-[var(--text)]">
          {MONTHS[view.month]} {view.year}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="inline-flex size-8 items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-caption font-semibold text-[var(--text-subtle)]">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} aria-hidden="true" />;
          const dayIso = iso(view.year, view.month, day);
          const isToday = dayIso === todayIso;
          const hasActivity = activitySet.has(dayIso);
          return (
            <div key={dayIso} className="flex flex-col items-center">
              <span
                className={[
                  'inline-flex size-8 items-center justify-center rounded-full text-body-sm tabular-nums',
                  isToday
                    ? 'bg-[var(--accent)] font-semibold text-[var(--accent-contrast)]'
                    : 'text-[var(--text)]',
                ].join(' ')}
              >
                {day}
              </span>
              <span
                className={`mt-0.5 size-1 rounded-full ${hasActivity && !isToday ? 'bg-[var(--accent)]' : 'bg-transparent'}`}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
