/**
 * Intake contract for POST /api/inquiries.
 *
 * A superset of `bookingSubmissionSchema` — the three public forms already post
 * this shape (plan §8.1), plus optional referral/UTM attribution and a honeypot.
 */

import { z } from 'zod';
import { FORM_CONST } from '@/core/constants';
import { SLUG_MAX_LENGTH } from '@/lib/slug';

export const SERVICE_TYPES = ['car-rental', 'airport-transfer', 'tour', 'custom'] as const;
export const VEHICLE_TYPES = ['sedan', 'suv', 'van'] as const;

/**
 * The fixed sources the site's own forms write.
 *
 * Not exhaustive of what ends up in the column: a promo page writes
 * `campaign:<slug>`, which is open-ended by design — one value per campaign is
 * what makes the existing source filter on /admin/inquiries able to answer
 * "how did that Facebook post do?" with no new filter. `sourceLabel` renders
 * those; `CAMPAIGN_SOURCE_PREFIX` below is the one place the shape is defined.
 */
export const INQUIRY_SOURCES = [
  'hero-quick-form',
  'contact-form',
  'tour-inquiry',
  'vehicle-inquiry',
  'referral',
] as const;

/** `campaign:summer-oslob-2026` — see the note above. */
export const CAMPAIGN_SOURCE_PREFIX = 'campaign:';

export function campaignSource(slug: string): string {
  return `${CAMPAIGN_SOURCE_PREFIX}${slug}`;
}

export const utmSchema = z
  .object({
    source: z.string().max(120).optional(),
    medium: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    term: z.string().max(120).optional(),
    content: z.string().max(120).optional(),
  })
  .partial();

export const inquirySubmissionSchema = z.object({
  // --- Required ---
  phone: z
    .string()
    .min(FORM_CONST.PHONE_MIN_LENGTH, 'Please enter a valid phone number')
    .max(FORM_CONST.PHONE_MAX_LENGTH + 8, 'Please enter a valid phone number'),
  source: z.string().min(1).max(60),

  // --- Optional, depending on which form was used ---
  fullName: z.string().max(FORM_CONST.NAME_MAX_LENGTH).optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  countryCode: z.string().max(8).optional(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  vehicleType: z.enum(VEHICLE_TYPES).optional(),
  /** ISO string from the form's date picker. */
  preferredDate: z.string().max(40).optional(),
  message: z.string().max(FORM_CONST.MESSAGE_MAX_LENGTH).optional(),
  addDriver: z.boolean().optional(),
  tourTitle: z.string().max(200).optional(),
  /**
   * The exact vehicle a /fleet/[slug] visitor was looking at — "Vios / Mirage
   * G4 (AT)". `vehicleType` above is only the sedan/suv/van bucket, and the
   * fleet carries several cars per bucket.
   */
  vehicleName: z.string().max(200).optional(),
  /**
   * How many days they want the car for. Capped at a year: anything longer is
   * a lease negotiated by hand, not a booking this form should take.
   */
  rentalDays: z.coerce.number().int().min(1).max(365).optional(),
  /**
   * Where the car or the driver should meet them — "Mactan Airport T2",
   * "Radisson Blu", a plain address. Free text, because half of these are
   * landmarks no dropdown would carry.
   */
  pickupLocation: z.string().max(200).optional(),

  // --- Attribution (§7A) ---
  /** Set when the visitor arrived through /r/[code]. */
  referralCode: z.string().max(40).optional(),
  /**
   * The promo page this was submitted from — the /promo/[slug] segment.
   *
   * Trusted only as far as it resolves: intake looks the slug up and attributes
   * to the row it finds, so a made-up value simply attributes to nothing rather
   * than inventing a campaign.
   */
  campaignSlug: z.string().max(SLUG_MAX_LENGTH).optional(),
  utm: utmSchema.optional(),

  // --- Anti-spam (§15) ---
  /**
   * Honeypot: real users never see this field, so any value means a bot.
   * Deliberately permissive here — the route accepts the submission and
   * silently discards it, so a bot cannot tell the trap apart from success.
   */
  website: z.string().max(200).optional(),
});

export type InquirySubmissionData = z.infer<typeof inquirySubmissionSchema>;

/** What the public forms get back — unchanged from the Sheets era. */
export interface InquirySubmissionResponse {
  success: boolean;
  message: string;
  inquiryId?: string;
}

/**
 * Where a hand-entered lead came from — the walk-ins and phone calls that never
 * touch a website form (plan §10.2).
 *
 * Deliberately disjoint from INQUIRY_SOURCES: those four values are written
 * only by the public forms, and keeping the two sets separate is what lets the
 * funnel report tell "the website produced this" apart from "an agent typed
 * this in". The source filter on /admin/inquiries reads whatever is in the
 * column, so both sets show up there without extra work.
 */
export const ADMIN_LEAD_SOURCES = [
  'walk-in',
  'phone-call',
  'whatsapp',
  'facebook',
  'instagram',
  'repeat-customer',
  'other',
] as const;

export type AdminLeadSource = (typeof ADMIN_LEAD_SOURCES)[number];

/**
 * Contract for POST /api/admin/inquiries — an agent creating a lead by hand.
 *
 * Reuses the public shape so both paths land in `createInquiry` and produce
 * identical records. Three fields are dropped rather than made optional:
 * `website` is the bot honeypot (meaningless behind an auth cookie), while
 * `utm` and `campaignSlug` are set by the browser on a real form — accepting
 * either here would let hand entry fake campaign attribution, and the whole
 * point of the campaign numbers is that they were earned by the link.
 */
export const adminLeadSchema = inquirySubmissionSchema
  .omit({ website: true, utm: true, campaignSlug: true })
  .extend({
    source: z.enum(ADMIN_LEAD_SOURCES),
  });

export type AdminLeadData = z.infer<typeof adminLeadSchema>;

/** What the portal gets back after creating a lead by hand. */
export interface AdminLeadCreateResponse {
  success: true;
  opportunityId: string;
  contactId: string;
  inquiryId: string;
  /** True when the phone/email matched a contact we already had. */
  isReturningCustomer: boolean;
}
