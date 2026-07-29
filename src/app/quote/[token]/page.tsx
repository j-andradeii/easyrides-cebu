/**
 * /quote/[token] — the customer's checkout page.
 *
 * Everything they need to say yes in one screen: what they're booking, what it
 * costs line by line, how long the price is held, how to pay (QR + account
 * details), and a single confirm button that turns the lead into a booking.
 *
 * No login. The token in the URL is the authentication, so the page must never
 * render anything the token doesn't entitle them to see.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { DownloadQRButton } from '@/components/ui/DownloadQRButton';
import { PAYMENT_METHODS, type PaymentMethod } from '@/data/payment-methods';
import { formatDate, formatPeso } from '@/lib/format';
import type { PublicQuote } from '@/models/quote.schema';

export default function QuoteCheckoutPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/quote/${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid');
        return (await response.json()) as PublicQuote;
      })
      .then((data) => {
        setQuote(data);
        if (data.status === 'accepted') setAccepted(true);
        if (data.status === 'declined') setDeclined(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [token]);

  const method: PaymentMethod | undefined = useMemo(
    () => PAYMENT_METHODS.find((item) => item.key === selectedMethod),
    [selectedMethod]
  );

  const accept = useCallback(async () => {
    if (!token || !selectedMethod) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/quote/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          paymentReference: reference.trim() || undefined,
        }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? 'Could not confirm your booking');

      setAccepted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not confirm your booking');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, selectedMethod, reference]);

  const decline = useCallback(async () => {
    if (!token) return;
    const reason = window.prompt('No problem — mind telling us why? (optional)');
    if (reason === null) return;

    setIsSubmitting(true);
    try {
      await fetch(`/api/quote/${encodeURIComponent(token)}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      setDeclined(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [token]);

  // --- Loading / invalid -----------------------------------------------------

  if (isLoading) {
    return (
      <Shell>
        <p className="text-center text-slate-500">
          <i className="pi pi-spin pi-spinner mr-2" /> Loading your quote…
        </p>
      </Shell>
    );
  }

  if (notFound || !quote) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900">This quote link isn&apos;t valid</h1>
        <p className="mt-2 text-slate-600">
          It may have been replaced by a newer one. Message us and we&apos;ll send your latest
          price.
        </p>
        <WhatsAppButton number="639178046988" />
      </Shell>
    );
  }

  const whatsapp = quote.businessWhatsApp;

  // --- Terminal states -------------------------------------------------------

  if (accepted) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <i className="pi pi-check text-2xl text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">You&apos;re booked! 🎉</h1>
          <p className="mt-2 text-slate-600">
            Thanks, {quote.customerName}. We&apos;ve got your confirmation for{' '}
            <strong>{quote.serviceLabel}</strong>
            {quote.tripDate ? ` on ${formatDate(quote.tripDate)}` : ''}.
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
          <Row label="Reference" value={quote.reference} />
          <Row label="Total" value={formatPeso(quote.total)} />
          {quote.paymentMethod && (
            <Row
              label="Paying via"
              value={PAYMENT_METHODS.find((m) => m.key === quote.paymentMethod)?.label ?? quote.paymentMethod}
            />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          We&apos;ll message you your driver&apos;s details the day before your trip.
        </p>
        <WhatsAppButton number={whatsapp} label="Message us on WhatsApp" />
      </Shell>
    );
  }

  if (declined) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900">Thanks for letting us know</h1>
        <p className="mt-2 text-slate-600">
          We&apos;ve closed this quote. If your plans change, message us any time — we&apos;ll pick
          up right where we left off.
        </p>
        <WhatsAppButton number={whatsapp} />
      </Shell>
    );
  }

  if (quote.isExpired || quote.status === 'expired') {
    return (
      <Shell>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <i className="pi pi-clock text-2xl text-amber-600" />
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900">This quote has expired</h1>
        <p className="mt-2 text-center text-slate-600">
          Prices and vehicle availability move quickly. Message us and we&apos;ll send you a fresh
          quote right away.
        </p>
        <WhatsAppButton number={whatsapp} label="Get an updated price" />
      </Shell>
    );
  }

  // --- The live quote --------------------------------------------------------

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / 86_400_000)
  );

  // A deposit only counts when it is actually above zero. An admin who typed "0"
  // stores "0.00", which is not null — without this the payment panel would tell
  // the customer to send ₱0.00.
  const depositDue =
    quote.depositAmount && Number.parseFloat(quote.depositAmount) > 0 ? quote.depositAmount : null;
  const amountDue = depositDue ?? quote.total;

  return (
    <main className="min-h-screen bg-cream px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-coral to-mango p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">Your quote from EasyRideCebu</p>
              <h1 className="mt-1 text-3xl font-bold">{formatPeso(quote.total)}</h1>
              <p className="mt-1 text-white/90">
                {quote.serviceLabel}
                {quote.vehicleLabel ? ` · ${quote.vehicleLabel}` : ''}
                {quote.tripDate ? ` · ${formatDate(quote.tripDate)}` : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-white/20 px-2.5 py-1 font-mono text-xs">
              {quote.reference}
            </span>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm">
            <i className="pi pi-clock text-xs" />
            {daysLeft === 0
              ? 'Expires today'
              : `Held for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}`}
            <span className="text-white/70">· until {formatDate(quote.validUntil)}</span>
          </div>
        </div>

        {/* Breakdown */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            What&apos;s included
          </h2>

          <ul className="divide-y divide-slate-100">
            {quote.lineItems.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                  )}
                  {item.quantity !== 1 && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.quantity} × {formatPeso(item.unitPrice)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-medium text-slate-900">
                  {formatPeso(item.amount)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPeso(quote.subtotal)}</span>
            </div>
            {Number.parseFloat(quote.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>− {formatPeso(quote.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{formatPeso(quote.total)}</span>
            </div>
            {depositDue && (
              <p className="pt-2 text-xs text-slate-500">
                A deposit of <strong>{formatPeso(depositDue)}</strong> secures your booking; the
                balance is due on the day.
              </p>
            )}
          </div>

          {quote.notes && (
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              {quote.notes}
            </p>
          )}
        </section>

        {/* Payment */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            How would you like to pay?
          </h2>
          <p className="mb-4 text-sm text-slate-500">Pick one to see the payment details.</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENT_METHODS.map((item) => {
              const isSelected = selectedMethod === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedMethod(item.key)}
                  aria-pressed={isSelected}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    isSelected
                      ? 'border-coral bg-coral/5 shadow-sm'
                      : 'border-slate-200 hover:border-coral/50'
                  }`}
                >
                  <i className={`pi ${item.icon} text-lg ${isSelected ? 'text-coral' : 'text-slate-400'}`} />
                  <p className="mt-1.5 font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">{item.tagline}</p>
                </button>
              );
            })}
          </div>

          {method && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                {method.qrImageUrl ? (
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={method.qrImageUrl}
                        alt={`${method.label} payment QR code`}
                        className="h-40 w-40 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <i className="pi pi-qrcode text-[11px]" /> Scan to pay
                    </span>
                    <DownloadQRButton
                      qrCodeUrl={method.qrImageUrl}
                      filename={method.qrFilename}
                      className="text-xs"
                    />
                  </div>
                ) : (
                  method.key !== 'cash' && (
                    <div className="flex h-40 w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center">
                      <i className="pi pi-qrcode text-2xl text-slate-300" />
                      <span className="text-xs text-slate-400">
                        QR coming soon — use the details beside
                      </span>
                    </div>
                  )
                )}

                <div className="min-w-0 flex-1 text-sm">
                  {method.key !== 'cash' && (
                    <>
                      <Row label="Account name" value={method.accountName} />
                      <Row label="Account number" value={method.accountNumber} mono />
                      <Row
                        label={depositDue ? 'Amount (deposit)' : 'Amount'}
                        value={formatPeso(amountDue)}
                      />
                    </>
                  )}
                  <p className="mt-3 text-slate-600">{method.instructions}</p>

                  {method.requiresReference && (
                    <div className="mt-4">
                      <label
                        htmlFor="payment-reference"
                        className="mb-1.5 block text-xs font-medium text-slate-500"
                      >
                        Reference number{' '}
                        <span className="text-slate-400">(optional, but speeds things up)</span>
                      </label>
                      <input
                        id="payment-reference"
                        value={reference}
                        onChange={(event) => setReference(event.target.value)}
                        placeholder="e.g. 0123456789"
                        maxLength={120}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Confirm */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={accept}
            disabled={!selectedMethod || isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-coral to-mango px-6 py-4 font-semibold text-white shadow-lg shadow-coral/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
          >
            {isSubmitting ? 'Confirming…' : 'Confirm my booking'}
          </button>

          {!selectedMethod && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Choose a payment method above to continue
            </p>
          )}

          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                `Hi! I have a question about quote ${quote.reference}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
            >
              <i className="pi pi-whatsapp" /> Ask a question first
            </a>
            <button
              type="button"
              onClick={decline}
              disabled={isSubmitting}
              className="text-sm text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline disabled:opacity-50"
            >
              No thanks, not this time
            </button>
          </div>
        </section>

        <p className="pb-4 text-center text-xs text-slate-400">
          EasyRideCebu · Cebu City, Philippines · This quote is for {quote.customerName}
        </p>
      </div>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">{children}</div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function WhatsAppButton({ number, label = 'Message us' }: { number: string; label?: string }) {
  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-700"
    >
      <i className="pi pi-whatsapp" /> {label}
    </a>
  );
}
