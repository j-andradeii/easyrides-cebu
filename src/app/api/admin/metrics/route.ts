/**
 * GET /api/admin/metrics — the funnel report (plan §16 and §7A.9).
 *
 * "Reached a stage" is measured from the stage_change timeline, not just the
 * current stage: a lead that raced from New Lead to Booked still counts toward
 * every step it passed through, which is what makes the conversion rates real.
 */

import { and, count, desc, eq, isNotNull, lte, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers, opportunities, referrals, reviews, tasks } from '@/db/schema';
import { handleAdminRoute } from '@/lib/auth/require-admin';
import { getStages } from '@/lib/crm/repository';
import type {
  ConversionStep,
  LossReason,
  MetricsResponse,
  SourcePerformance,
  StageCount,
} from '@/models/crm.types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The adjacent-stage hops we report a conversion rate for. */
const CONVERSION_PATH: [string, string][] = [
  ['new_lead', 'contacted'],
  ['contacted', 'quote_sent'],
  ['quote_sent', 'booked'],
  ['booked', 'completed'],
];

function rate(from: number, to: number): number {
  return from > 0 ? to / from : 0;
}

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET() {
  return handleAdminRoute(async (): Promise<MetricsResponse> => {
    const stages = await getStages();

    // --- How many opportunities ever reached each stage ---
    const reachedRows = await db.execute<{ stage_key: string; reached: number }>(sql`
      WITH reached AS (
        -- Everything starts at New Lead
        SELECT o.id AS opportunity_id, 'new_lead'::text AS stage_key FROM opportunities o
        UNION
        -- Anything at or before the current stage (Lost is terminal, not "further along")
        SELECT o.id, ps.key
        FROM opportunities o
        JOIN pipeline_stages cur ON cur.id = o.stage_id AND cur.is_lost = false
        JOIN pipeline_stages ps
          ON ps.pipeline_id = cur.pipeline_id AND ps.sort_order <= cur.sort_order
        UNION
        -- Plus every stage the timeline says it passed through
        SELECT a.opportunity_id, a.metadata->>'to'
        FROM activities a
        WHERE a.type = 'stage_change'
          AND a.opportunity_id IS NOT NULL
          AND a.metadata->>'to' IS NOT NULL
      )
      SELECT stage_key, COUNT(DISTINCT opportunity_id)::int AS reached
      FROM reached
      GROUP BY stage_key
    `);

    const reachedByStage = new Map(
      Array.from(reachedRows).map((row) => [row.stage_key, Number(row.reached)])
    );

    // --- Current occupancy per stage ---
    const currentRows = await db
      .select({
        stageId: opportunities.stageId,
        total: count(),
        open: sql<number>`count(*) filter (where ${opportunities.status} = 'open')::int`,
      })
      .from(opportunities)
      .groupBy(opportunities.stageId);

    const currentByStage = new Map(currentRows.map((row) => [row.stageId, row]));

    const stageCounts: StageCount[] = stages.map((stage) => {
      const current = currentByStage.get(stage.id);
      return {
        key: stage.key,
        name: stage.name,
        sortOrder: stage.sortOrder,
        openCount: Number(current?.open ?? 0),
        totalCount: Number(current?.total ?? 0),
      };
    });

    const conversions: ConversionStep[] = CONVERSION_PATH.map(([from, to]) => {
      const fromCount = reachedByStage.get(from) ?? 0;
      const toCount = reachedByStage.get(to) ?? 0;
      return { from, to, fromCount, toCount, rate: rate(fromCount, toCount) };
    });

    // --- Totals ---
    const [totalsRow] = await db
      .select({
        leads: count(),
        open: sql<number>`count(*) filter (where ${opportunities.status} = 'open')::int`,
        won: sql<number>`count(*) filter (where ${opportunities.status} = 'won')::int`,
        lost: sql<number>`count(*) filter (where ${opportunities.status} = 'lost')::int`,
      })
      .from(opportunities);

    const leads = Number(totalsRow?.leads ?? 0);
    const bookedReached = reachedByStage.get('booked') ?? 0;

    // --- Revenue ---
    // Dates are bound as ISO strings and cast: postgres-js cannot infer a type
    // for a bare Date interpolated into a raw sql template.
    const weekStart = startOfWeek().toISOString();
    const monthStart = startOfMonth().toISOString();

    const [revenueRow] = await db
      .select({
        wonThisWeek: sql<string>`coalesce(sum(${opportunities.monetaryValue}) filter (where ${opportunities.status} = 'won' and ${opportunities.wonAt} >= ${weekStart}::timestamptz), 0)`,
        wonThisMonth: sql<string>`coalesce(sum(${opportunities.monetaryValue}) filter (where ${opportunities.status} = 'won' and ${opportunities.wonAt} >= ${monthStart}::timestamptz), 0)`,
        wonAllTime: sql<string>`coalesce(sum(${opportunities.monetaryValue}) filter (where ${opportunities.status} = 'won'), 0)`,
      })
      .from(opportunities);

    const [forecastRow] = await db.execute<{ weighted: string }>(sql`
      SELECT COALESCE(SUM(o.monetary_value * ps.probability / 100.0), 0)::text AS weighted
      FROM opportunities o
      JOIN pipeline_stages ps ON ps.id = o.stage_id
      WHERE o.status = 'open'
    `);

    // --- Speed to lead: median minutes to the first human touch ---
    const [speedRow] = await db.execute<{ median_minutes: string | null }>(sql`
      SELECT percentile_cont(0.5) WITHIN GROUP (
               ORDER BY EXTRACT(EPOCH FROM (t.first_touch - t.created_at)) / 60
             )::text AS median_minutes
      FROM (
        SELECT o.id, o.created_at, MIN(a.created_at) AS first_touch
        FROM opportunities o
        JOIN activities a
          ON a.opportunity_id = o.id
         AND a.admin_user_id IS NOT NULL
         AND a.type IN ('call', 'message_out', 'email', 'note', 'stage_change')
        GROUP BY o.id, o.created_at
      ) t
    `);

    // --- Source performance ---
    const sourceRows = await db
      .select({
        source: opportunities.source,
        leads: count(),
        booked: sql<number>`count(*) filter (where ${opportunities.status} = 'won')::int`,
        revenue: sql<string>`coalesce(sum(${opportunities.monetaryValue}) filter (where ${opportunities.status} = 'won'), 0)`,
      })
      .from(opportunities)
      .groupBy(opportunities.source);

    const sourcePerformance: SourcePerformance[] = sourceRows
      .map((row) => ({
        source: row.source ?? 'unknown',
        leads: Number(row.leads),
        booked: Number(row.booked),
        revenue: row.revenue,
        conversionRate: rate(Number(row.leads), Number(row.booked)),
      }))
      .sort((a, b) => b.leads - a.leads);

    // --- Loss reasons ---
    const lossRows = await db
      .select({ reason: opportunities.lostReason, value: count() })
      .from(opportunities)
      .where(isNotNull(opportunities.lostReason))
      .groupBy(opportunities.lostReason)
      .orderBy(desc(count()))
      .limit(10);

    const lossReasons: LossReason[] = lossRows.map((row) => ({
      reason: row.reason ?? 'Unknown',
      count: Number(row.value),
    }));

    // --- Today's tasks ---
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const taskRows = await db
      .select({ task: tasks, assigneeName: adminUsers.name })
      .from(tasks)
      .leftJoin(adminUsers, eq(adminUsers.id, tasks.assignedTo))
      .where(and(eq(tasks.status, 'open'), lte(tasks.dueAt, endOfToday)))
      .orderBy(tasks.dueAt)
      .limit(25);

    // --- Virality & satisfaction (§7A.9) ---
    const [reviewRow] = await db
      .select({
        requested: count(),
        left: sql<number>`count(*) filter (where ${reviews.submittedAt} is not null)::int`,
        avgRating: sql<string | null>`avg(${reviews.rating}) filter (where ${reviews.rating} is not null)`,
        promoters: sql<number>`count(*) filter (where ${reviews.nps} >= 9)::int`,
        detractors: sql<number>`count(*) filter (where ${reviews.nps} <= 6 and ${reviews.nps} is not null)::int`,
        npsResponses: sql<number>`count(*) filter (where ${reviews.nps} is not null)::int`,
      })
      .from(reviews);

    const [referralRow] = await db
      .select({
        total: count(),
        booked: sql<number>`count(*) filter (where ${referrals.status} in ('booked', 'rewarded'))::int`,
        referrers: sql<number>`count(distinct ${referrals.referrerContactId})::int`,
      })
      .from(referrals);

    const [referralRevenueRow] = await db.execute<{ revenue: string }>(sql`
      SELECT COALESCE(SUM(o.monetary_value), 0)::text AS revenue
      FROM referrals r
      JOIN opportunities o ON o.id = r.referee_opportunity_id
      WHERE o.status = 'won'
    `);

    // Referral rate is measured against trips that actually happened.
    const [completedRow] = await db
      .select({ value: count() })
      .from(opportunities)
      .where(eq(opportunities.status, 'won'));

    const completedTrips = Number(completedRow?.value ?? 0);
    const referralsTotal = Number(referralRow?.total ?? 0);
    const referralsBooked = Number(referralRow?.booked ?? 0);
    const referrers = Number(referralRow?.referrers ?? 0);

    const npsResponses = Number(reviewRow?.npsResponses ?? 0);
    const nps =
      npsResponses > 0
        ? ((Number(reviewRow?.promoters ?? 0) - Number(reviewRow?.detractors ?? 0)) /
            npsResponses) *
          100
        : null;

    // K-factor = invites per customer × their conversion rate.
    const invitesPerCustomer = referrers > 0 ? referralsTotal / referrers : 0;
    const kFactor = invitesPerCustomer * rate(referralsTotal, referralsBooked);

    return {
      stageCounts,
      conversions,
      totals: {
        leads,
        open: Number(totalsRow?.open ?? 0),
        won: Number(totalsRow?.won ?? 0),
        lost: Number(totalsRow?.lost ?? 0),
        leadToBookedRate: rate(leads, bookedReached),
      },
      revenue: {
        wonThisWeek: revenueRow?.wonThisWeek ?? '0',
        wonThisMonth: revenueRow?.wonThisMonth ?? '0',
        wonAllTime: revenueRow?.wonAllTime ?? '0',
        weightedForecast: forecastRow?.weighted ?? '0',
      },
      speedToLeadMinutes: speedRow?.median_minutes ? Number(speedRow.median_minutes) : null,
      sourcePerformance,
      lossReasons,
      tasksDueToday: taskRows.map(({ task, assigneeName }) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueAt: task.dueAt?.toISOString() ?? null,
        completedAt: task.completedAt?.toISOString() ?? null,
        assignedTo: task.assignedTo,
        assigneeName,
        createdAt: task.createdAt.toISOString(),
      })),
      virality: {
        averageRating: reviewRow?.avgRating ? Number(reviewRow.avgRating) : null,
        nps,
        reviewsLeft: Number(reviewRow?.left ?? 0),
        reviewRequests: Number(reviewRow?.requested ?? 0),
        reviewConversionRate: rate(Number(reviewRow?.requested ?? 0), Number(reviewRow?.left ?? 0)),
        referralRate: rate(completedTrips, referralsTotal),
        referralsBooked,
        referralRevenue: referralRevenueRow?.revenue ?? '0',
        kFactor,
      },
    };
  });
}
