/**
 * Build and send a quote from the lead detail screen.
 *
 * Sending a quote is what moves a lead to **Quote Sent** — the stage isn't a
 * separate click, so the funnel can never claim a quote went out when no
 * customer ever got a link.
 */

'use client';

import { useMemo, useState } from 'react';

import { formatDate, formatPeso } from '@/lib/format';
import {
  QUOTE_TYPES,
  QUOTE_TYPE_LABELS,
  type QuoteRecord,
  type QuoteType,
} from '@/models/quote.schema';

interface DraftLine {
  label: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_LINE: DraftLine = { label: '', description: '', quantity: '1', unitPrice: '' };

const STATUS_TONES: Record<string, string> = {
  sent: 'bg-sky-100 text-sky-700',
  viewed: 'bg-violet-100 text-violet-700',
  accepted: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-slate-200 text-slate-600',
};

interface QuoteBuilderProps {
  quotes: QuoteRecord[];
  defaultLabel: string;
  busy?: boolean;
  onSend: (payload: {
    lineItems: { label: string; description?: string; quantity: number; unitPrice: number }[];
    discount?: number;
    quoteType: QuoteType;
    notes?: string;
    validForDays: number;
    supersedeOpen: boolean;
  }) => Promise<void>;
}

export function QuoteBuilder({ quotes, defaultLabel, busy, onSend }: QuoteBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>([{ ...EMPTY_LINE, label: defaultLabel }]);
  const [discount, setDiscount] = useState('');
  const [quoteType, setQuoteType] = useState<QuoteType>('full_payment');
  const [notes, setNotes] = useState('');
  const [validForDays, setValidForDays] = useState('7');
  /** False = this quote sits alongside the open one (a split payment). */
  const [supersedeOpen, setSupersedeOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Only quotes the customer can still act on are at risk of being replaced —
  // so the replace/add choice is only worth showing when one exists.
  const openQuotes = useMemo(
    () => quotes.filter((quote) => (quote.status === 'sent' || quote.status === 'viewed') && !quote.isExpired),
    [quotes]
  );

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      const quantity = Number.parseFloat(line.quantity) || 0;
      const unitPrice = Number.parseFloat(line.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
    const off = Math.min(Number.parseFloat(discount) || 0, subtotal);
    return { subtotal, discount: off, total: subtotal - off };
  }, [lines, discount]);

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((current) =>
      current.map((line, position) => (position === index ? { ...line, ...patch } : line))
    );
  };

  const submit = async () => {
    setError(null);

    const lineItems = lines
      .filter((line) => line.label.trim() && Number.parseFloat(line.unitPrice) >= 0)
      .map((line) => ({
        label: line.label.trim(),
        description: line.description.trim() || undefined,
        quantity: Number.parseFloat(line.quantity) || 1,
        unitPrice: Number.parseFloat(line.unitPrice) || 0,
      }));

    if (lineItems.length === 0) {
      setError('Add at least one line with a label and a price.');
      return;
    }
    if (totals.total <= 0) {
      setError('The total must be more than zero.');
      return;
    }

    await onSend({
      lineItems,
      discount: totals.discount > 0 ? totals.discount : undefined,
      quoteType,
      notes: notes.trim() || undefined,
      validForDays: Number.parseInt(validForDays, 10) || 7,
      supersedeOpen,
    });

    setLines([{ ...EMPTY_LINE, label: defaultLabel }]);
    setDiscount('');
    setQuoteType('full_payment');
    setNotes('');
    setSupersedeOpen(true);
    setIsOpen(false);
  };

