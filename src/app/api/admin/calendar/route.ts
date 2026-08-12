/**
 * GET /api/admin/calendar — confirmed bookings by trip date (drives /admin/calendar).
 *
 * Separate from `/api/admin/inquiries` because the two ask different questions
 * of the same table. The list is "what came in recently", so it pages by
 * `created_at`; the calendar is "who is actually travelling that week", so it
 * filters by `preferred_date` and must return every match in the range — a
 * month with 40 bookings cannot arrive one page at a time and still be a
 * calendar. The range is therefore capped instead of paged: the client only
 * ever asks for the grid it is about to draw.
 *
 * Only won deals appear. A trip date on an open lead is a request, not a
 * commitment — putting those on the same grid would make the calendar answer
 * "who asked about Thursday" when the question it exists for is "what is
 * booked on Thursday".
 */

import type { NextRequest } from 'next/server';
import { and, asc, eq, gte, inArray, isNotNull, lte, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers, contacts, inquiries, opportunities, pipelineStages } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import type { CalendarBooking, CalendarResponse } from '@/models/crm.types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A six-row month grid is 42 days; the rest is slack for a client asking wide. */
const MAX_RANGE_DAYS = 62;

/**
 * Far more than any real month of bookings. It exists so a bad range can never
 * pull the whole table into memory, not as a page size — hitting it is reported
 * to the user rather than silently truncating the month.
 */
const MAX_ITEMS = 500;

/** Parses 'YYYY-MM-DD' as UTC midnight — only ever used to measure the span. */
function parseDateOnly(value: string | null, label: string): string {
  const trimmed = value?.trim();

  if (!trimmed || !DATE_ONLY.test(trimmed) || Number.isNaN(Date.parse(`${trimmed}T00:00:00Z`))) {
    throw new AdminRouteError(`\`${label}\` must be a date in YYYY-MM-DD form`, 400);
  }

  return trimmed;
}

export async function GET(request: NextRequest) {
  return handleAdminRoute(async (): Promise<CalendarResponse> => {
    const params = request.nextUrl.searchParams;

    const from = parseDateOnly(params.get('from'), 'from');
    const to = parseDateOnly(params.get('to'), 'to');

    const spanDays =
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1;

    if (spanDays < 1) {
      throw new AdminRouteError('`to` must not be earlier than `from`', 400);
    }
    if (spanDays > MAX_RANGE_DAYS) {
      throw new AdminRouteError(`Date range is limited to ${MAX_RANGE_DAYS} days`, 400);
    }

    const rows = await db
      .select({
        opportunityId: opportunities.id,
        reference: opportunities.reference,
        preferredDate: opportunities.preferredDate,
        contactName: contacts.fullName,
        phone: contacts.phone,
        serviceType: opportunities.serviceType,
        vehicleType: opportunities.vehicleType,
        monetaryValue: opportunities.monetaryValue,
        ownerName: adminUsers.name,
      })
      .from(opportunities)
      .innerJoin(contacts, eq(contacts.id, opportunities.contactId))
      .innerJoin(pipelineStages, eq(pipelineStages.id, opportunities.stageId))
      .leftJoin(adminUsers, eq(adminUsers.id, opportunities.ownerId))
      .where(
        and(
          // A booking with no trip date has nowhere to sit on a calendar.
          isNotNull(opportunities.preferredDate),
          gte(opportunities.preferredDate, from),
          lte(opportunities.preferredDate, to),
          // Both halves are load-bearing. `isWon` is the funnel position, which
          // `moveStage` always writes together with status='won'. The status
          // check then drops anything cancelled afterwards: a manual flip to
          // lost/abandoned leaves the deal sitting in Booked, and a cancelled
          // trip must stop holding a van on the calendar.
          eq(pipelineStages.isWon, true),
          eq(opportunities.status, 'won')
        )
      )
      // Within a day the order is the reference, which is chronological by
      // issue — a stable order matters more than which one it is, or cells
      // would reshuffle between refreshes.
      .orderBy(asc(opportunities.preferredDate), asc(opportunities.reference))
      // One extra row is how we detect the cap without a second count query.
      .limit(MAX_ITEMS + 1);

    const truncated = rows.length > MAX_ITEMS;
    const visible = truncated ? rows.slice(0, MAX_ITEMS) : rows;
    const opportunityIds = visible.map((row) => row.opportunityId);

    // One companion query beats an N+1 per cell.
    const tourTitles = opportunityIds.length
      ? await db
          .select({ opportunityId: inquiries.opportunityId, tourTitle: inquiries.tourTitle })
          .from(inquiries)
          .where(
            and(
              inArray(inquiries.opportunityId, opportunityIds),
              sql`${inquiries.tourTitle} is not null`
            )
          )
      : [];

    const tourTitleByOpp = new Map(
      tourTitles.filter((row) => row.opportunityId).map((row) => [row.opportunityId!, row.tourTitle])
    );

    const items: CalendarBooking[] = visible.map((row) => ({
      opportunityId: row.opportunityId,
      reference: row.reference,
      // Non-null by the `isNotNull` filter above; the cast keeps the wire type
      // honest instead of leaking a nullable date into the grid.
      preferredDate: row.preferredDate!,
      contactName: row.contactName,
      phone: row.phone,
      serviceType: row.serviceType,
      vehicleType: row.vehicleType,
      tourTitle: tourTitleByOpp.get(row.opportunityId) ?? null,
      monetaryValue: row.monetaryValue,
      ownerName: row.ownerName,
    }));

    return { items, truncated };
  });
}
