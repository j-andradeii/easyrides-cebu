/**
 * PATCH /api/admin/referrals/[id] — approve or void a reward payout (§7A.8).
 *
 * W5 only *assigns* rewards; nothing is granted without a human approving it
 * here. That is the last of the §7A.3 anti-abuse guardrails.
 *
 * Approving is what turns the referrer's promised reward into a real ₱500
 * booking credit on their contact, ready for the next quote an agent builds
 * them. Before this existed, "approved" only meant a status change and someone
 * was expected to remember the discount months later.
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { contacts, opportunities, referrals } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { issueCredit, voidCreditsForReferral } from '@/lib/crm/credits';
import { buildTemplateContext, logActivity } from '@/lib/crm/repository';
import {
  REFEREE_REWARD,
  REFERRER_CREDIT_AMOUNT,
  REFERRER_REWARD,
  REFERRER_REWARD_LABEL,
} from '@/lib/crm/rewards';
import { deliverMessage } from '@/lib/messaging';
import { recalculateLifetimeValue } from '@/lib/workflows/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  action: z.enum(['approve', 'void']),
  reason: z.string().max(300).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError('Choose approve or void', 400);
    }

    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
    if (!referral) {
      throw new AdminRouteError('Referral not found', 404);
    }

    if (parsed.data.action === 'void') {
      await db
        .update(referrals)
        .set({ status: 'void', abuseFlag: parsed.data.reason ?? 'Voided by admin' })
        .where(eq(referrals.id, id));

      // Whatever this referral put on the table comes back off it. Already-
      // redeemed credits are left alone — see `voidCreditsForReferral`.
      const voided = await voidCreditsForReferral(referral.id);

      await logActivity({
        opportunityId: referral.refereeOpportunityId,
        contactId: referral.referrerContactId,
        adminUserId: admin.id,
        type: 'note',
        subject: 'Referral reward voided',
        body: [
          parsed.data.reason ?? null,
          voided > 0
            ? `${voided} unspent credit${voided === 1 ? '' : 's'} cancelled.`
            : null,
        ]
          .filter(Boolean)
          .join('\n') || null,
        metadata: { referralId: referral.id, creditsVoided: voided },
      });

      return { success: true as const };
    }

    // §7A.3 rule 6 — pay on conversion only.
    if (referral.status !== 'booked') {
      throw new AdminRouteError(
        'This referral has not converted yet — rewards unlock once the friend books.',
        400
      );
    }

    await db
      .update(referrals)
      .set({
        status: 'rewarded',
        rewardPaidAt: new Date(),
        referrerReward: referral.referrerReward ?? REFERRER_REWARD,
        refereeReward: referral.refereeReward ?? REFEREE_REWARD,
      })
      .where(eq(referrals.id, id));

    /**
     * The reward itself. `issueCredit` is a no-op on the second call — one
     * referral can only ever fund one credit (partial unique index on
     * `referral_id`), so a double-clicked Approve cannot pay twice.
     */
    const credit = await issueCredit({
      contactId: referral.referrerContactId,
      referralId: referral.id,
      amount: REFERRER_CREDIT_AMOUNT,
      reason: REFERRER_REWARD_LABEL,
      issuedBy: admin.id,
    });

    await logActivity({
      opportunityId: referral.refereeOpportunityId,
      contactId: referral.referrerContactId,
      adminUserId: admin.id,
      type: 'note',
      subject: credit
        ? `Referral approved — ₱${REFERRER_CREDIT_AMOUNT} credit issued`
        : 'Referral reward approved (credit already issued)',
      body: credit
        ? 'Applies automatically on their next quote, and expires in a year.'
        : null,
      metadata: { referralId: referral.id, creditId: credit?.id ?? null },
    });

    // Tell the referrer the good news.
    const [referrer] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, referral.referrerContactId))
      .limit(1);

    if (referrer && referral.refereeOpportunityId) {
      const [opportunity] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, referral.refereeOpportunityId))
        .limit(1);

      if (opportunity) {
        const templateContext = await buildTemplateContext(opportunity, referrer);
        await deliverMessage({
          channel: 'email',
          template: 'referral_reward_issued',
          context: templateContext,
          audience: 'customer',
        }).catch((error) => console.error('[referrals] reward notice failed:', error));
      }
    }

    await recalculateLifetimeValue(referral.referrerContactId);

    return { success: true as const };
  });
}