  const copyLink = async (quote: QuoteRecord) => {
    try {
      await navigator.clipboard.writeText(quote.url);
      setCopiedToken(quote.token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      // Clipboard can be blocked; the link is visible on screen anyway.
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing quotes */}
      {quotes.length > 0 && (
        <ul className="space-y-2">
          {quotes.map((quote) => (
            <li key={quote.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{quote.reference}</span>
                    <span className="font-semibold text-slate-900">{formatPeso(quote.total)}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${
                        STATUS_TONES[quote.status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {quote.status}
                    </span>
                    {quote.quoteType === 'partial_payment' && (
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        {QUOTE_TYPE_LABELS.partial_payment}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Valid until {formatDate(quote.validUntil)}
                    {quote.viewedAt && ' · opened by customer'}
                    {quote.paymentMethod && ` · paying via ${quote.paymentMethod}`}
                    {quote.paymentReference && ` · ref ${quote.paymentReference}`}
                  </p>
                  {quote.declineReason && (
                    <p className="mt-1 text-xs text-red-600">Declined: {quote.declineReason}</p>
                  )}
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyLink(quote)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <i className={`pi ${copiedToken === quote.token ? 'pi-check' : 'pi-copy'} mr-1 text-[10px]`} />
                    {copiedToken === quote.token ? 'Copied' : 'Copy link'}
                  </button>
                  <a
                    href={quote.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <i className="pi pi-external-link mr-1 text-[10px]" />
                    Preview
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={busy}
          className="w-full rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-dark disabled:opacity-40"
        >
          <i className="pi pi-file-edit mr-1.5 text-xs" />
          {quotes.length > 0 ? 'Send a new quote' : 'Build a quote'}
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          {lines.map((line, index) => (
            <div key={index} className="space-y-2 rounded-lg bg-slate-50 p-2.5">
              <div className="flex gap-2">
                <input
                  value={line.label}
                  onChange={(event) => updateLine(index, { label: event.target.value })}
                  placeholder="Van rental — 3 days"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove line"
                    onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                    className="rounded-lg px-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                )}
              </div>

              <input
                value={line.description}
                onChange={(event) => updateLine(index, { description: event.target.value })}
                placeholder="Optional detail the customer will see"
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
              />

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  Qty
                  <input
                    type="number"
                    min="0.01"
                    step="1"
                    value={line.quantity}
                    onChange={(event) => updateLine(index, { quantity: event.target.value })}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-1 items-center gap-1.5 text-xs text-slate-500">
                  ₱ each
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={line.unitPrice}
                    onChange={(event) => updateLine(index, { unitPrice: event.target.value })}
                    placeholder="3500"
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <span className="w-24 text-right text-sm font-medium text-slate-700">
                  {formatPeso(
                    (Number.parseFloat(line.quantity) || 0) * (Number.parseFloat(line.unitPrice) || 0)
                  )}
                </span>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setLines((current) => [...current, { ...EMPTY_LINE }])}
            className="text-xs font-medium text-coral hover:text-coral-dark"
          >
            + Add another line
          </button>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
            <label className="text-xs text-slate-500">
              Discount ₱
              <input
                type="number"
                min="0"
                step="100"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500">
              Quote type
              <select
                value={quoteType}
                onChange={(event) => setQuoteType(event.target.value as QuoteType)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
              >
                {QUOTE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {QUOTE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="-mt-1 text-[11px] text-slate-400">
            {quoteType === 'partial_payment'
              ? 'One instalment of this booking — the customer will be billed the rest separately.'
              : 'Settles the whole booking in one payment.'}
          </p>

          {openQuotes.length > 0 && (
            <fieldset className="rounded-lg border border-slate-200 p-2.5">
              <legend className="px-1 text-xs font-medium text-slate-600">
                There {openQuotes.length === 1 ? 'is' : 'are'} {openQuotes.length} quote
                {openQuotes.length === 1 ? '' : 's'} still awaiting payment
              </legend>

              <label className="flex cursor-pointer items-start gap-2 py-1">
                <input
                  type="radio"
                  name="supersedeOpen"
                  checked={supersedeOpen}
                  onChange={() => setSupersedeOpen(true)}
                  className="mt-0.5"
                />
                <span className="text-xs text-slate-600">
                  <strong className="text-slate-800">Replace it</strong> — a corrected price. The
                  old link stops working.
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2 py-1">
                <input
                  type="radio"
                  name="supersedeOpen"
                  checked={!supersedeOpen}
                  onChange={() => setSupersedeOpen(false)}
                  className="mt-0.5"
                />
                <span className="text-xs text-slate-600">
                  <strong className="text-slate-800">Add a payment</strong> — another instalment
                  alongside it. Both links stay live and the deal value is the sum.
                </span>
              </label>
            </fieldset>
          )}

          <label className="block text-xs text-slate-500">
            Valid for (days)
            <input
              type="number"
              min="1"
              max="90"
              value={validForDays}
              onChange={(event) => setValidForDays(event.target.value)}
              className="mt-1 w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
            />
          </label>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Notes the customer will see — inclusions, pickup point, terms…"
            className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm"
          />

          <div className="rounded-lg bg-slate-900 px-3 py-2.5 text-sm text-white">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>{formatPeso(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Discount</span>
                <span>− {formatPeso(totals.discount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-slate-700 pt-1.5 font-bold">
              <span>Total</span>
              <span>{formatPeso(totals.total)}</span>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="flex-1 rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-dark disabled:opacity-40"
            >
              <i className="pi pi-send mr-1.5 text-xs" />
              {openQuotes.length > 0 && !supersedeOpen ? 'Send payment request' : 'Send quote'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Sending moves this lead to <strong>Quote Sent</strong> and starts the follow-up
            automation.
          </p>
        </div>
      )}
    </div>
  );
}

export default QuoteBuilder;
