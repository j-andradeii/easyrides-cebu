/**
 * The referral offer — plan §7A.3.
 *
 * Double-sided ("give ₱300, get ₱500") because rewarding both parties is the
 * single change that multiplies referral rates. Kept in one place so the
 * landing page, the share hub, the payout screen and W5 all promise the same
 * thing.
 */

/** Stored on `referrals.referrer_reward` / `referee_reward`. */
export const REFERRER_REWARD = 'gcash_500';
export const REFEREE_REWARD = 'discount_300';

/** What customers actually read. */
export const REFERRER_REWARD_LABEL = '₱500 once your friend rides';
export const REFEREE_REWARD_LABEL = '₱300 off your first booking';

/** §7A.3 anti-abuse: rewards one referrer can earn in a rolling 30 days. */
export const REFERRAL_MONTHLY_CAP = 5;

const REWARD_LABELS: Record<string, string> = {
  [REFERRER_REWARD]: '₱500 GCash',
  [REFEREE_REWARD]: '₱300 discount',
};

export function rewardLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return REWARD_LABELS[value] ?? value;
}
