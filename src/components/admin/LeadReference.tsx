/**
 * The lead's reference number — "L-001042".
 *
 * One component so the same number looks the same on the list, the board, the
 * lead screen and both payment views. An agent matching what a customer read
 * out over the phone should not have to work out whether two differently
 * styled strings are the same thing.
 *
 * Distinct from the quote reference ("Q-8F3A21"), which identifies one quote
 * out of the several a single lead can carry. Where both appear, label them —
 * see the payment detail screen.
 */

'use client';

export function LeadReference({
  reference,
  className = '',
  size = 'sm',
}: {
  reference: string;
  className?: string;
  /** 'md' for the top of a detail screen; 'sm' everywhere else. */
  size?: 'sm' | 'md';
}) {
  return (
    <span
      title={`Lead reference ${reference}`}
      className={`inline-flex items-center rounded-md border border-slate-200 bg-slate-50 font-mono font-medium tabular-nums text-slate-700 ${
        size === 'md' ? 'px-2 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'
      } ${className}`}
    >
      {reference}
    </span>
  );
}

export default LeadReference;
