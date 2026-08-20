import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* -------------------------------------------------------------------------- */
/* StatTile — an icon KPI card                                                */
/* -------------------------------------------------------------------------- */

type IconTone = 'accent' | 'success' | 'warning' | 'info';

const TONE_BG: Record<IconTone, string> = {
  accent: 'bg-[var(--accent-surface)] text-[var(--accent)]',
  success: 'bg-[var(--success-surface)] text-[var(--success)]',
  warning: 'bg-[var(--warning-surface)] text-[var(--warning)]',
  info: 'bg-[var(--info-surface)] text-[var(--info)]',
};

/**
 * A headline metric with a tinted icon. The visual anchor of the Admin/Finance
 * dashboards; value is backend-provided and shown verbatim.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  sub,
  to,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tone?: IconTone;
  sub?: string;
  to?: string;
}) {
  const body = (
    <div className="surface-card flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface-hover)]">
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-surface', TONE_BG[tone])}>
        <Icon className="size-6" aria-hidden={true} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-body-sm text-[var(--text-muted)]">{label}</p>
        <p className="text-metric font-semibold tabular-nums text-[var(--text)]">{value}</p>
        {sub && <p className="truncate text-caption text-[var(--text-subtle)]">{sub}</p>}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block rounded-surface focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
      {body}
    </Link>
  ) : (
    body
  );
}

/* -------------------------------------------------------------------------- */
/* BarTrendChart — grouped bars over a time axis                              */
/* -------------------------------------------------------------------------- */

export interface BarSeries {
  key: string;
  label: string;
  /** A CSS colour, e.g. `var(--chart-1)`. Fills the mark only. */
  color: string;
}

export interface BarDatum {
  label: string;
  values: Record<string, number>;
}

/** Rounds only the top corners so a thin bar reads as anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  if (h <= 0) return '';
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/**
 * A grouped bar chart (§ dataviz). One y-axis; thin marks with rounded tops and
 * a 2px gap between adjacent bars; recessive grid; a legend for the ≥2 series; a
 * hover tooltip per group; and an sr-only table so identity is never colour-only.
 */
export function BarTrendChart({
  series,
  data,
  formatValue = (v) => String(v),
  height = 240,
  caption,
}: {
  series: readonly BarSeries[];
  data: readonly BarDatum[];
  formatValue?: (v: number) => string;
  height?: number;
  caption: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(() => {
    const m = Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));
    // Round the axis top up to a clean number.
    const pow = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / pow) * pow;
  }, [data, series]);

  const W = 640;
  const padL = 44;
  const padR = 8;
  const padT = 8;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = height - padT - padB;
  const groupW = plotW / Math.max(1, data.length);
  const barGap = 2;
  const innerPad = groupW * 0.24;
  const bandW = groupW - innerPad;
  const barW = Math.max(3, (bandW - barGap * (series.length - 1)) / series.length);

  const ticks = [0, 0.5, 1].map((t) => ({ t, y: padT + plotH - t * plotH, value: Math.round(max * t) }));
  const hovered = hover !== null ? data[hover] : null;

  return (
    <figure className="m-0">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={caption}>
          {/* Y grid + labels */}
          {ticks.map((tk) => (
            <g key={tk.t}>
              <line x1={padL} x2={W - padR} y1={tk.y} y2={tk.y} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={padL - 8} y={tk.y + 4} textAnchor="end" className="fill-[var(--text-subtle)]" style={{ fontSize: 10 }}>
                {formatValue(tk.value)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const gx = padL + i * groupW + innerPad / 2;
            const active = hover === i;
            return (
              <g
                key={d.label}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              >
                {/* hover band */}
                <rect x={padL + i * groupW} y={padT} width={groupW} height={plotH} fill={active ? 'var(--surface-hover)' : 'transparent'} />
                {series.map((s, j) => {
                  const v = d.values[s.key] ?? 0;
                  const h = (v / max) * plotH;
                  const x = gx + j * (barW + barGap);
                  const y = padT + plotH - h;
                  return (
                    <path
                      key={s.key}
                      d={barPath(x, y, barW, h, 3)}
                      fill={s.color}
                      tabIndex={0}
                      role="img"
                      aria-label={`${d.label}, ${s.label}: ${formatValue(v)}`}
                    >
                      <title>{`${d.label} · ${s.label}: ${formatValue(v)}`}</title>
                    </path>
                  );
                })}
                <text x={padL + i * groupW + groupW / 2} y={height - 8} textAnchor="middle" className="fill-[var(--text-subtle)]" style={{ fontSize: 10 }}>
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hovered && (
          <div
            className="pointer-events-none absolute top-1 z-10 rounded-control border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1.5 text-body-sm shadow-overlay"
            style={{ left: `${(padL / W) * 100}%` }}
          >
            <p className="mb-0.5 font-medium text-[var(--text)]">{hovered.label}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                {s.label}: <span className="tabular-nums font-medium text-[var(--text)]">{formatValue(hovered.values[s.key] ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-body-sm text-[var(--text-muted)]">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </figcaption>

      {/* Screen-reader table — identity never colour-only. */}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              {series.map((s) => (
                <td key={s.key}>{formatValue(d.values[s.key] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* RingGauge — concentric percentage rings                                    */
/* -------------------------------------------------------------------------- */

export interface RingDatum {
  label: string;
  /** 0–100, backend-computed. */
  percent: number;
  color: string;
}

/** Two concentric arcs (e.g. student vs faculty attendance), with a value legend. */
export function RingGauge({ rings, center }: { rings: readonly RingDatum[]; center?: ReactNode }) {
  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 12;
  const gap = 6;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
          {rings.map((r, i) => {
            const radius = cx - stroke / 2 - i * (stroke + gap);
            const circ = 2 * Math.PI * radius;
            const dash = (Math.min(100, Math.max(0, r.percent)) / 100) * circ;
            return (
              <g key={r.label}>
                <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ - dash}`}
                />
              </g>
            );
          })}
        </svg>
        {center && <div className="absolute inset-0 flex items-center justify-center">{center}</div>}
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
        {rings.map((r) => (
          <div key={r.label} className="text-center">
            <p className="flex items-center justify-center gap-1.5 text-caption text-[var(--text-muted)]">
              <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} aria-hidden="true" />
              {r.label}
            </p>
            <p className="text-body-lg font-semibold tabular-nums text-[var(--text)]">{r.percent}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MiniCalendar — a compact month grid                                        */
/* -------------------------------------------------------------------------- */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Month calendar: today highlighted, dots on days that carry an event. */
export function MiniCalendar({ eventDates = [] }: { eventDates?: readonly string[] }) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const events = useMemo(() => new Set(eventDates), [eventDates]);

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const days = new Date(view.year, view.month + 1, 0).getDate();
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="inline-flex size-7 items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="text-body-sm font-semibold text-[var(--text)]">{MONTHS[view.month]} {view.year}</p>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="inline-flex size-7 items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-caption font-semibold text-[var(--text-subtle)]">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} aria-hidden="true" />;
          const dIso = isoDate(view.year, view.month, day);
          const isToday = dIso === todayIso;
          const hasEvent = events.has(dIso);
          return (
            <div key={dIso} className="flex flex-col items-center">
              <span className={cn('inline-flex size-7 items-center justify-center rounded-full text-body-sm tabular-nums', isToday ? 'bg-[var(--accent)] font-semibold text-[var(--accent-contrast)]' : 'text-[var(--text)]')}>
                {day}
              </span>
              <span className={cn('mt-0.5 size-1 rounded-full', hasEvent && !isToday ? 'bg-[var(--accent)]' : 'bg-transparent')} aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
