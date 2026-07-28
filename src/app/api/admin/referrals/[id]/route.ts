/**
 * PATCH /api/admin/referrals/[id] — approve or void a reward payout (§7A.8).
 *
 * W5 only *assigns* rewards; money never moves without a human approving it
 * here. That is the last of the §7A.3 anti-abuse guardrails.
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { contacts, opportunities, referrals } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { buildTemplateContext, logActivity } from '@/lib/crm/repository';
import { REFEREE_REWARD, REFERRER_REWARD } from '@/lib/crm/rewards';
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

      await logActivity({
        opportunityId: referral.refereeOpportunityId,
        contactId: referral.referrerContactId,
        adminUserId: admin.id,
        type: 'note',
        subject: 'Referral reward voided',
        body: parsed.data.reason ?? null,
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

    await logActivity({
      opportunityId: referral.refereeOpportunityId,
      contactId: referral.referrerContactId,
      adminUserId: admin.id,
      type: 'note',
      subject: 'Referral reward approved for payout',
      metadata: { referralId: referral.id },
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
