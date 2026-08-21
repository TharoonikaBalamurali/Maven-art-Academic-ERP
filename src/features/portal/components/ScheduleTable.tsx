import { cn } from '@/lib/utils/cn';
import { Badge } from '@/shared/ui';
import type { PortalScheduleItem } from '../types';

const HEAD_CELL = 'px-3 py-2 text-left text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase';

/**
 * Today's classes as a table (§7).
 *
 * The dashboard rail and the timetable page read the same way: a time column
 * on the left, the class beside it. Rows carry the status the BACKEND assigned
 * to each session (`done` / `now` / `upcoming`) — the frontend never decides
 * which class is in progress from the clock.
 */
export function ScheduleTable({ items, className }: { items: PortalScheduleItem[]; className?: string }) {
  return (
    <div className={cn('-mx-4 overflow-x-auto', className)}>
      <table className="w-full border-collapse text-body-sm">
        <caption className="sr-only">Today&rsquo;s class schedule</caption>
        <thead>
          <tr className="border-y border-[var(--border)] bg-[var(--surface-sunken)]">
            <th scope="col" className={cn(HEAD_CELL, 'w-28')}>Time</th>
            <th scope="col" className={HEAD_CELL}>Class</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={cn(
                'border-b border-[var(--border)] last:border-0',
                item.status === 'now' && 'bg-[var(--accent-surface)]',
              )}
            >
              <td className={cn('px-3 py-2.5 align-top tabular-nums', item.status === 'done' ? 'text-[var(--text-subtle)]' : 'text-[var(--text-muted)]')}>
                {item.time}
              </td>
              <td className="px-3 py-2.5 align-top">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', item.status === 'done' ? 'text-[var(--text-muted)]' : 'text-[var(--text)]')}>
                    {item.subject}
                  </span>
                  {item.status === 'now' && <Badge tone="accent">Now</Badge>}
                </div>
                <p className="mt-0.5 truncate text-caption text-[var(--text-subtle)]">{item.room}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
