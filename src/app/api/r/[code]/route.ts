/**
 * GET /api/r/[code] — resolve a referral code and log the click (plan §7A.6).
 *
 * Powers the warm landing at /r/[code]: "Juan recommends EasyRideCebu — here's
 * ₱300 off." A `pending` referral row is created on first click so the referrer
 * gets credit even before the friend fills in the form.
 */

import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { contacts, referrals } from '@/db/schema';
import { firstName } from '@/lib/crm/normalize';
import { REFEREE_REWARD_LABEL, REFERRER_REWARD_LABEL } from '@/lib/crm/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.trim().toUpperCase();

  try {
    const [referrer] = await db
      .select({ id: contacts.id, fullName: contacts.fullName })
      .from(contacts)
      .where(eq(contacts.referralCode, code))
      .limit(1);

    if (!referrer) {
      return NextResponse.json({ message: 'That referral link is not valid' }, { status: 404 });
    }

    // One open "clicked" row per referrer is enough — intake fills in the
    // referee once they actually submit the form.
    const [openRow] = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerContactId, referrer.id),
          eq(referrals.code, code),
          isNull(referrals.refereeContactId)
        )
      )
      .limit(1);

    if (openRow) {
      await db.update(referrals).set({ status: 'clicked' }).where(eq(referrals.id, openRow.id));
    } else {
      await db.insert(referrals).values({
        referrerContactId: referrer.id,
        code,
        status: 'clicked',
      });
    }

    return NextResponse.json({
      code,
      referrerName: firstName(referrer.fullName),
      referrerFullName: referrer.fullName,
      refereeReward: REFEREE_REWARD_LABEL,
      referrerReward: REFERRER_REWARD_LABEL,
    });
  } catch (error) {
    console.error('[referrals] code resolution failed:', error);
    return NextResponse.json({ message: 'Could not check that link' }, { status: 500 });
  }
}
