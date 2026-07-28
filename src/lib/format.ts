/**
 * Display formatting shared by the admin portal. Client-safe (no server imports).
 */

const DATE_FORMATTER = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const PESO_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMATTER.format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATETIME_FORMATTER.format(date);
}

export function formatPeso(value: string | number | null | undefined): string {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return PESO_FORMATTER.format(0);
  return PESO_FORMATTER.format(amount);
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

/** "3 days ago", "in 2 hours" — for due dates and next automation runs. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const [unit, ms] of units) {
    if (absMs >= ms) {
      return formatter.format(Math.round(diffMs / ms), unit);
    }
  }

  return 'just now';
}

/** Minutes → "1h 25m" for the speed-to-lead metric. */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours < 24) return rest ? `${hours}h ${rest}m` : `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
