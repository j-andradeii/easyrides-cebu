/**
 * Campaign contracts — what the portal may publish as a /promo/[slug] page.
 *
 * Shared by the admin form (via zodResolver) and the API routes, so a field the
 * browser accepts is exactly a field the server accepts — the arrangement
 * `tour.schema` and `vehicle.schema` already keep.
 *
 * The description arrives as HTML from the rich-text editor and the server
 * sanitises it before storing (`sanitizeRichText`). Unlike a tour's, it is
 * optional: plenty of promos are a banner, one line and a form, and forcing
 * four paragraphs out of an owner who wanted to post something today is how a
 * campaign tool goes unused.
 */

import { z } from 'zod';

import { richTextToPlainText } from '@/lib/rich-text';
import { SLUG_MAX_LENGTH } from '@/lib/slug';
import { SERVICE_TYPES, VEHICLE_TYPES } from '@/models/inquiry.schema';

export const CAMPAIGN_NAME_MAX = 120;
/**
 * The og:description ceiling. Facebook and Google both truncate around 160
 * characters, so anything past 200 is text nobody will ever read in a preview.
 */
export const CAMPAIGN_SHORT_DESCRIPTION_MAX = 200;
export const CAMPAIGN_DESCRIPTION_MAX = 20_000;
export const CAMPAIGN_CTA_MAX = 40;

/**
 * The smallest banner worth publishing, and the shape every social preview
 * crops to.
 *
 * 1200 × 630 is the size Facebook, LinkedIn and X all render as a full-width
 * link card. Below 600 × 315 Facebook drops to a small square thumbnail beside
 * the text instead, so anything under this is a promo that looks broken in the
 * one place it is meant to be seen. It is a floor, not a target — a larger
 * image at the same 1.91:1 shape is better, and is what the upload field asks
 * for.
 */
export const CAMPAIGN_BANNER_MIN_WIDTH = 1200;
export const CAMPAIGN_BANNER_MIN_HEIGHT = 630;

/** The floor as an admin reads it. Shown as a hint on the upload field. */
export const CAMPAIGN_BANNER_RATIO = `${CAMPAIGN_BANNER_MIN_WIDTH} × ${CAMPAIGN_BANNER_MIN_HEIGHT}`;

const trimmed = (max: number) => z.string().trim().max(max);

/** A stored image URL — our blob host or any absolute https URL. */
const imageUrl = z
  .string()
  .trim()
  .min(1, 'Upload a banner')
  .max(1000)
  .url('That does not look like an image URL');

/**
 * An optional dropdown: the form sends `''` for "let the visitor choose", which
 * has to become `null` rather than fail the enum.
 */
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal('')])
    .optional()
    .transform((value) => (value ? value : null));

export const campaignInputSchema = z.object({
  name: trimmed(CAMPAIGN_NAME_MAX).min(3, 'Give the promo a name'),
  /**
   * Optional: left out (or blank) the server derives it from the name. Either
   * way it is de-duplicated before saving, so this is a preference, not a claim.
   */
  slug: z
    .union([
      z
        .string()
        .trim()
        .max(SLUG_MAX_LENGTH)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
      z.literal(''),
    ])
    .optional(),
  shortDescription: trimmed(CAMPAIGN_SHORT_DESCRIPTION_MAX).min(
    20,
    'Write one line — this is what shows under the banner when the link is shared'
  ),
  description: z
    .string()
    .max(CAMPAIGN_DESCRIPTION_MAX)
    .default('')
    // Only the *emptiness* is checked, not a minimum length: an editor who
    // types two words meant to type two words.
    .refine((html) => richTextToPlainText(html).length <= CAMPAIGN_DESCRIPTION_MAX, {
      message: 'That is longer than a promo page should be',
    }),
  bannerImage: imageUrl,
  ctaLabel: trimmed(CAMPAIGN_CTA_MAX).min(2, 'What should the button say?').default('Send Inquiry'),
  serviceType: optionalEnum(SERVICE_TYPES),
  vehicleType: optionalEnum(VEHICLE_TYPES),
  isPublished: z.boolean().default(true),
  /**
   * ISO string from the form's date picker, or `''` for "runs until I stop it".
   * Stored as an instant rather than a date so "ends 30 April" means the end of
   * the 30th to a visitor in Cebu, not midnight UTC — the picker sends the
   * browser's own end-of-day.
   */
  endsAt: z
    .union([z.string().datetime({ offset: true }), z.string().datetime(), z.literal('')])
    .optional()
    .transform((value) => (value ? value : null)),
});

/** PATCH sends only what changed — the table's publish toggle uses this. */
export const campaignPatchSchema = campaignInputSchema.partial();

export type CampaignInput = z.infer<typeof campaignInputSchema>;
export type CampaignPatch = z.infer<typeof campaignPatchSchema>;

/**
 * The form's own value type.
 *
 * Three fields are narrower here than in the payload because the inputs always
 * hold a string while they are being edited, even where sending one is
 * optional: the slug box, the two dropdowns (`''` is "any") and the end date.
 */
export type CampaignFormValues = Omit<
  CampaignInput,
  'slug' | 'serviceType' | 'vehicleType' | 'endsAt'
> & {
  slug: string;
  serviceType: string;
  vehicleType: string;
  endsAt: Date | null;
};
