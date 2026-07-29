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
  'booking_alert',
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
 * What the customer settled on when they confirmed the quote. Present only once
 * a quote on the deal has been accepted — the booking emails are the only
 * templates that read it.
 */
export interface PaymentSummary {
  /** Human quote reference, e.g. "Q-8F3A21". */
  reference: string;
  /** "GCash", "BPI Bank Transfer", "Cash on pickup"… */
  methodLabel: string;
  /** True when the money is handed over at pickup rather than sent up front. */
  paidOnPickup: boolean;
  /** The receipt/transaction number they typed in, when they gave one. */
  paymentReference: string | null;
  currency: string;
  /** Raw numeric strings — run them through `money()` before display. */
  total: string;
  depositAmount: string | null;
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

function tripLine(ctx: TemplateContext): string {
  const parts = [ctx.serviceLabel];
  if (ctx.vehicleLabel) parts.push(ctx.vehicleLabel);
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
      ['Vehicle', ctx.vehicleLabel],
      ['Preferred date', prettyDate(ctx.preferredDate)],
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
        ctx.vehicleLabel ? `  Vehicle:        ${ctx.vehicleLabel}` : null,
        ctx.preferredDate ? `  Preferred date: ${prettyDate(ctx.preferredDate)}` : null,
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

  quote_summary: (ctx) => ({
    subject: `Your ${BRAND} quote — ${ctx.serviceLabel}`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      `Here's your quote for ${tripLine(ctx)}:`,
      ``,
      `  Total: ${money('PHP', ctx.monetaryValue)}`,
      ``,
      `Includes an air-conditioned vehicle, fuel and hotel/airport pickup. Entrance fees, parking and meals are billed separately.`,
      ``,
      ctx.quoteUrl
        ? `See the full breakdown and confirm your booking here:\n\n  ${ctx.quoteUrl}\n`
        : `To confirm, reply to this email or message us on WhatsApp: https://wa.me/${ctx.businessWhatsApp}`,
      ``,
      signOff(ctx),
    ].join('\n'),
  }),

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

    // A booking paid in instalments needs the receipt to be clear about which
    // part this payment settled: `owed` means money is still to come, `split`
    // means this payment was never the whole booking either way.
    const owed = pay && Number.parseFloat(pay.outstanding) > 0 ? pay : null;
    const split =
      pay && (owed !== null || Number.parseFloat(pay.settledTotal) > Number.parseFloat(pay.total))
        ? pay
        : null;
    const outstanding = owed ? money(owed.currency, owed.outstanding) : null;

    const paymentLine = !pay
      ? null
      : pay.paidOnPickup
        ? `You're paying at pickup — please have ${dueAtPickup} ready for your driver.`
        : `We're confirming your ${pay.methodLabel} payment now and will only message you if something doesn't match.`;

    const outstandingLine = owed
      ? `That leaves ${outstanding} on this booking.${
          owed.outstandingUrl ? ` You can settle it here: ${owed.outstandingUrl}` : ''
        }`
      : split
        ? `That settles your booking in full — ${money(split.currency, split.settledTotal)} across all payments. Thank you!`
        : null;

    const summary: [string, string | null][] = [
      ['Reference', pay?.reference ?? null],
      ['Service', ctx.serviceLabel],
      ['Tour', ctx.tourTitle],
      ['Vehicle', ctx.vehicleLabel],
      ['Date', prettyDate(ctx.preferredDate)],
      [split ? 'This payment' : 'Total', total],
      ['Deposit', pay?.depositAmount ? money(pay.currency, pay.depositAmount) : null],
      ['Balance at pickup', pay?.balanceDue ? money(pay.currency, pay.balanceDue) : null],
      ['Still to pay', outstanding],
      ['Booking total', split ? money(split.currency, split.bookingTotal) : null],
      ['Payment method', pay?.methodLabel ?? null],
      ['Your payment reference', pay?.paymentReference ?? null],
      ['Confirmed', pay?.acceptedAt ?? null],
    ];

