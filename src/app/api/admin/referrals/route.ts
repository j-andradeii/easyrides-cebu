/**
 * GET /api/admin/referrals — every referral plus the top-referrer leaderboard
 * (plan §7A.8).
 *
 * The leaderboard is how you spot the hotel or host worth formalising into a
 * paid B2B partner — the highest-ROI channel in §7A.3.
 */

import { count, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/db/client';
import { contacts, referrals } from '@/db/schema';
import { handleAdminRoute } from '@/lib/auth/require-admin';
import type { ReferralRecord } from '@/models/crm.types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface ReferralLeader {
  contactId: string;
  name: string | null;
  phone: string | null;
  referrals: number;
  booked: number;
}

export async function GET() {
  return handleAdminRoute(
    async (): Promise<{ items: ReferralRecord[]; leaderboard: ReferralLeader[] }> => {
      const referrer = alias(contacts, 'referrer');
      const referee = alias(contacts, 'referee');

      const rows = await db
        .select({
          id: referrals.id,
          code: referrals.code,
          status: referrals.status,
          channel: referrals.channel,
          referrerContactId: referrals.referrerContactId,
          refereeContactId: referrals.refereeContactId,
          refereeOpportunityId: referrals.refereeOpportunityId,
          referrerReward: referrals.referrerReward,
          refereeReward: referrals.refereeReward,
          rewardPaidAt: referrals.rewardPaidAt,
          abuseFlag: referrals.abuseFlag,
          createdAt: referrals.createdAt,
          convertedAt: referrals.convertedAt,
          referrerName: referrer.fullName,
          referrerPhone: referrer.phone,
          refereeName: referee.fullName,
        })
        .from(referrals)
        .innerJoin(referrer, eq(referrer.id, referrals.referrerContactId))
        .leftJoin(referee, eq(referee.id, referrals.refereeContactId))
        .orderBy(desc(referrals.createdAt))
        .limit(300);

      const leaderRows = await db
        .select({
          contactId: referrals.referrerContactId,
          name: referrer.fullName,
          phone: referrer.phone,
          referrals: count(),
          booked: sql<number>`count(*) filter (where ${referrals.status} in ('booked', 'rewarded'))::int`,
        })
        .from(referrals)
        .innerJoin(referrer, eq(referrer.id, referrals.referrerContactId))
        .groupBy(referrals.referrerContactId, referrer.fullName, referrer.phone)
        .orderBy(desc(count()))
        .limit(10);

      return {
        items: rows.map((row) => ({
          id: row.id,
          code: row.code,
          status: row.status,
          channel: row.channel,
          referrerContactId: row.referrerContactId,
          referrerName: row.referrerName,
          referrerPhone: row.referrerPhone,
          refereeContactId: row.refereeContactId,
          refereeName: row.refereeName,
          refereeOpportunityId: row.refereeOpportunityId,
          referrerReward: row.referrerReward,
          refereeReward: row.refereeReward,
          rewardPaidAt: row.rewardPaidAt?.toISOString() ?? null,
          abuseFlag: row.abuseFlag,
          createdAt: row.createdAt.toISOString(),
          convertedAt: row.convertedAt?.toISOString() ?? null,
        })),
        leaderboard: leaderRows.map((row) => ({
          contactId: row.contactId,
          name: row.name,
          phone: row.phone,
          referrals: Number(row.referrals),
          booked: Number(row.booked),
        })),
      };
    }
  );
}
