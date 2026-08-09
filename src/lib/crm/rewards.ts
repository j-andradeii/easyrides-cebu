/**
 * The referral offer — plan §7A.3.
 *
 * Double-sided ("give ₱300, get ₱500") because rewarding both parties is the
 * single change that multiplies referral rates. Kept in one place so the
 * landing page, the share hub, the payout screen and W5 all promise the same
 * thing.
 *
 * The referrer's side is a **booking credit**, not a cash payout. Two reasons:
 * the money stays in the business, and a credit is a thing the CRM can actually
 * enforce — an approved referral writes a row in `referral_credits`, the quote
 * builder offers it, and an accepted quote spends it. A promise of ₱500 GCash
 * is a promise someone has to remember to keep; see `lib/crm/credits.ts`.
 */

/** Stored on `referrals.referrer_reward` / `referee_reward`. */
export const REFERRER_REWARD = 'credit_500';
export const REFEREE_REWARD = 'discount_300';

/** Pesos issued to the referrer when a referral is approved. */
export const REFERRER_CREDIT_AMOUNT = 500;
/** Pesos the referred friend gets off their first booking. */
export const REFEREE_CREDIT_AMOUNT = 300;

/** What customers actually read. */
export const REFERRER_REWARD_LABEL = '₱500 off your next booking';
export const REFEREE_REWARD_LABEL = '₱300 off your first booking';

/** §7A.3 anti-abuse: rewards one referrer can earn in a rolling 30 days. */
export const REFERRAL_MONTHLY_CAP = 5;

const REWARD_LABELS: Record<string, string> = {
  [REFERRER_REWARD]: '₱500 booking credit',
  [REFEREE_REWARD]: '₱300 discount',
  // Referrals approved before the reward became a credit. Kept so their rows
  // keep reading correctly rather than falling through to the raw key.
  gcash_500: '₱500 GCash (legacy)',
};

export function rewardLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return REWARD_LABELS[value] ?? value;
}
