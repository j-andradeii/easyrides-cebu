/**
 * Referrer share hub — plan §7A.5, §7A.6.
 *
 *   GET  /api/referrals/share?code=…  → the referrer's link + reward status
 *   POST /api/referrals/share         → log which channel they shared to
 *
 * Keyed by the referral code itself: it's the value the customer hands out, so
 * there is nothing extra to remember or leak.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { contacts, referrals } from '@/db/schema';
import { firstName } from '@/lib/crm/normalize';
import { siteUrl } from '@/lib/crm/repository';
import { REFEREE_REWARD_LABEL, REFERRER_REWARD_LABEL } from '@/lib/crm/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const shareSchema = z.object({
  code: z.string().min(3).max(40),
  channel: z.enum(['whatsapp', 'messenger', 'copy', 'qr', 'sms', 'email']),
});

export async function GET(request: NextRequest) {
  const rawCode = request.nextUrl.searchParams.get('code');
  if (!rawCode) {
    return NextResponse.json({ message: 'Missing code' }, { status: 400 });
  }

  const code = rawCode.trim().toUpperCase();

  const [referrer] = await db
    .select({ id: contacts.id, fullName: contacts.fullName })
    .from(contacts)
    .where(eq(contacts.referralCode, code))
    .limit(1);

  if (!referrer) {
    return NextResponse.json({ message: 'That link is not valid' }, { status: 404 });
  }

  const rows = await db
    .select({ status: referrals.status, createdAt: referrals.createdAt })
    .from(referrals)
    .where(eq(referrals.referrerContactId, referrer.id))
    .orderBy(desc(referrals.createdAt));

  const booked = rows.filter((row) => row.status === 'booked' || row.status === 'rewarded').length;
  const rewarded = rows.filter((row) => row.status === 'rewarded').length;

  return NextResponse.json({
    code,
    name: firstName(referrer.fullName),
    shareUrl: `${siteUrl()}/r/${code}`,
    refereeReward: REFEREE_REWARD_LABEL,
    referrerReward: REFERRER_REWARD_LABEL,
    stats: {
      invitesClicked: rows.length,
      booked,
      rewarded,
      pendingApproval: booked - rewarded,
    },
  });
}

export async function POST(request: Request) {
  const parsed = shareSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid share' }, { status: 400 });
  }

  const code = parsed.data.code.trim().toUpperCase();

  try {
    const [referrer] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.referralCode, code))
      .limit(1);

    if (!referrer) {
      return NextResponse.json({ message: 'That link is not valid' }, { status: 404 });
    }

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
      await db
        .update(referrals)
        .set({ channel: parsed.data.channel })
        .where(eq(referrals.id, openRow.id));
    } else {
      await db.insert(referrals).values({
        referrerContactId: referrer.id,
        code,
        channel: parsed.data.channel,
        status: 'pending',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[referrals] share logging failed:', error);
    return NextResponse.json({ message: 'Could not log that share' }, { status: 500 });
  }
}
