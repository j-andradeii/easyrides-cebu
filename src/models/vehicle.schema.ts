/**
 * Vehicle contracts — what the portal may save into the public fleet.
 *
 * Shared by the admin form (via zodResolver) and the API routes, so a field the
 * browser accepts is exactly a field the server accepts — the same arrangement
 * `tour.schema` has.
 *
 * Everything here is plain text or a number: a vehicle card carries no
 * rich text, so there is nothing to sanitise on the way in.
 */

import { z } from 'zod';

export const VEHICLE_TYPE_MAX = 60;
export const VEHICLE_MODELS_MAX = 160;
export const VEHICLE_CAPACITY_MAX = 40;
export const VEHICLE_FEATURE_MAX = 80;
/** More than this stops being a feature list and starts being a paragraph. */
export const VEHICLE_FEATURE_COUNT_MAX = 12;

const trimmed = (max: number) => z.string().trim().max(max);

/** A stored image URL — our blob host or any absolute https URL. */
const imageUrl = z
  .string()
  .trim()
  .min(1, 'Upload an image')
  .max(1000)
  .url('That does not look like an image URL');

export const vehicleInputSchema = z.object({
  type: trimmed(VEHICLE_TYPE_MAX).min(2, 'Name the vehicle class, e.g. Sedan'),
  models: trimmed(VEHICLE_MODELS_MAX).min(2, 'List the models, e.g. Vios / Mirage G4 (AT)'),
  capacity: trimmed(VEHICLE_CAPACITY_MAX).min(1, 'e.g. 5-seater'),
  rate: z.coerce
    .number({ message: 'Enter the daily rate' })
    .int('Use whole pesos')
    .min(0, 'Rate cannot be negative')
    .max(10_000_000, 'That rate looks wrong'),
  features: z
    .array(trimmed(VEHICLE_FEATURE_MAX).min(1))
    .max(VEHICLE_FEATURE_COUNT_MAX)
    .default([])
    .refine((items) => items.length > 0, { message: 'Add at least one feature' }),
  image: imageUrl,
  /** Only one card should wear the ribbon, but that is an editorial call. */
  popular: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
});

/** PATCH sends only what changed — the table's publish/popular toggles use this. */
export const vehiclePatchSchema = vehicleInputSchema.partial();

export type VehicleInput = z.infer<typeof vehicleInputSchema>;
export type VehiclePatch = z.infer<typeof vehiclePatchSchema>;

/**
 * The form's own value type — the same fields the payload has.
 *
 * It is named separately because the form briefly holds shapes the payload
 * cannot: an empty rate box is `''`, not 0, so a cleared price asks for a rate
 * instead of publishing a free vehicle. `VehicleForm` casts at that one spot
 * and `pruneBlanks` turns it back into "missing" before the schema runs.
 */
export type VehicleFormValues = VehicleInput;
