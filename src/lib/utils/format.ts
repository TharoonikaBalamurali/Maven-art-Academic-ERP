/**
 * Display formatting helpers.
 *
 * Centralised so currency, dates and numbers read identically across every ERP
 * screen. Locale/currency are defaults for now; when the backend or a settings
 * module exposes institution locale they become parameters here — one place.
 *
 * TBD — BACKEND CONTRACT: currency (INR) and locale are assumptions until the
 * institution settings endpoint exists.
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** "9:00 AM – 10:30 AM" from two 24h "HH:MM" strings. */
export function formatTimeRange(start: string, end: string): string {
  const to12h = (hhmm: string): string => {
    const [h, m] = hhmm.split(':').map(Number);
    if (h === undefined || m === undefined) return hhmm;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };
  return `${to12h(start)} – ${to12h(end)}`;
}
