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
  referralCode: string | null;
  businessWhatsApp: string;
  siteUrl: string;
}

export interface RenderedMessage {
  subject: string;
  body: string;
}

const BRAND = 'EasyRideCebu';

function signOff(ctx: TemplateContext): string {
  return `— The ${BRAND} team\nWhatsApp: +${ctx.businessWhatsApp}\n${ctx.siteUrl}`;
}

function tripLine(ctx: TemplateContext): string {
  const parts = [ctx.serviceLabel];
  if (ctx.vehicleLabel) parts.push(ctx.vehicleLabel);
  if (ctx.preferredDate) parts.push(`on ${ctx.preferredDate}`);
  return parts.join(' · ');
}

const TEMPLATES: Record<TemplateKey, (ctx: TemplateContext) => RenderedMessage> = {
  instant_ack: (ctx) => ({
    subject: `We got your inquiry, ${ctx.name}!`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      `Thanks for reaching out to ${BRAND} — we have your request for ${tripLine(ctx)}.`,
      ``,
      `One of our team is checking availability right now and will message you within the hour during business hours (Mon–Sat 8AM–8PM, Sun 9AM–6PM).`,
      ``,
      `Need us faster? Message us on WhatsApp: https://wa.me/${ctx.businessWhatsApp}`,
      ``,
      signOff(ctx),
    ].join('\n'),
  }),

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
      `Are the dates still ${ctx.preferredDate ?? 'flexible'}? Reply here and we'll lock in a vehicle for you.`,
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
      `  Total: PHP ${ctx.monetaryValue}`,
      ``,
      `Includes an air-conditioned vehicle, fuel and hotel/airport pickup. Entrance fees, parking and meals are billed separately.`,
      ``,
      `To confirm, reply to this email or message us on WhatsApp: https://wa.me/${ctx.businessWhatsApp}`,
      ``,
      signOff(ctx),
    ].join('\n'),
  }),

  quote_reminder: (ctx) => ({
    subject: `Still holding your ${ctx.preferredDate ?? 'preferred'} slot`,
    body: [
      `Hi ${ctx.name}, just checking in on the quote we sent for ${tripLine(ctx)}.`,
      `We can still hold the vehicle, but ${ctx.preferredDate ?? 'that date'} books out fast. Want us to reserve it?`,
    ].join('\n'),
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

  booking_confirmation: (ctx) => ({
    subject: `Booking confirmed — ${tripLine(ctx)}`,
    body: [
      `Hi ${ctx.name},`,
      ``,
      `You're booked! Here are your details:`,
      ``,
      `  Service: ${ctx.serviceLabel}`,
      ctx.vehicleLabel ? `  Vehicle: ${ctx.vehicleLabel}` : '',
      ctx.preferredDate ? `  Date:    ${ctx.preferredDate}` : '',
      ctx.tourTitle ? `  Tour:    ${ctx.tourTitle}` : '',
      `  Total:   PHP ${ctx.monetaryValue}`,
      ``,
      `We'll send your driver's details the day before. Any changes, message us any time.`,
      ``,
      signOff(ctx),
    ]
      .filter(Boolean)
      .join('\n'),
  }),

  trip_reminder: (ctx) => ({
    subject: `See you tomorrow, ${ctx.name}!`,
    body: [
      `Hi ${ctx.name}, your ${ctx.serviceLabel} with ${BRAND} is tomorrow${
        ctx.preferredDate ? ` (${ctx.preferredDate})` : ''
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