    return {
      subject: `Booking confirmed${pay ? ` (${pay.reference})` : ''} — ${tripLine(ctx)}`,
      body: [
        `Hi ${ctx.name},`,
        ``,
        `You're booked! Here are your details:`,
        ``,
        pay ? `  Reference:      ${pay.reference}` : null,
        `  Service:        ${ctx.serviceLabel}`,
        ctx.tourTitle ? `  Tour:           ${ctx.tourTitle}` : null,
        ctx.vehicleLabel ? `  Vehicle:        ${ctx.vehicleLabel}` : null,
        ctx.preferredDate ? `  Date:           ${prettyDate(ctx.preferredDate)}` : null,
        `  ${split ? 'This payment:  ' : 'Total:         '} ${total}`,
        pay?.depositAmount ? `  Deposit:        ${money(pay.currency, pay.depositAmount)}` : null,
        pay?.balanceDue ? `  Balance:        ${money(pay.currency, pay.balanceDue)} at pickup` : null,
        owed ? `  Still to pay:   ${outstanding}` : null,
        split ? `  Booking total:  ${money(split.currency, split.bookingTotal)}` : null,
        pay ? `  Payment method: ${pay.methodLabel}` : null,
        pay?.paymentReference ? `  Your reference: ${pay.paymentReference}` : null,
        ...(paymentLine ? [``, paymentLine] : []),
        ...(outstandingLine ? [``, outstandingLine] : []),
        ``,
        `We'll send your driver's name, vehicle and plate number the day before your trip. Any changes, message us any time — the earlier the better.`,
        ...(pay?.quoteUrl ? [``, `Your booking details: ${pay.quoteUrl}`] : []),
        ``,
        signOff(ctx),
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),

      html: emailShell({
        ctx,
        heading: `You're booked, ${esc(ctx.name)}! 🎉`,
        preheader: owed
          ? `Confirmed: ${esc(tripLine(ctx))} · ${esc(outstanding ?? '')} still to pay`
          : `Confirmed: ${esc(tripLine(ctx))} · ${esc(total)}`,
        content: `
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
            Thanks for booking with ${BRAND} — your trip is confirmed. Keep this email
            handy${pay ? `; <strong>${esc(pay.reference)}</strong> is your reference` : ''}.
          </p>
          ${detailRows(summary)}
          ${
            paymentLine
              ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">${esc(paymentLine)}</p>`
              : ''
          }
          ${
            owed
              ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
                   That leaves <strong>${esc(outstanding)}</strong> on this booking${
                     owed.outstandingUrl ? ' — the button below opens it' : ''
                   }.
                 </p>`
              : split
                ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#333;">
                     That settles your booking in full —
                     <strong>${esc(money(split.currency, split.settledTotal))}</strong>
                     across all payments. Thank you!
                   </p>`
                : ''
          }
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#666;">
            We'll send your driver's name, vehicle and plate number the day before your trip.
            Need to change something? Message us — the earlier the better.
          </p>`,
        ctaLabel: owed?.outstandingUrl
          ? `Pay the remaining ${outstanding}`
          : pay?.quoteUrl
            ? 'View your booking'
            : 'Message us on WhatsApp',
        ctaUrl:
          owed?.outstandingUrl ?? pay?.quoteUrl ?? `https://wa.me/${ctx.businessWhatsApp}`,
      }),
    };
  },

  /**
   * Fires at the same moment as the customer's confirmation. Written to be read
   * on a phone lock screen: who paid, how much, by what method — and whether
   * anyone still needs to check the money actually landed.
   */
  booking_alert: (ctx) => {
    const pay = ctx.payment;
    const total = pay ? money(pay.currency, pay.total) : money('PHP', ctx.monetaryValue);
    const owed = pay && Number.parseFloat(pay.outstanding) > 0 ? pay : null;
    const split =
      pay && (owed !== null || Number.parseFloat(pay.settledTotal) > Number.parseFloat(pay.total))
        ? pay
        : null;

    return {
      subject: `💰 ${
        owed ? 'Part-payment' : split ? 'Final payment' : 'Booking'
      } confirmed — ${total} · ${ctx.opportunityTitle}`,
      body: [
        `${ctx.fullName ?? 'A customer'} confirmed the booking${
          pay ? ` and accepted quote ${pay.reference}` : ''
        }.`,
        ``,
        `${split ? 'Paid now: ' : 'Total:    '} ${total}`,
        owed ? `Still due: ${money(owed.currency, owed.outstanding)} (quote still open)` : null,
        split
          ? `Booking:   ${money(split.currency, split.bookingTotal)} all in${
              owed ? '' : ' — settled in full'
            }`
          : null,
        pay ? `Payment:   ${pay.methodLabel}` : null,
        pay?.paymentReference ? `Their ref: ${pay.paymentReference}` : null,
        pay?.depositAmount ? `Deposit:   ${money(pay.currency, pay.depositAmount)}` : null,
        pay?.balanceDue ? `Balance:   ${money(pay.currency, pay.balanceDue)} due at pickup` : null,
        pay?.acceptedAt ? `Confirmed: ${pay.acceptedAt}` : null,
        ``,
        pay && !pay.paidOnPickup
          ? `⚠️ Check the money actually landed before you commit a vehicle — the reference above is what the customer typed in, not a verified receipt.`
          : `💵 Cash on pickup — the driver collects ${
              pay?.balanceDue ? money(pay.currency, pay.balanceDue) : total
            }.`,
        pay && !pay.paidOnPickup
          ? pay.proofAttached
            ? `📎 They attached a screenshot — open it and mark the payment verified:`
            : `📎 No screenshot attached. Match it by reference, then mark it verified:`
          : null,
        pay?.adminPaymentUrl && !pay.paidOnPickup ? `   ${pay.adminPaymentUrl}` : null,
        ``,
        `Customer: ${ctx.fullName ?? '(no name)'}`,
        `Phone:    ${ctx.phone ?? '(not given)'}`,
        `Email:    ${ctx.email ?? '(not given)'}`,
        `Trip:     ${tripLine(ctx)}`,
        ctx.tourTitle ? `Tour:     ${ctx.tourTitle}` : null,
        ``,
        `Next: assign a driver and confirm the itinerary.`,
        `Open the lead: ${ctx.adminUrl}`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
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
      `Share your personal link and your friend gets ₱300 off their first booking — you get ₱500 once they ride.`,
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
    subject: `Your ${BRAND} referral reward is on its way`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      `Your friend just completed their booking — thank you! Your reward is approved and we'll be in touch to send it.`,
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
