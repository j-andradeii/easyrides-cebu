/**
 * Tour contracts — what the portal may save into the public catalogue.
 *
 * Shared by the admin form (via zodResolver) and the API routes, so a field the
 * browser accepts is exactly a field the server accepts.
 *
 * The description arrives as HTML from the rich-text editor. Length is measured
 * on its *text*, not its markup — `<p><strong></strong></p>` is not a
 * description — and the server sanitises it before storing (see
 * `sanitizeRichText`).
 */

import { z } from 'zod';

import { richTextToPlainText } from '@/lib/rich-text';
import { SLUG_MAX_LENGTH } from '@/lib/slug';

export const TOUR_TITLE_MAX = 120;
export const TOUR_SHORT_DESCRIPTION_MAX = 300;
export const TOUR_DESCRIPTION_MAX = 20_000;
/** Guests can only look at so many photos; keeps a page's payload sane too. */
export const TOUR_GALLERY_MAX = 24;
export const TOUR_LIST_ITEM_MAX = 60;

/** What the file picker offers for a banner or gallery image. */
export const TOUR_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/*';

/**
 * Per-image upload ceiling. The browser re-encodes to WebP first, so a real
 * photo lands far below this — the limit exists to keep an unoptimised original
 * inside the serverless request body cap (~4.5 MB).
 */
export const TOUR_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

const trimmed = (max: number) => z.string().trim().max(max);

/** A stored image URL — our blob host or any absolute https URL. */
const imageUrl = z
  .string()
  .trim()
  .min(1, 'Upload an image')
  .max(1000)
  .url('That does not look like an image URL');

export const tourPricingSchema = z.object({
  price: z.coerce
    .number({ message: 'Enter a price' })
    .int('Use whole pesos')
    .min(0, 'Price cannot be negative')
    .max(10_000_000, 'That price looks wrong'),
  capacity: trimmed(60).min(1, 'Add the passenger capacity, e.g. 1-3 pax'),
});

export const tourPricingOptionsSchema = z.object({
  sedan: tourPricingSchema,
  suv: tourPricingSchema,
  van: tourPricingSchema,
});

export const itineraryItemSchema = z.object({
  /** Free text ("8:00 AM") — only the first stop usually carries one. */
  time: trimmed(40).optional(),
  activity: trimmed(300).min(1, 'Describe the stop'),
});

export const tourInputSchema = z.object({
  title: trimmed(TOUR_TITLE_MAX).min(3, 'Give the tour a name'),
  /**
   * Optional: left out (or blank) the server derives it from the title. Either
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
  shortDescription: trimmed(TOUR_SHORT_DESCRIPTION_MAX).min(
    20,
    'Write at least a sentence — this is the card blurb and the meta description'
  ),
  description: z
    .string()
    .max(TOUR_DESCRIPTION_MAX)
    .refine((html) => richTextToPlainText(html).length >= 40, {
      message: 'Describe the tour in a few sentences',
    }),
  image: imageUrl,
  gallery: z.array(imageUrl).max(TOUR_GALLERY_MAX).default([]),
  duration: trimmed(60).min(1, 'e.g. 8 hours, Full Day'),
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  pricing: tourPricingOptionsSchema,
  itinerary: z.array(itineraryItemSchema).min(1, 'Add at least one stop').max(80),
  inclusions: z
    .array(trimmed(200).min(1))
    .max(TOUR_LIST_ITEM_MAX)
    .default([])
    .refine((items) => items.length > 0, { message: 'List what the guest gets' }),
  exclusions: z.array(trimmed(200).min(1)).max(TOUR_LIST_ITEM_MAX).default([]),
});

/** PATCH sends only what changed — the table's publish/feature toggles use this. */
export const tourPatchSchema = tourInputSchema.partial();

export type TourInput = z.infer<typeof tourInputSchema>;
export type TourPatch = z.infer<typeof tourPatchSchema>;

/** The form's own value type: identical to the payload, minus the optional slug. */
export type TourFormValues = Omit<TourInput, 'slug'> & { slug: string };
