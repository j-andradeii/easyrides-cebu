/**
 * Referral credits — money off a customer's next booking. SERVER ONLY.
 *
 * The lifecycle, and why it has four steps rather than one:
 *
 *   issue   — a referral is approved, so the referrer earns ₱500 (`available`)
 *   apply   — an agent puts it on a quote (`applied`); it is now reserved and
 *             will not be offered on a second quote at the same time
 *   redeem  — the customer accepts that quote (`redeemed`); spent for good
 *   release — that quote is declined, cancelled or lapses, so the credit goes
 *             back to `available` and the customer keeps what they earned
 *
 * Collapsing apply and redeem into one step is the tempting shortcut and it is
 * wrong in both directions: mark it spent at quote time and a customer who
 * declines has silently lost ₱500; leave it available at quote time and two
 * live quotes can each discount the same ₱500, which the business pays for.
 *
 * Every mutation here is idempotent on status, so a double-clicked button or a
 * retried webhook cannot pay the same credit out twice.
 */

import 'server-only';

import { and, desc, eq, gt, inArray, isNull, lt, or } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import { referralCredits, type ReferralCredit } from '@/db/schema';
import type { CreditRecord } from '@/models/crm.types';

/** How long an earned credit stays spendable. */
export const CREDIT_VALID_DAYS = 365;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toCreditRecord(row: ReferralCredit): CreditRecord {
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    reason: row.reason,
    quoteId: row.quoteId,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    redeemedAt: row.redeemedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// --- Issue ------------------------------------------------------------------

export interface IssueCreditInput {
  contactId: string;
  amount: number;
  reason: string;
  /** The referral that earned it. Omit for a goodwill credit. */
  referralId?: string | null;
  /** The admin who approved it; null when an automation did. */
  issuedBy?: string | null;
  /** Defaults to `CREDIT_VALID_DAYS` from now. Pass null for "never lapses". */
  validForDays?: number | null;
}

/**
 * Grants a credit.
 *
 * When a `referralId` is given this is a no-op the second time it runs: the
 * partial unique index on `referral_id` means one referral can only ever fund
 * one credit, and `onConflictDoNothing` turns the race into silence rather than
 * a 500 on an admin's second click.
 */
export async function issueCredit(
  input: IssueCreditInput,
  executor: DbExecutor = db
): Promise<CreditRecord | null> {
  const validForDays = input.validForDays === undefined ? CREDIT_VALID_DAYS : input.validForDays;

  const [row] = await executor
    .insert(referralCredits)
    .values({
      contactId: input.contactId,
      referralId: input.referralId ?? null,
      amount: round2(input.amount).toFixed(2),
      reason: input.reason,
      issuedBy: input.issuedBy ?? null,
      expiresAt: validForDays === null ? null : new Date(Date.now() + validForDays * 86_400_000),
    })
    .onConflictDoNothing()
    .returning();

  return row ? toCreditRecord(row) : null;
}

// --- Read -------------------------------------------------------------------

/**
 * Every credit this contact has ever had — the lead screen's ledger, and what
 * the quote builder picks its `available` rows out of.
 *
 * Lapsed credits are swept to `expired` first rather than merely filtered out
 * at the call site. `applyCreditsToQuote` refuses an expired credit, so a stale
 * `available` row would be offered to the agent, ticked by default, and then
 * silently not applied — which is worse than never showing it, because the
 * agent has already told the customer about it.
 */
export async function listCreditsForContact(
  contactId: string,
  executor: DbExecutor = db
): Promise<CreditRecord[]> {
  await expireLapsedCredits(executor);

  const rows = await executor
    .select()
    .from(referralCredits)
    .where(eq(referralCredits.contactId, contactId))
    .orderBy(desc(referralCredits.createdAt));

  return rows.map(toCreditRecord);
}

/** The spendable total, as a number the quote builder can subtract. */
export function creditTotal(credits: CreditRecord[]): number {
  return round2(credits.reduce((sum, credit) => sum + Number(credit.amount), 0));
}

// --- Apply / redeem / release ----------------------------------------------

/**
 * Reserves credits against a quote and returns what they are worth.
 *
 * The `available` check is inside the UPDATE, not a read before it: two agents
 * quoting the same customer at the same moment would both pass a prior read,
 * and only one of them can have the money. Whatever the statement actually
 * updated is what got reserved, so the caller discounts by the returned figure
 * rather than by what it asked for.
 */
export async function applyCreditsToQuote(
  params: { contactId: string; creditIds: string[]; quoteId: string },
  executor: DbExecutor = db
): Promise<{ applied: CreditRecord[]; amount: number }> {
  if (params.creditIds.length === 0) return { applied: [], amount: 0 };

  const now = new Date();
  // A credit that lapsed between the page load and the save is not spendable.
  const stillValid = or(
    isNull(referralCredits.expiresAt),
    gt(referralCredits.expiresAt, now)
  );

  const rows = await executor
    .update(referralCredits)
    .set({ status: 'applied', quoteId: params.quoteId, appliedAt: now, updatedAt: now })
    .where(
      and(
        inArray(referralCredits.id, params.creditIds),
        eq(referralCredits.contactId, params.contactId),
        eq(referralCredits.status, 'available'),
        stillValid
      )
    )
    .returning();

  const applied = rows.map(toCreditRecord);
  return { applied, amount: creditTotal(applied) };
}

/**
 * Spends every credit riding on a quote — call when the customer accepts it.
 */
export async function redeemCreditsForQuote(
  quoteId: string,
  executor: DbExecutor = db
): Promise<number> {
  const now = new Date();
  const rows = await executor
    .update(referralCredits)
    .set({ status: 'redeemed', redeemedAt: now, updatedAt: now })
    .where(and(eq(referralCredits.quoteId, quoteId), eq(referralCredits.status, 'applied')))
    .returning();

  return rows.length;
}

/**
 * Hands the credits back — call when a quote is declined, cancelled or expires.
 *
 * Only `applied` rows are touched, so releasing a quote whose credits were
 * already redeemed cannot resurrect spent money.
 */
export async function releaseCreditsForQuote(
  quoteId: string,
  executor: DbExecutor = db
): Promise<number> {
  const rows = await executor
    .update(referralCredits)
    .set({ status: 'available', quoteId: null, appliedAt: null, updatedAt: new Date() })
    .where(and(eq(referralCredits.quoteId, quoteId), eq(referralCredits.status, 'applied')))
    .returning();

  return rows.length;
}

/** Same, for a batch of quotes — the cron sweep that expires stale quotes. */
export async function releaseCreditsForQuotes(
  quoteIds: string[],
  executor: DbExecutor = db
): Promise<number> {
  if (quoteIds.length === 0) return 0;

  const rows = await executor
    .update(referralCredits)
    .set({ status: 'available', quoteId: null, appliedAt: null, updatedAt: new Date() })
    .where(
      and(inArray(referralCredits.quoteId, quoteIds), eq(referralCredits.status, 'applied'))
    )
    .returning();

  return rows.length;
}

/**
 * Cancels the credit a referral funded — the anti-abuse counterpart to
 * `issueCredit`.
 *
 * Called when a referral is voided, whether by W5's guardrails (self-referral,
 * monthly cap) or by an admin. Without it a self-referral caught at conversion
 * would still leave the ₱300 the friend was issued at sign-up sitting on their
 * contact, which is exactly the money the guardrail exists to stop.
 *
 * `redeemed` rows are deliberately untouched: that money is already spent on a
 * booking the customer accepted, and clawing it back would mean re-pricing a
 * confirmed reservation. Voiding after the fact is a conversation, not a
 * database update.
 */
export async function voidCreditsForReferral(
  referralId: string,
  executor: DbExecutor = db
): Promise<number> {
  const rows = await executor
    .update(referralCredits)
    .set({ status: 'void', quoteId: null, appliedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(referralCredits.referralId, referralId),
        inArray(referralCredits.status, ['available', 'applied'])
      )
    )
    .returning({ id: referralCredits.id });

  return rows.length;
}

/** Sweeps lapsed credits. Cheap enough to run before every spendable read. */
export async function expireLapsedCredits(executor: DbExecutor = db): Promise<number> {
  const rows = await executor
    .update(referralCredits)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(referralCredits.status, 'available'),
        lt(referralCredits.expiresAt, new Date())
      )
    )
    .returning({ id: referralCredits.id });

  return rows.length;
}
