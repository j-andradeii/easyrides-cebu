/**
 * Normalization and label helpers shared by intake, the workflow engine and the
 * portal UI.
 *
 * Dedup only works if everyone writes phones and emails the same way, so all
 * writes go through here (plan §5 "Dedup rule").
 *
 * Deliberately free of Node built-ins so client components can import the label
 * helpers — code/token generation lives in ./tokens.ts instead.
 */

/**
 * Best-effort E.164. The forms submit `${countryCode}${nationalNumber}`, where
 * the national part may carry spaces and sometimes a trunk "0" (0917…), so we
 * strip formatting and drop the trunk prefix that would otherwise create a
 * second contact for the same person.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  let digits = input.replace(/\D/g, '');
  if (!digits) return null;

  // "+63" + "0917…" → "+63917…"
  const trunkPrefixes = ['63', '1', '44', '61', '65', '81', '82', '86', '91', '60', '66', '84', '62'];
  for (const cc of trunkPrefixes) {
    if (digits.startsWith(`${cc}0`) && digits.length > cc.length + 1) {
      digits = cc + digits.slice(cc.length + 1);
      break;
    }
  }

  return digits.length >= 8 ? `+${digits}` : null;
}

/** Lower-cased and trimmed — we store emails case-insensitively without CITEXT. */
export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * The forms send `Date.toISOString()`; the `preferred_date` column is a DATE.
 * Returns 'YYYY-MM-DD', or null for anything unparseable.
 */
export function toDateOnly(input: string | Date | null | undefined): string | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

const SERVICE_LABELS: Record<string, string> = {
  'car-rental': 'Car Rental',
  'airport-transfer': 'Airport Transfer',
  tour: 'Tour Package',
  custom: 'Custom Tour / Other',
};

const VEHICLE_LABELS: Record<string, string> = {
  sedan: 'Sedan (5-seater)',
  suv: 'SUV (7-seater)',
  van: 'Van (15-seater)',
};

const SOURCE_LABELS: Record<string, string> = {
  // Written by the public forms.
  'hero-quick-form': 'Hero quick form',
  'contact-form': 'Contact form',
  'tour-inquiry': 'Tour page',
  'vehicle-inquiry': 'Fleet page',
  referral: 'Referral link',
  // Written by an agent on /admin/inquiries — see ADMIN_LEAD_SOURCES.
  'walk-in': 'Walk-in',
  'phone-call': 'Phone call',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  'repeat-customer': 'Repeat customer',
  other: 'Other',
};

export function serviceLabel(value: string | null | undefined): string {
  if (!value) return 'Inquiry';
  return SERVICE_LABELS[value] ?? value;
}

export function vehicleLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return VEHICLE_LABELS[value] ?? value;
}

export function sourceLabel(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  return SOURCE_LABELS[value] ?? value;
}

/** "Tour Package — Juan dela Cruz" */
export function buildOpportunityTitle(
  serviceType: string | null | undefined,
  fullName: string | null | undefined,
  phone: string | null | undefined
): string {
  const who = fullName?.trim() || phone || 'Unknown contact';
  return `${serviceLabel(serviceType)} — ${who}`;
}

/** First name only, for message templates. */
export function firstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0];
}

/** Truncates free text before it goes on the timeline. */
export function truncate(value: string, max = 400): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
