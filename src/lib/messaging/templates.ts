/**
 * Message templates used by the automations (plan §7, §12).
 *
 * Kept as plain functions rather than a template language so the copy stays
 * type-checked against the context it renders from.
 */

export const TEMPLATE_KEYS = [
  'instant_ack',
  'new_lead_alert',
  'followup_1',
  'followup_2',
  'followup_final',
  'quote_summary',
  'quote_reminder',
  'lost_reason_prompt',
  'booking_confirmation',
  'payment_submitted',
  'payment_verified',
  'trip_reminder',
  'driver_reminder',
  'review_request',
  'referral_invite',
  're_engagement_30',
  're_engagement_90',
  'referral_payout_pending',
  'referral_reward_issued',
  'detractor_alert',
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/**
 * The quote currently in front of the customer — what "here is your price"
 * emails are actually about. Null when nothing is awaiting payment.
 *
 * Its `total` is this quote's own amount, which on a partial payment is
 * deliberately *not* the deal value: the deal is the sum of its instalments.
 */
/**
 * One priced line of a quote, as the customer should see it.
 *
 * Mirrors `QuoteLineItem` from the quote schema rather than importing it —
 * this module is deliberately free of app-model imports so templates can be
 * rendered in isolation.
 */
export interface QuoteLine {
  label: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface LiveQuoteSummary {
  reference: string;
  /** 'full_payment' | 'partial_payment' */
  quoteType: string;
  /** "Full payment" / "Partial payment" — already human-readable. */
  typeLabel: string;
  isPartial: boolean;
  currency: string;
  total: string;
  /**
   * The downpayment due now, when the quote only asks for part of the price up
   * front. `total` stays the whole booking either way — that is the number the
   * customer is agreeing to.
   */
  depositAmount: string | null;
  /** `total` − `depositAmount`, to be settled later. Null when nothing is deferred. */
  balanceDue: string | null;
  url: string;
  /** How long the price is held, formatted for Manila. */
  validUntil: string;
  /** What the price is actually made of — one row per charge. */
  lineItems: QuoteLine[];
  subtotal: string;
  discount: string;
  /** Inclusions, pickup point, terms — whatever the agent typed. */
  notes: string | null;
}

/**
 * What the customer settled on when they confirmed the quote. Present only once
 * a quote on the deal has been accepted — the booking emails are the only
 * templates that read it.
 */
export interface PaymentSummary {
  /** Human quote reference, e.g. "Q-8F3A21". */
  reference: string;
  /** 'full_payment' | 'partial_payment' — what the settled quote was asking for. */
  quoteType: string;
  /** "Full payment" / "Partial payment". */
  typeLabel: string;
  isPartial: boolean;
  /** "GCash", "BPI Bank Transfer", "Cash on pickup"… */
  methodLabel: string;
  /** True when the money is handed over at pickup rather than sent up front. */
  paidOnPickup: boolean;
  /** The receipt/transaction number they typed in, when they gave one. */
  paymentReference: string | null;
  /**
   * What the customer wrote about paying — for cash, when they'll hand it over.
   * The only forward-looking detail a cash booking carries, so both the receipt
   * and the team's alert repeat it back.
   */
  paymentNote: string | null;
  currency: string;
  /** Raw numeric strings — run them through `money()` before display. */
  total: string;
  depositAmount: string | null;
  /**
   * True when this quote asked for a downpayment rather than the whole price.
   *
   * The distinction the payment emails turn on: `total` is the booking, but
   * `amountPaid` is what actually changed hands, and telling a customer we
   * received the former when they sent the latter is the one mistake in this
   * flow they will certainly notice.
   */
  isDownpayment: boolean;
  /** What the customer actually sent for this quote: the deposit, or the total. */
  amountPaid: string;
  /** Total minus deposit, when a deposit was asked for. */
  balanceDue: string | null;
  /** Everything accepted on this deal so far, including the payment just made. */
  settledTotal: string;
  /** Still-live quotes the customer has yet to pay — "0" for a settled booking. */
  outstanding: string;
  /** What the whole booking comes to: settled + outstanding. */
  bookingTotal: string;
  /** The link to settle what's outstanding, when there is something to settle. */
  outstandingUrl: string | null;
  /** When they confirmed, already formatted for Manila time. */
  acceptedAt: string | null;
  /** Absolute /quote/[token] link — doubles as the customer's receipt. */
  quoteUrl: string | null;
  /** Whether the customer attached a screenshot of the transfer. */
  proofAttached: boolean;
  /** Absolute /admin/payments/[id] link, for the team's alert. */
  adminPaymentUrl: string | null;
  /** The settled quote's breakdown, so the receipt itemises what was paid for. */
  lineItems: QuoteLine[];
  subtotal: string;
  discount: string;
  /** Inclusions, pickup point, terms — carried onto the receipt. */
  notes: string | null;
}

export interface TemplateContext {
  /** Customer first name, or a friendly fallback. */
  name: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  serviceLabel: string;
  vehicleLabel: string | null;
  preferredDate: string | null;
  tourTitle: string | null;
  /** The exact car a /fleet/[slug] inquiry named, e.g. "Vios / Mirage G4 (AT)". */
  vehicleName: string | null;
  /** Days requested on a fleet inquiry — null everywhere else. */
  rentalDays: number | null;
  /** Where they asked to be picked up, when the form collected it. */
  pickupLocation: string | null;
  opportunityTitle: string;
  monetaryValue: string;
  source: string | null;
  /** Absolute URL of the admin detail screen for this lead. */
  adminUrl: string;
  /** Absolute /review/[token] URL, when a review token exists. */
  reviewUrl: string | null;
  /** Absolute /thanks/[token] share-hub URL, when the contact has a referral code. */
  shareUrl: string | null;
  /** Absolute /quote/[token] checkout URL, when a live quote exists. */
  quoteUrl: string | null;
  referralCode: string | null;
  /** The quote awaiting payment, when there is one. */
  quote: LiveQuoteSummary | null;
  /** Set once a quote on this deal has been accepted; null before that. */
  payment: PaymentSummary | null;
  businessWhatsApp: string;
  siteUrl: string;
}

export interface RenderedMessage {
  subject: string;
  /** Plain-text body. Always present — it is the WhatsApp/SMS payload too. */
  body: string;
  /** Optional branded HTML, used for email when a template provides it. */
  html?: string;
}

const BRAND = 'EasyRideCebu';

// --- HTML email shell -------------------------------------------------------

/** Escapes values before they go anywhere near an HTML email body. */
function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wraps content in a branded shell. Table-based with inline styles because
 * that is what survives Gmail, Outlook and the Apple Mail renderers — this is
 * not a place for modern CSS.
 */
function emailShell(options: {
  heading: string;
  preheader: string;
  content: string;
  ctaLabel?: string;
  ctaUrl?: string;
  ctx: TemplateContext;
}): string {
  const { heading, preheader, content, ctaLabel, ctaUrl, ctx } = options;

  const cta =
    ctaLabel && ctaUrl
      ? `<tr><td style="padding:8px 32px 24px;">
           <a href="${esc(ctaUrl)}" style="display:inline-block;background:#DC2626;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:12px;">${esc(ctaLabel)}</a>
         </td></tr>`
      : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#F5F0E1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E1;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <tr><td style="background:linear-gradient(90deg,#DC2626,#F59E0B);padding:24px 32px;">
          <div style="color:#ffffff;font-size:20px;font-weight:700;">${BRAND}</div>
          <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:2px;">Car rentals · Airport transfers · Cebu tours</div>
        </td></tr>
        <tr><td style="padding:32px 32px 8px;">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#1A1A1A;">${esc(heading)}</h1>
          ${content}
        </td></tr>
        ${cta}
        <tr><td style="padding:8px 32px 28px;border-top:1px solid #eee;">
          <p style="margin:16px 0 4px;font-size:13px;color:#666;">Need us sooner? We reply fastest on WhatsApp.</p>
          <p style="margin:0;font-size:13px;">
            <a href="https://wa.me/${esc(ctx.businessWhatsApp)}" style="color:#2D6A4F;text-decoration:none;font-weight:600;">WhatsApp +${esc(ctx.businessWhatsApp)}</a>
            &nbsp;·&nbsp;
            <a href="tel:+${esc(ctx.businessWhatsApp)}" style="color:#DC2626;text-decoration:none;font-weight:600;">Call us</a>
          </p>
        </td></tr>
        <tr><td style="background:#FAF8F3;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#999;">${BRAND} · Cebu City, Philippines<br>Mon–Sat 8AM–8PM · Sun 9AM–6PM</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** A two-column detail table for "here's what you asked for" summaries. */
function detailRows(rows: [string, string | null][]): string {
  const cells = rows
    .filter(([, value]) => Boolean(value))
    .map(
      ([label, value]) =>
        `<tr>
           <td style="padding:6px 12px 6px 0;font-size:14px;color:#666;white-space:nowrap;">${esc(label)}</td>
           <td style="padding:6px 0;font-size:14px;color:#1A1A1A;font-weight:600;">${esc(value)}</td>
         </tr>`
    )
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#FAF8F3;border-radius:10px;padding:12px 16px;width:100%;">${cells}</table>`;
}

/**
 * The itemised breakdown — what the total is actually made of.
 *
 * A bare "Total: PHP 3,000" gives a customer nothing to check against what
 * they were told on the phone, and nothing to query if it looks wrong. Every
 * line the agent priced gets its own row, with quantity shown only when it is
 * more than one (× 1 is noise on every row).
 *
 * Returns '' for an empty list so callers can interpolate it unconditionally.
 */
function breakdownTable(
  currency: string,
  lines: QuoteLine[],
  subtotal: string,
  discount: string,
  total: string
): string {
  if (!lines || lines.length === 0) return '';

  const rows = lines
    .map(
      (line) => `
      <tr>
        <td style="padding:8px 12px 8px 0;font-size:14px;color:#1A1A1A;">
          ${esc(line.label)}
          ${
            line.description
              ? `<div style="margin-top:2px;font-size:12px;color:#666;">${esc(line.description)}</div>`
              : ''
          }
          ${
            line.quantity > 1
              ? `<div style="margin-top:2px;font-size:12px;color:#666;">${line.quantity} × ${esc(
                  money(currency, line.unitPrice)
                )}</div>`
              : ''
          }
        </td>
        <td style="padding:8px 0;font-size:14px;color:#1A1A1A;text-align:right;white-space:nowrap;">
          ${esc(money(currency, line.amount))}
        </td>
      </tr>`
    )
    .join('');

  // Only worth showing a subtotal line when a discount actually moved it.
  const hasDiscount = Number.parseFloat(discount || '0') > 0;
  const summary = `
    ${
      hasDiscount
        ? `<tr>
             <td style="padding:8px 12px 4px 0;font-size:14px;color:#666;border-top:1px solid #E8E0CC;">Subtotal</td>
             <td style="padding:8px 0 4px;font-size:14px;color:#666;text-align:right;border-top:1px solid #E8E0CC;">${esc(
               money(currency, subtotal)
             )}</td>
           </tr>
           <tr>
             <td style="padding:4px 12px 4px 0;font-size:14px;color:#2D6A4F;">Discount</td>
             <td style="padding:4px 0;font-size:14px;color:#2D6A4F;text-align:right;">− ${esc(
               money(currency, discount)
             )}</td>
           </tr>`
        : ''
    }
    <tr>
      <td style="padding:8px 12px 0 0;font-size:15px;color:#1A1A1A;font-weight:700;${
        hasDiscount ? '' : 'border-top:1px solid #E8E0CC;'
      }">Total</td>
      <td style="padding:8px 0 0;font-size:15px;color:#1A1A1A;font-weight:700;text-align:right;${
        hasDiscount ? '' : 'border-top:1px solid #E8E0CC;'
      }">${esc(money(currency, total))}</td>
    </tr>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#FAF8F3;border-radius:10px;padding:12px 16px;width:100%;">${rows}${summary}</table>`;
}

/** The agent's notes — inclusions, pickup point, terms. */
function notesBlock(notes: string | null): string {
  if (!notes || !notes.trim()) return '';
  return `
    <div style="margin:16px 0;padding:12px 16px;background:#fff;border:1px solid #E8E0CC;border-radius:10px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#666;">
        What's included
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#1A1A1A;white-space:pre-line;">${esc(
        notes.trim()
      )}</p>
    </div>`;
}

/** The same breakdown for the plain-text part. Returns [] when there is nothing. */
function breakdownLines(
  currency: string,
  lines: QuoteLine[],
  subtotal: string,
  discount: string,
  total: string
): string[] {
  if (!lines || lines.length === 0) return [];

  const out: string[] = ['', "What you're paying for:"];
  for (const line of lines) {
    out.push(`  • ${line.label} — ${money(currency, line.amount)}`);
    if (line.description) out.push(`      ${line.description}`);
    if (line.quantity > 1) out.push(`      ${line.quantity} × ${money(currency, line.unitPrice)}`);
  }
  if (Number.parseFloat(discount || '0') > 0) {
    out.push(`  Subtotal: ${money(currency, subtotal)}`);
    out.push(`  Discount: − ${money(currency, discount)}`);
  }
  out.push(`  Total:    ${money(currency, total)}`);
  return out;
}

/** The agent's notes for the plain-text part. */
function notesLines(notes: string | null): string[] {
  if (!notes || !notes.trim()) return [];
  return ['', "What's included:", ...notes.trim().split('\n').map((line) => `  ${line}`)];
}

function signOff(ctx: TemplateContext): string {
  return `— The ${BRAND} team\nWhatsApp: +${ctx.businessWhatsApp}\n${ctx.siteUrl}`;
}

/**
 * "PHP 12,500" — thousands separated, centavos only when they exist. Amounts
 * arrive as numeric strings from the database, so this also guards against a
 * bare "12500.00" landing in an email.
 */
function money(currency: string, amount: string | number | null | undefined): string {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0);
  if (!Number.isFinite(value)) return `${currency} 0`;

  const hasCentavos = Math.round(value * 100) % 100 !== 0;
  return `${currency} ${value.toLocaleString('en-PH', {
    minimumFractionDigits: hasCentavos ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

const TRIP_DATE_FORMATTER = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  // The stored value is date-only, so it parses as UTC midnight. Reading it
  // back in Manila (UTC+8) keeps the day the customer actually picked.
  timeZone: 'Asia/Manila',
});

/** "Aug 14, 2026" — nobody wants "2026-08-14" in their booking confirmation. */
function prettyDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : TRIP_DATE_FORMATTER.format(date);
}

/** "5 days" — null when the inquiry never asked for a length. */
function rentalLength(days: number | null): string | null {
  if (!days) return null;
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function tripLine(ctx: TemplateContext): string {
  const parts = [ctx.serviceLabel];
  if (ctx.vehicleName ?? ctx.vehicleLabel) parts.push(ctx.vehicleName ?? ctx.vehicleLabel!);
  const length = rentalLength(ctx.rentalDays);
  if (length) parts.push(`for ${length}`);
  const date = prettyDate(ctx.preferredDate);
  if (date) parts.push(`on ${date}`);
  return parts.join(' · ');
}

const TEMPLATES: Record<TemplateKey, (ctx: TemplateContext) => RenderedMessage> = {
  /**
   * The first thing a customer hears after submitting any of the site forms.
   * Its whole job is to confirm we have the inquiry and set the expectation
   * that a quote is coming — speed-to-lead is this business's biggest lever,
   * and a reply in seconds is what stops them messaging a competitor.
   */
  instant_ack: (ctx) => {
    const summary: [string, string | null][] = [
      ['Service', ctx.serviceLabel],
      ['Tour', ctx.tourTitle],
      // The named car beats the sedan/suv/van bucket when we have it — quoting
      // a "Sedan" back at someone who asked about a Vios reads like a form reply.
      ['Vehicle', ctx.vehicleName ?? ctx.vehicleLabel],
      ['Rental length', rentalLength(ctx.rentalDays)],
      ['Preferred date', prettyDate(ctx.preferredDate)],
      ['Pickup', ctx.pickupLocation],
    ];

    return {
      subject: `We've got your inquiry, ${ctx.name} — your quote is on the way`,
      // `null` drops a line; `''` is a deliberate blank line between paragraphs.
      body: [
        `Hi ${ctx.name},`,
        ``,
        `Thanks for reaching out to ${BRAND}. We've received your inquiry and a member of our team is putting your quote together now.`,
        ``,
        `Here's what we have:`,
        `  Service:        ${ctx.serviceLabel}`,
        ctx.tourTitle ? `  Tour:           ${ctx.tourTitle}` : null,
        ctx.vehicleName ?? ctx.vehicleLabel
          ? `  Vehicle:        ${ctx.vehicleName ?? ctx.vehicleLabel}`
          : null,
        ctx.rentalDays ? `  Rental length:  ${rentalLength(ctx.rentalDays)}` : null,
        ctx.preferredDate ? `  Preferred date: ${prettyDate(ctx.preferredDate)}` : null,
        ctx.pickupLocation ? `  Pickup:         ${ctx.pickupLocation}` : null,
        ``,
        `We'll reach out with your price and availability within the hour during business hours (Mon–Sat 8AM–8PM, Sun 9AM–6PM). If you sent this overnight, you'll hear from us first thing.`,
        ``,
        `No payment is needed to get a quote — you only pay once you're happy with the price.`,
        ``,
        `Need us sooner? Message us on WhatsApp: https://wa.me/${ctx.businessWhatsApp}`,
        ``,
        signOff(ctx),
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),

      html: emailShell({
        ctx,
        heading: `We've got your inquiry, ${esc(ctx.name)}`,
        preheader: `Your ${esc(ctx.serviceLabel)} quote is on the way — we reply within the hour.`,
        content: `
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
            Thanks for reaching out to ${BRAND}. We've received your inquiry and a member of
            our team is putting your quote together now.
          </p>
          ${detailRows(summary)}
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
            <strong>We'll reach out with your price and availability within the hour</strong>
            during business hours. If you sent this overnight, you'll hear from us first thing.
          </p>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#666;">
            No payment is needed to get a quote — you only pay once you're happy with the price.
          </p>`,
        ctaLabel: 'Chat with us on WhatsApp',
        ctaUrl: `https://wa.me/${ctx.businessWhatsApp}`,
      }),
    };
  },

  new_lead_alert: (ctx) => ({
    subject: `🆕 New lead — ${ctx.opportunityTitle}`,
    body: [
      `A new inquiry just came in from ${ctx.source ?? 'the website'}.`,
      ``,
      `Name:    ${ctx.fullName ?? '(not given)'}`,
      `Phone:   ${ctx.phone ?? '(not given)'}`,
      `Email:   ${ctx.email ?? '(not given)'}`,
      `Request: ${tripLine(ctx)}`,
      ctx.tourTitle ? `Tour:    ${ctx.tourTitle}` : '',
      ctx.vehicleName ? `Car:     ${ctx.vehicleName}` : '',
      ctx.rentalDays ? `Length:  ${rentalLength(ctx.rentalDays)}` : '',
      // Dispatch's first question — an airport handover is a different job from
      // a hotel drop, and knowing before the callback saves a round trip.
      ctx.pickupLocation ? `Pickup:  ${ctx.pickupLocation}` : '',
      ``,
      `Open the lead: ${ctx.adminUrl}`,
      `Call now: ${ctx.phone ?? ''}`,
    ]
      .filter(Boolean)
      .join('\n'),
  }),

  followup_1: (ctx) => ({
    subject: `Still planning your trip, ${ctx.name}?`,
    body: [
      `Hi ${ctx.name}, this is ${BRAND} following up on your ${ctx.serviceLabel} request.`,
      `Are the dates still ${prettyDate(ctx.preferredDate) ?? 'flexible'}? Reply here and we'll lock in a vehicle for you.`,
    ].join('\n'),
  }),

  followup_2: (ctx) => ({
    subject: `A quick option for your ${ctx.serviceLabel}`,
    body: [
      `Hi ${ctx.name}, we still have availability for ${tripLine(ctx)}.`,
      `Tell us your pickup point and group size and we'll send an exact price — no obligation.`,
    ].join('\n'),
  }),

  followup_final: (ctx) => ({
    subject: `Closing your ${BRAND} inquiry`,
    body: [
      `Hi ${ctx.name}, we haven't heard back so we'll close this request for now.`,
      `If your plans firm up, just message us — we'll pick up right where we left off.`,
      ``,
      signOff(ctx),
    ].join('\n'),
  }),

  /**
   * The quote itself, emailed the moment an agent sends it. This is the link
   * the whole funnel turns on, so it leads with the amount and the button and
   * says plainly whether this is the full price or one instalment — a customer
   * who thinks a partial payment settles the trip is a dispute waiting to happen.
   */
  quote_summary: (ctx) => {
    const quote = ctx.quote;
    const total = quote ? money(quote.currency, quote.total) : money('PHP', ctx.monetaryValue);
    const url = quote?.url ?? ctx.quoteUrl;

    /**
     * The downpayment, when this quote asks for one.
     *
     * `total` above stays the whole trip — that is what the customer is booking
     * — and this is the slice they have to send today. Leading with the total
     * and never naming this figure is how a customer ends up transferring the
     * lot, or nothing at all.
     */
    const deposit =
      quote?.depositAmount && Number.parseFloat(quote.depositAmount) > 0 ? quote : null;
    const dueNow = deposit ? money(deposit.currency, deposit.depositAmount) : null;
    const balance = deposit?.balanceDue ? money(deposit.currency, deposit.balanceDue) : null;

    const summary: [string, string | null][] = [
      ['Reference', quote?.reference ?? null],
      ['Service', ctx.serviceLabel],
      ['Tour', ctx.tourTitle],
      ['Vehicle', ctx.vehicleLabel],
      ['Date', prettyDate(ctx.preferredDate)],
      [deposit ? 'Booking total' : quote?.isPartial ? 'This payment' : 'Total', total],
      ['Downpayment due now', dueNow],
      ['Balance to follow', balance],
      ['Payment type', quote?.typeLabel ?? null],
      ['Price held until', quote?.validUntil ?? null],
    ];

    return {
      subject: deposit
        ? `Your ${BRAND} quote — ${total}, ${dueNow} to book`
        : quote?.isPartial
          ? `Your ${BRAND} payment request — ${total}`
          : `Your ${BRAND} quote — ${total} for ${ctx.serviceLabel}`,
      body: [
        `Hi ${ctx.name},`,
        ``,
        deposit
          ? `Here's your quote for ${tripLine(ctx)}. The trip comes to ${total}, and ${dueNow} secures it:`
          : quote?.isPartial
            ? `Here's the next payment for ${tripLine(ctx)}:`
            : `Here's your quote for ${tripLine(ctx)}:`,
        ``,
        quote ? `  Reference:    ${quote.reference}` : null,
        `  ${deposit ? 'Booking total:' : quote?.isPartial ? 'This payment:' : 'Total:       '} ${total}`,
        dueNow ? `  Pay now:      ${dueNow} (downpayment)` : null,
        balance ? `  Balance:      ${balance}` : null,
        quote ? `  Payment type: ${quote.typeLabel}` : null,
        quote ? `  Held until:   ${quote.validUntil}` : null,
        ...(quote
          ? breakdownLines(
              quote.currency,
              quote.lineItems,
              quote.subtotal,
              quote.discount,
              quote.total
            )
          : []),
        ...notesLines(quote?.notes ?? null),
        ``,
        deposit
          ? `Only the ${dueNow} downpayment is due now — it's what secures the vehicle for your date. We'll arrange the remaining ${balance ?? 'balance'} with you before your trip. Because it's paid in advance, this one has to go by GCash or bank transfer rather than cash on the day.`
          : quote?.isPartial
            ? `This covers part of your booking — we'll send the rest separately.`
            : `Includes an air-conditioned vehicle, fuel and hotel/airport pickup. Entrance fees, parking and meals are billed separately.`,
        ``,
        url
          ? `See the full breakdown, pay, and confirm your booking here:\n\n  ${url}\n`
          : `To confirm, reply to this email or message us on WhatsApp: https://wa.me/${ctx.businessWhatsApp}`,
        ``,
        `You can pay by GCash or bank transfer and upload a screenshot of your receipt on that page — it's the fastest way for us to confirm you.`,
        ``,
        signOff(ctx),
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),

      html: emailShell({
        ctx,
        heading: quote?.isPartial && !deposit
          ? `Your next payment, ${esc(ctx.name)}`
          : `Your quote, ${esc(ctx.name)}`,
        preheader: deposit
          ? `${esc(total)} · ${esc(dueNow ?? '')} to book · ${esc(tripLine(ctx))}`
          : `${esc(total)} · ${esc(tripLine(ctx))}`,
        content: `
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
            ${
              deposit
                ? `Here's your quote. Your booking comes to <strong>${esc(total)}</strong> — but you
                   only pay <strong>${esc(dueNow ?? '')}</strong> now to secure it, and we'll
                   arrange the remaining ${esc(balance ?? 'balance')} with you before your trip.`
                : quote?.isPartial
                  ? `Here's the next payment for your booking. It covers <strong>part</strong> of the
                     trip — we'll send the rest separately.`
                  : `Here's your quote. The price is held until the date below, and the button
                     opens the page where you can pay and confirm.`
            }
          </p>
          ${detailRows(summary)}
          ${
            quote
              ? breakdownTable(
                  quote.currency,
                  quote.lineItems,
                  quote.subtotal,
                  quote.discount,
                  quote.total
                )
              : ''
          }
          ${notesBlock(quote?.notes ?? null)}
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#666;">
            Pay by GCash or bank transfer, then upload a screenshot of your receipt on that
            page — it is the fastest way for us to confirm your booking.${
              deposit
                ? ` A downpayment has to reach us in advance, so cash on pickup is not an option on this one.`
                : ''
            }
          </p>`,
        ctaLabel: deposit
          ? `Pay ${dueNow} and book`
          : quote?.isPartial
            ? `Pay ${total}`
            : 'View and confirm your quote',
        ctaUrl: url ?? `https://wa.me/${ctx.businessWhatsApp}`,
      }),
    };
  },

  quote_reminder: (ctx) => ({
    subject: `Still holding your ${prettyDate(ctx.preferredDate) ?? 'preferred'} slot`,
    body: [
      `Hi ${ctx.name}, just checking in on the quote we sent for ${tripLine(ctx)}.`,
      `We can still hold the vehicle, but ${prettyDate(ctx.preferredDate) ?? 'that date'} books out fast. Want us to reserve it?`,
      ctx.quoteUrl ? `\nConfirm here: ${ctx.quoteUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }),

  lost_reason_prompt: (ctx) => ({
    subject: `⚠️ Quote went cold — ${ctx.opportunityTitle}`,
    body: [
      `This deal was auto-moved to Lost after two nudges with no reply.`,
      `If you know the real reason (price, dates, went elsewhere), record it so the funnel report stays accurate.`,
      ``,
      `Open the lead: ${ctx.adminUrl}`,
    ].join('\n'),
  }),

  /**
   * The receipt the customer gets the moment they confirm and pay on the quote
   * page. It has to do two jobs at once: reassure them the money and the
   * booking landed, and be the thing they screenshot at the pickup point — so
   * every number they were shown at checkout is repeated back here.
   *
   * A transfer is only ever *reported* by the customer until someone checks the
   * account, so the copy says "confirming your payment", never "received".
   */
  booking_confirmation: (ctx) => {
    const pay = ctx.payment;
    const total = pay ? money(pay.currency, pay.total) : money('PHP', ctx.monetaryValue);
    const dueAtPickup = pay?.balanceDue ? money(pay.currency, pay.balanceDue) : total;

    /**
     * The quote asked for a downpayment, so `total` above is the booking and
     * `paidNow` is what they actually sent. Every "we've got your payment" line
     * below has to name the second figure — a receipt that repeats the booking
     * total back at someone who paid a deposit reads as a demand for the lot.
     */
    const down = pay?.isDownpayment ? pay : null;
    const paidNow = pay ? money(pay.currency, pay.amountPaid) : total;
    const downBalance = down?.balanceDue ? money(down.currency, down.balanceDue) : null;

    /**
     * Whether the trip is actually confirmed, or only *claimed* to be paid.
     *
     * This email goes out the instant the customer submits the checkout form,
     * which is before any human has opened GCash to look. Nothing in this
     * system talks to a bank, so a transfer is a customer's word until an admin
     * verifies it on /admin/payments — and that verification sends its own
     * `payment_verified` email. Telling them "you're booked" here and then
     * "payment received" later reverses the order those facts actually happen
     * in, and promises a seat we might still have to take back if the money
     * never lands.
     *
     * Two cases are genuinely confirmed and keep the celebratory copy:
     *   - Pay on pickup — there is nothing to verify; they pay the driver.
     *   - No payment context at all — W4 sends this when an agent moves a deal
     *     to Booked by hand, which is a human vouching for it.
     */
    const awaitingVerification = Boolean(pay && !pay.paidOnPickup);

    // A booking paid in instalments needs the receipt to be clear about which
    // part this payment settled: `owed` means money is still to come, `split`
    // means this payment was never the whole booking either way.
    const owed = pay && Number.parseFloat(pay.outstanding) > 0 ? pay : null;
    const paidBefore = pay ? Number.parseFloat(pay.settledTotal) > Number.parseFloat(pay.total) : false;
    const split = pay && (owed !== null || pay.isPartial || paidBefore) ? pay : null;
    const outstanding = owed ? money(owed.currency, owed.outstanding) : null;

    const paymentLine = !pay
      ? null
      : pay.paidOnPickup
        ? `You're paying in cash — please have ${dueAtPickup} ready.${
            // Read their own words back to them. A cash booking has no receipt
            // and no reference; when they said they'd pay is the entire
            // arrangement, and both sides need to be holding the same version
            // of it before anyone turns up.
            pay.paymentNote ? ` You told us: “${pay.paymentNote}”` : ''
          }`
        : // The old copy promised we'd "only message you if something doesn't
          // match", which is now wrong in the good case: verifying sends a
          // `payment_verified` email. Saying we'll be in touch either way is
          // both true and the thing that stops them wondering.
          `We're checking your ${paidNow} ${down ? 'downpayment' : 'payment'} via ${
            pay.methodLabel
          } against our account — this is usually quick, and we'll email you as soon as it's confirmed.`;

    // Never claim a booking is settled off the back of a partial payment: the
    // rest may simply not have been billed yet, and "nothing else is due" is
    // the one sentence a customer will quote back at the pickup point.
    // Same rule as the heading: until someone has actually looked at the
    // account, these say what the payment *will* do, not what it has done.
    const outstandingLine = down
      ? // A downpayment quote already carries its own balance, so this says what
        // is left on *this* booking rather than pointing at a second quote that
        // does not exist yet.
        awaitingVerification
        ? `Once confirmed, that's your ${paidNow} downpayment settled and your ${total} booking secured. The remaining ${
            downBalance ?? 'balance'
          } is arranged with you before your trip.`
        : `That's your ${paidNow} downpayment settled and your ${total} booking secured. The remaining ${
            downBalance ?? 'balance'
          } is arranged with you before your trip.`
      : owed
      ? `That leaves ${outstanding} on this booking.${
          owed.outstandingUrl ? ` You can settle it here: ${owed.outstandingUrl}` : ''
        }`
      : pay?.isPartial
        ? awaitingVerification
          ? `Once confirmed that covers this instalment — we'll send your next payment request when it's due.`
          : `That covers this instalment — we'll send your next payment request when it's due.`
        : split
          ? awaitingVerification
            ? `Once confirmed that settles your booking in full — ${money(split.currency, split.settledTotal)} across all payments. Thank you!`
            : `That settles your booking in full — ${money(split.currency, split.settledTotal)} across all payments. Thank you!`
          : null;

    const summary: [string, string | null][] = [
      ['Reference', pay?.reference ?? null],
      ['Service', ctx.serviceLabel],
      ['Tour', ctx.tourTitle],
      ['Vehicle', ctx.vehicleLabel],
      ['Date', prettyDate(ctx.preferredDate)],
      [down ? 'Booking total' : split ? 'This payment' : 'Total', total],
      ['Downpayment paid', down ? paidNow : null],
      ['Payment type', pay?.isPartial ? pay.typeLabel : null],
      ['Deposit', !down && pay?.depositAmount ? money(pay.currency, pay.depositAmount) : null],
      [down ? 'Balance to follow' : 'Balance at pickup', pay?.balanceDue ? money(pay.currency, pay.balanceDue) : null],
      ['Still to pay', outstanding],
      ['Paid so far', !owed && paidBefore && pay ? money(pay.currency, pay.settledTotal) : null],
      ['Booking total', owed ? money(owed.currency, owed.bookingTotal) : null],
      ['Payment method', pay?.methodLabel ?? null],
      ['Your payment reference', pay?.paymentReference ?? null],
      ["When you'll pay", pay?.paidOnPickup ? pay.paymentNote : null],
      // "Confirmed" would be the third place this email overstates things —
      // the timestamp is when they submitted, not when we checked.
      [awaitingVerification ? 'Submitted' : 'Confirmed', pay?.acceptedAt ?? null],
    ];

    return {
      subject: awaitingVerification
        ? `We're confirming your ${down ? 'downpayment' : 'payment'}${
            pay ? ` (${pay.reference})` : ''
          } — ${tripLine(ctx)}`
        : `Booking confirmed${pay ? ` (${pay.reference})` : ''} — ${tripLine(ctx)}`,
      body: [
        `Hi ${ctx.name},`,
        ``,
        awaitingVerification
          ? `Thanks — we've got your booking request and your ${
              down ? `${paidNow} downpayment` : 'payment'
            } details. We're checking it now and will email you the moment it clears. Here's what you sent:`
          : `You're booked! Here are your details:`,
        ``,
        pay ? `  Reference:      ${pay.reference}` : null,
        `  Service:        ${ctx.serviceLabel}`,
        ctx.tourTitle ? `  Tour:           ${ctx.tourTitle}` : null,
        ctx.vehicleLabel ? `  Vehicle:        ${ctx.vehicleLabel}` : null,
        ctx.preferredDate ? `  Date:           ${prettyDate(ctx.preferredDate)}` : null,
        `  ${down ? 'Booking total: ' : split ? 'This payment:  ' : 'Total:         '} ${total}`,
        down ? `  Downpayment:    ${paidNow}` : null,
        down && downBalance ? `  Balance:        ${downBalance} to follow` : null,
        pay?.isPartial ? `  Payment type:   ${pay.typeLabel}` : null,
        !down && pay?.depositAmount ? `  Deposit:        ${money(pay.currency, pay.depositAmount)}` : null,
        !down && pay?.balanceDue ? `  Balance:        ${money(pay.currency, pay.balanceDue)} at pickup` : null,
        owed ? `  Still to pay:   ${outstanding}` : null,
        !owed && paidBefore && pay ? `  Paid so far:    ${money(pay.currency, pay.settledTotal)}` : null,
        owed ? `  Booking total:  ${money(owed.currency, owed.bookingTotal)}` : null,
        pay ? `  Payment method: ${pay.methodLabel}` : null,
        pay?.paymentReference ? `  Your reference: ${pay.paymentReference}` : null,
        pay?.paidOnPickup && pay.paymentNote ? `  You'll pay:     ${pay.paymentNote}` : null,
        ...(pay
          ? breakdownLines(pay.currency, pay.lineItems, pay.subtotal, pay.discount, pay.total)
          : []),
        ...notesLines(pay?.notes ?? null),
        ...(paymentLine ? [``, paymentLine] : []),
        ...(outstandingLine ? [``, outstandingLine] : []),
        ``,
        awaitingVerification
          ? `Once it's confirmed we'll send your driver's name, vehicle and plate number the day before your trip. Any changes, message us any time — the earlier the better.`
          : `We'll send your driver's name, vehicle and plate number the day before your trip. Any changes, message us any time — the earlier the better.`,
        ...(pay?.quoteUrl ? [``, `Your booking details: ${pay.quoteUrl}`] : []),
        ``,
        signOff(ctx),
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),

      html: emailShell({
        ctx,
        heading: awaitingVerification
          ? `Thanks, ${esc(ctx.name)} — we're confirming your ${down ? 'downpayment' : 'payment'}`
          : `You're booked, ${esc(ctx.name)}! 🎉`,
        preheader: awaitingVerification
          ? down
            ? `${esc(paidNow)} downpayment received and being checked · ${esc(tripLine(ctx))}`
            : `Payment received and being checked · ${esc(tripLine(ctx))} · ${esc(total)}`
          : owed
            ? `Confirmed: ${esc(tripLine(ctx))} · ${esc(outstanding ?? '')} still to pay`
            : `Confirmed: ${esc(tripLine(ctx))} · ${esc(total)}`,
        content: `
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
            ${
              awaitingVerification
                ? `We've got your booking request and your ${
                    down ? `<strong>${esc(paidNow)}</strong> downpayment` : 'payment'
                  } details. Your trip isn't confirmed just yet — we're checking it against our
                   account first, and we'll email you the moment it clears.`
                : `Thanks for booking with ${BRAND} — your trip is confirmed.`
            }
            Keep this email
            handy${pay ? `; <strong>${esc(pay.reference)}</strong> is your reference` : ''}.
          </p>
          ${detailRows(summary)}
          ${
            pay
              ? breakdownTable(pay.currency, pay.lineItems, pay.subtotal, pay.discount, pay.total)
              : ''
          }
          ${notesBlock(pay?.notes ?? null)}
          ${
            paymentLine
              ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">${esc(paymentLine)}</p>`
              : ''
          }
          ${
            outstandingLine
              ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">${esc(
                  owed && owed.outstandingUrl
                    ? `That leaves ${outstanding} on this booking — the button below opens it.`
                    : outstandingLine
                )}</p>`
              : ''
          }
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#666;">
            ${
              awaitingVerification
                ? `Once it's confirmed we'll send your driver's name, vehicle and plate number
                   the day before your trip.`
                : `We'll send your driver's name, vehicle and plate number the day before your trip.`
            }
            Need to change something? Message us — the earlier the better.
          </p>`,
        ctaLabel: owed?.outstandingUrl
          ? `Pay the remaining ${outstanding}`
          : pay?.quoteUrl
            ? awaitingVerification
              ? 'View your booking request'
              : 'View your booking'
            : 'Message us on WhatsApp',
        ctaUrl:
          owed?.outstandingUrl ?? pay?.quoteUrl ?? `https://wa.me/${ctx.businessWhatsApp}`,
      }),
    };
  },

  /**
   * The team's alert the moment a customer submits a payment. Its job is to get
   * someone to *check the money arrived* — nothing in this system talks to a
   * bank, so a claim sits unverified until a person opens their GCash app.
   * Written to be read on a phone lock screen: who paid, how much, what type.
   */
  payment_submitted: (ctx) => {
    const pay = ctx.payment;
    const total = pay ? money(pay.currency, pay.total) : money('PHP', ctx.monetaryValue);
    const owed = pay && Number.parseFloat(pay.outstanding) > 0 ? pay : null;
    const split =
      pay && (owed !== null || Number.parseFloat(pay.settledTotal) > Number.parseFloat(pay.total))
        ? pay
        : null;

    // The figure to look for in the bank app is what they *sent*, which on a
    // downpayment quote is not the booking total. Leading the subject with the
    // total would have whoever opens this hunting for money that was never due.
    const down = pay?.isDownpayment ? pay : null;
    const paidNow = pay ? money(pay.currency, pay.amountPaid) : total;

    return {
      subject: `💰 ${down ? 'Downpayment' : 'Payment'} to verify — ${paidNow}${
        down ? ` of ${total}` : pay?.isPartial ? ' (partial)' : ''
      } · ${ctx.opportunityTitle}`,
      body: [
        `${ctx.fullName ?? 'A customer'} submitted a ${down ? 'downpayment' : 'payment'}${
          pay ? ` for quote ${pay.reference}` : ''
        }. Please check it and mark it verified.`,
        ``,
        pay ? `Type:      ${pay.typeLabel}` : null,
        down ? `Paid now:  ${paidNow} (downpayment)` : `${split ? 'Paid now: ' : 'Total:    '} ${total}`,
        down ? `Booking:   ${total} all in` : null,
        down?.balanceDue ? `Balance:   ${money(down.currency, down.balanceDue)} to arrange later` : null,
        owed ? `Still due: ${money(owed.currency, owed.outstanding)} (quote still open)` : null,
        !down && split
          ? `Booking:   ${money(split.currency, split.bookingTotal)} all in${
              owed ? '' : ' — settled in full'
            }`
          : null,
        pay ? `Payment:   ${pay.methodLabel}` : null,
        pay?.paymentReference ? `Their ref: ${pay.paymentReference}` : null,
        // For a cash booking this is the only actionable fact in the email —
        // there is no money to check, just a time and place to be ready for.
        pay?.paidOnPickup && pay.paymentNote ? `They pay:  ${pay.paymentNote}` : null,
        // Skipped on a downpayment — the three lines above already said it, and
        // repeating the figure under a second name is how a deposit gets
        // mistaken for a separate charge.
        !down && pay?.depositAmount ? `Deposit:   ${money(pay.currency, pay.depositAmount)}` : null,
        !down && pay?.balanceDue ? `Balance:   ${money(pay.currency, pay.balanceDue)} due at pickup` : null,
        pay?.acceptedAt ? `Confirmed: ${pay.acceptedAt}` : null,
        ``,
        down
          ? `⚠️ Look for ${paidNow}, not ${total} — this quote only asked for the downpayment. Check it actually landed before you commit a vehicle.`
          : pay && !pay.paidOnPickup
          ? `⚠️ Check the money actually landed before you commit a vehicle — the reference above is what the customer typed in, not a verified receipt.`
          : `💵 Paying in cash — ${
              pay?.balanceDue ? money(pay.currency, pay.balanceDue) : total
            } to collect${
              pay?.paymentNote ? `, and they said: “${pay.paymentNote}”` : ' at pickup'
            }.`,
        // A cash booking still ends up as a payment row someone has to close —
        // it just gets verified when the money is handed over rather than when
        // it shows up in an account, so the link belongs here either way.
        !pay
          ? null
          : pay.paidOnPickup
            ? `🧾 Nothing to check yet — mark it verified once the cash is in hand:`
            : pay.proofAttached
              ? `📎 They attached a screenshot — open it and mark the payment verified:`
              : `📎 No screenshot attached. Match it by reference, then mark it verified:`,
        pay?.adminPaymentUrl ? `   ${pay.adminPaymentUrl}` : null,
        ``,
        `Customer: ${ctx.fullName ?? '(no name)'}`,
        `Phone:    ${ctx.phone ?? '(not given)'}`,
        `Email:    ${ctx.email ?? '(not given)'}`,
        `Trip:     ${tripLine(ctx)}`,
        ctx.tourTitle ? `Tour:     ${ctx.tourTitle}` : null,
        ``,
        `Once the money is in, verify the payment — that is what tells the rest of the team a vehicle can be committed.`,
        `Open the lead: ${ctx.adminUrl}`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
    };
  },

  /**
   * Sent to the customer when an agent confirms the money arrived. Until this
   * lands the customer has only our "we're checking" note, so it is the email
   * that actually settles their mind — and it has to be explicit about whether
   * the booking is now paid in full or still has instalments to come.
   */
  payment_verified: (ctx) => {
    const pay = ctx.payment;
    const total = pay ? money(pay.currency, pay.total) : money('PHP', ctx.monetaryValue);
    const owed = pay && Number.parseFloat(pay.outstanding) > 0 ? pay : null;
    const outstanding = owed ? money(owed.currency, owed.outstanding) : null;

    /**
     * The amount we are confirming, which is not always the booking.
     *
     * On a downpayment quote the customer sent a slice of `total`, so every
     * figure in this email has to be `amountPaid` — telling someone we received
     * ₱12,000 when they sent ₱3,000 would have them assume the trip is settled,
     * and they'd find out otherwise at the pickup point.
     */
    const down = pay?.isDownpayment ? pay : null;
    const received = pay ? money(pay.currency, pay.amountPaid) : total;
    const downBalance = down?.balanceDue ? money(down.currency, down.balanceDue) : null;

    // "Nothing else is due" is only ever said about a full payment with nothing
    // outstanding. A downpayment or a partial payment leaves the rest to be
    // billed, whether or not a quote for it exists yet.
    const standing = !pay
      ? `Your payment is confirmed.`
      : down
        ? `Your downpayment is accepted and your booking is secured — the vehicle is held for your date. The remaining ${
            downBalance ?? 'balance'
          } of your ${total} booking is arranged with you before your trip.`
        : owed
          ? `That covers ${
              pay.isPartial ? 'this instalment' : 'this payment'
            } — ${outstanding} is still to come on this booking.`
          : pay.isPartial
            ? `That covers this instalment. We'll send your next payment request when it's due.`
            : `Your booking is now paid in full. Nothing else is due.`;

    const paidBefore = pay ? Number.parseFloat(pay.settledTotal) > Number.parseFloat(pay.total) : false;

    const summary: [string, string | null][] = [
      ['Reference', pay?.reference ?? null],
      [down ? 'Downpayment received' : 'Payment received', received],
      ['Booking total', down ? total : owed ? money(owed.currency, owed.bookingTotal) : null],
      ['Balance to follow', downBalance],
      ['Payment type', pay?.typeLabel ?? null],
      ['Paid by', pay?.methodLabel ?? null],
      ['Still to pay', outstanding],
      ['Paid so far', !owed && paidBefore && pay ? money(pay.currency, pay.settledTotal) : null],
      ['Service', ctx.serviceLabel],
      ['Date', prettyDate(ctx.preferredDate)],
    ];

    return {
      subject: down
        ? `Downpayment accepted — ${received} received, your booking is secured`
        : `Payment received — ${total}${pay?.isPartial ? ' (partial payment)' : ''}`,
      body: [
        `Hi ${ctx.name},`,
        ``,
        down
          ? `Good news — we've checked our account and your downpayment of ${received} came through. It's accepted, and your booking is secured.`
          : `Good news — we've checked our account and your payment of ${total} came through.`,
        ``,
        pay ? `  Reference:    ${pay.reference}` : null,
        `  ${down ? 'Downpayment: ' : 'Received:    '} ${received}`,
        down ? `  Booking total: ${total}` : null,
        down && downBalance ? `  Balance:      ${downBalance} to follow` : null,
        pay ? `  Payment type: ${pay.typeLabel}` : null,
        pay ? `  Paid by:      ${pay.methodLabel}` : null,
        owed ? `  Still to pay: ${outstanding}` : null,
        !owed && paidBefore && pay ? `  Paid so far:  ${money(pay.currency, pay.settledTotal)}` : null,
        !down && owed ? `  Booking total: ${money(owed.currency, owed.bookingTotal)}` : null,
        ...(pay
          ? breakdownLines(pay.currency, pay.lineItems, pay.subtotal, pay.discount, pay.total)
          : []),
        ...notesLines(pay?.notes ?? null),
        ``,
        standing,
        ...(owed?.outstandingUrl ? [``, `Settle the rest here: ${owed.outstandingUrl}`] : []),
        ``,
        `We'll send your driver's name, vehicle and plate number the day before your trip.`,
        ``,
        signOff(ctx),
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),

      html: emailShell({
        ctx,
        heading: down
          ? `Downpayment accepted, ${esc(ctx.name)} — you're booked! 🎉`
          : owed
            ? `Payment received, ${esc(ctx.name)}`
            : `You're all paid up, ${esc(ctx.name)}! 🎉`,
        preheader: down
          ? `${esc(received)} downpayment accepted · booking secured${
              downBalance ? ` · ${esc(downBalance)} to follow` : ''
            }`
          : `${esc(total)} confirmed${owed ? ` · ${esc(outstanding ?? '')} still to pay` : ''}`,
        content: `
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
            ${
              down
                ? `We've checked our account and your downpayment of <strong>${esc(
                    received
                  )}</strong> came through. It is <strong>accepted</strong> — your booking is
                   secured and the vehicle is held for your date. Thank you!`
                : `We've checked our account and your payment of <strong>${esc(total)}</strong> came
                   through. Thank you!`
            }
          </p>
          ${detailRows(summary)}
          ${
            pay
              ? breakdownTable(pay.currency, pay.lineItems, pay.subtotal, pay.discount, pay.total)
              : ''
          }
          ${notesBlock(pay?.notes ?? null)}
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">${esc(standing)}</p>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#666;">
            We'll send your driver's name, vehicle and plate number the day before your trip.
          </p>`,
        ctaLabel: owed?.outstandingUrl
          ? `Pay the remaining ${outstanding}`
          : down && pay?.quoteUrl
            ? 'View your booking'
            : 'Message us on WhatsApp',
        ctaUrl:
          owed?.outstandingUrl ??
          (down ? pay?.quoteUrl ?? `https://wa.me/${ctx.businessWhatsApp}` : `https://wa.me/${ctx.businessWhatsApp}`),
      }),
    };
  },

  trip_reminder: (ctx) => ({
    subject: `See you tomorrow, ${ctx.name}!`,
    body: [
      `Hi ${ctx.name}, your ${ctx.serviceLabel} with ${BRAND} is tomorrow${
        ctx.preferredDate ? ` (${prettyDate(ctx.preferredDate)})` : ''
      }.`,
      `Your driver will message you with the plate number and pickup time. Safe travels!`,
    ].join('\n'),
  }),

  driver_reminder: (ctx) => ({
    subject: `🚗 Trip tomorrow — ${ctx.opportunityTitle}`,
    body: [
      `Confirm the driver, vehicle and pickup time with the customer today.`,
      ``,
      `Customer: ${ctx.fullName ?? '(not given)'} — ${ctx.phone ?? '(no phone)'}`,
      `Trip:     ${tripLine(ctx)}`,
      ``,
      `Open the lead: ${ctx.adminUrl}`,
    ].join('\n'),
  }),

  review_request: (ctx) => ({
    subject: `How was your trip, ${ctx.name}?`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      `Thanks for riding with ${BRAND}! It takes one tap to tell us how we did:`,
      ``,
      `  ${ctx.reviewUrl ?? ctx.siteUrl}`,
      ``,
      `Your honest feedback — good or bad — is how we keep the service sharp.`,
      ``,
      signOff(ctx),
    ].join('\n'),
  }),

  referral_invite: (ctx) => ({
    subject: `Give ₱300, get ₱500`,
    body: [
      `So glad you enjoyed the trip, ${ctx.name}! 🎉`,
      ``,
      `Share your personal link and your friend gets ₱300 off their first booking — you get ₱500 off your next one, the moment they ride.`,
      ``,
      `  ${ctx.shareUrl ?? ctx.siteUrl}`,
    ].join('\n'),
  }),

  re_engagement_30: (ctx) => ({
    subject: `Planning another Cebu trip, ${ctx.name}?`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      `Whale sharks in Oslob, canyoneering in Moalboal, or just an airport run — your ${BRAND} driver is a message away.`,
      `Book again and we'll hold your usual vehicle.`,
      ``,
      signOff(ctx),
    ].join('\n'),
  }),

  re_engagement_90: (ctx) => ({
    subject: `We saved your details — ready when you are`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      `It's been a few months! Whenever you're back in Cebu (or have friends visiting), we've still got your details on file — booking takes one message.`,
      ``,
      ctx.shareUrl ? `Your referral link is still live: ${ctx.shareUrl}` : '',
      ``,
      signOff(ctx),
    ]
      .filter(Boolean)
      .join('\n'),
  }),

  referral_payout_pending: (ctx) => ({
    subject: `💸 Referral reward awaiting approval`,
    body: [
      `A referred booking just converted — ${ctx.opportunityTitle}.`,
      `Approve or reject the payout in the portal: ${ctx.siteUrl}/admin/referrals`,
    ].join('\n'),
  }),

  referral_reward_issued: (ctx) => ({
    subject: `Your ${BRAND} referral reward is ready to use`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      // Says what it is and how to use it. "Your reward is approved" left the
      // customer with nothing to do and no idea when anything would happen —
      // and left us relying on someone remembering months later.
      // The figure is written out rather than imported: this module stays free
      // of app-model imports so templates render in isolation. It has to match
      // `REFERRER_REWARD_LABEL` in lib/crm/rewards.ts.
      `Your friend just completed their booking — thank you! Your ₱500 off your next booking is now on your account.`,
      ``,
      `There's nothing to claim: next time you book with us, just tell us and we'll take it straight off your price. It's valid for a year.`,
      ``,
      `Know someone else heading to Cebu? Every friend you send earns you another one.`,
      ``,
      signOff(ctx),
    ].join('\n'),
  }),

  detractor_alert: (ctx) => ({
    subject: `🔴 Unhappy customer — call them today`,
    body: [
      `${ctx.fullName ?? 'A customer'} left a low rating after ${ctx.opportunityTitle}.`,
      `Reach out personally before this becomes a public review.`,
      ``,
      `Phone: ${ctx.phone ?? '(no phone)'}`,
      `Open the lead: ${ctx.adminUrl}`,
    ].join('\n'),
  }),
};

export function renderTemplate(key: TemplateKey, ctx: TemplateContext): RenderedMessage {
  const render = TEMPLATES[key];
  if (!render) {
    return { subject: key, body: `(no template registered for "${key}")` };
  }
  return render(ctx);
}

export function isTemplateKey(value: string): value is TemplateKey {
  return (TEMPLATE_KEYS as readonly string[]).includes(value);
}
