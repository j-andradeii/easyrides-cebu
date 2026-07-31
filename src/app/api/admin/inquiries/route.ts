/**
 * GET  /api/admin/inquiries — the searchable, filterable lead list (plan §10.2).
 * POST /api/admin/inquiries — an agent creating a lead by hand (walk-in, phone).
 *
 * GET returns one row per *opportunity* (the deal), not per raw form
 * submission: a returning customer shows up once per deal, which is what an
 * agent works from.
 */

import type { NextRequest } from 'next/server';
import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers, contacts, inquiries, opportunities, pipelineStages, tasks } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { createInquiry } from '@/lib/crm/intake';
import { getStages, logActivity } from '@/lib/crm/repository';
import type { InquiryListItem, InquiryListResponse } from '@/models/crm.types';
import { adminLeadSchema, type AdminLeadCreateResponse } from '@/models/inquiry.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | null, fallback: number, max?: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

export async function GET(request: NextRequest) {
  return handleAdminRoute(async (): Promise<InquiryListResponse> => {
    const params = request.nextUrl.searchParams;

    const page = parsePositiveInt(params.get('page'), 1);
    const pageSize = parsePositiveInt(params.get('pageSize'), 25, MAX_PAGE_SIZE);
    const query = params.get('query')?.trim();
    const source = params.get('source')?.trim();
    const stageKey = params.get('stage')?.trim();
    const owner = params.get('owner')?.trim();
    const status = params.get('status')?.trim();
    const dateFrom = params.get('dateFrom')?.trim();
    const dateTo = params.get('dateTo')?.trim();

    const stages = await getStages();

    const filters: SQL[] = [];

    if (query) {
      const pattern = `%${query}%`;
      const searchFilter = or(
        ilike(contacts.fullName, pattern),
        ilike(contacts.phone, pattern),
        ilike(contacts.email, pattern),
        ilike(opportunities.title, pattern)
      );
      if (searchFilter) filters.push(searchFilter);
    }

    if (source) filters.push(eq(opportunities.source, source));

    if (stageKey) {
      const stage = stages.find((candidate) => candidate.key === stageKey);
      // An unknown stage key must match nothing rather than silently match all.
      filters.push(stage ? eq(opportunities.stageId, stage.id) : sql`false`);
    }

    if (owner) {
      filters.push(
        owner === 'unassigned'
          ? sql`${opportunities.ownerId} is null`
          : eq(opportunities.ownerId, owner)
      );
    }

    if (status && ['open', 'won', 'lost', 'abandoned'].includes(status)) {
      filters.push(eq(opportunities.status, status as 'open' | 'won' | 'lost' | 'abandoned'));
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) filters.push(gte(opportunities.createdAt, from));
    }

    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        filters.push(lte(opportunities.createdAt, to));
      }
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [totalRow] = await db
      .select({ value: count() })
      .from(opportunities)
      .innerJoin(contacts, eq(contacts.id, opportunities.contactId))
      .where(where);

    const rows = await db
      .select({
        opportunityId: opportunities.id,
        createdAt: opportunities.createdAt,
        contactId: contacts.id,
        contactName: contacts.fullName,
        phone: contacts.phone,
        email: contacts.email,
        serviceType: opportunities.serviceType,
        vehicleType: opportunities.vehicleType,
        preferredDate: opportunities.preferredDate,
        stageKey: pipelineStages.key,
        stageName: pipelineStages.name,
        status: opportunities.status,
        source: opportunities.source,
        ownerId: opportunities.ownerId,
        ownerName: adminUsers.name,
        monetaryValue: opportunities.monetaryValue,
      })
      .from(opportunities)
      .innerJoin(contacts, eq(contacts.id, opportunities.contactId))
      .innerJoin(pipelineStages, eq(pipelineStages.id, opportunities.stageId))
      .leftJoin(adminUsers, eq(adminUsers.id, opportunities.ownerId))
      .where(where)
      .orderBy(desc(opportunities.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const opportunityIds = rows.map((row) => row.opportunityId);

    // Two small companion queries beat N+1 lookups per row.
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

    const openTasks = opportunityIds.length
      ? await db
          .select({ opportunityId: tasks.opportunityId, value: count() })
          .from(tasks)
          .where(and(inArray(tasks.opportunityId, opportunityIds), eq(tasks.status, 'open')))
          .groupBy(tasks.opportunityId)
      : [];

    const tourTitleByOpp = new Map(
      tourTitles.filter((row) => row.opportunityId).map((row) => [row.opportunityId!, row.tourTitle])
    );
    const openTaskByOpp = new Map(
      openTasks.filter((row) => row.opportunityId).map((row) => [row.opportunityId!, row.value])
    );

    const distinctSources = await db
      .selectDistinct({ source: opportunities.source })
      .from(opportunities)
      .where(sql`${opportunities.source} is not null`);

    const owners = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role,
      })
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true))
      .orderBy(adminUsers.name);

    const items: InquiryListItem[] = rows.map((row) => ({
      opportunityId: row.opportunityId,
      createdAt: row.createdAt.toISOString(),
      contactId: row.contactId,
      contactName: row.contactName,
      phone: row.phone,
      email: row.email,
      serviceType: row.serviceType,
      vehicleType: row.vehicleType,
      preferredDate: row.preferredDate,
      stageKey: row.stageKey,
      stageName: row.stageName,
      status: row.status,
      source: row.source,
      ownerId: row.ownerId,
      ownerName: row.ownerName,
      monetaryValue: row.monetaryValue,
      tourTitle: tourTitleByOpp.get(row.opportunityId) ?? null,
      openTaskCount: openTaskByOpp.get(row.opportunityId) ?? 0,
    }));

    return {
      items,
      total: totalRow?.value ?? 0,
      page,
      pageSize,
      stages: stages.map((stage) => ({
        id: stage.id,
        key: stage.key,
        name: stage.name,
        sortOrder: stage.sortOrder,
        probability: stage.probability,
        isWon: stage.isWon,
        isLost: stage.isLost,
      })),
      owners,
      sources: distinctSources
        .map((row) => row.source)
        .filter((value): value is string => Boolean(value))
        .sort(),
    };
  });
}

/**
 * Creates a lead the same way the public forms do — same transaction, same
 * dedup, same W1 enrolment — so a walk-in is indistinguishable from a web lead
 * once it is in the pipeline. The only differences are deliberate:
 *
 *   - No IP rate limit. `isRateLimited` exists to stop bots hammering the
 *     public endpoint; an authenticated agent entering back-to-back walk-ins
 *     must never be throttled.
 *   - No honeypot. There is an auth cookie in front of this.
 *   - ipAddress/userAgent are null. Those columns describe the *customer's*
 *     browser; filling them with the agent's would corrupt the audit trail.
 *   - No automated messaging. The agent is already talking to this person, so
 *     W1's "we've got your inquiry" email would be noise, and W2's drip would
 *     eventually close the deal as "no response". See `skipAutomations`.
 *
 * Any admin role may create a lead — taking a booking is the job.
 */
export async function POST(request: NextRequest) {
  return handleAdminRoute(async (admin): Promise<AdminLeadCreateResponse> => {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AdminRouteError('Invalid JSON body', 400);
    }

    const parsed = adminLeadSchema.safeParse(body);

    if (!parsed.success) {
      // Surface the specific field so the dialog can show something useful
      // instead of a generic "invalid".
      const issue = parsed.error.issues[0];
      const field = issue?.path.join('.');
      throw new AdminRouteError(
        field ? `${field}: ${issue.message}` : (issue?.message ?? 'Invalid lead data'),
        400
      );
    }

    const result = await createInquiry({
      data: parsed.data,
      // Stamping the agent onto the immutable payload is the only record of who
      // took the booking once the contact is later merged or renamed.
      rawPayload: {
        ...(body as Record<string, unknown>),
        enteredBy: { id: admin.id, email: admin.email, name: admin.name },
        enteredVia: 'admin-portal',
      },
      ipAddress: null,
      userAgent: null,
      skipAutomations: true,
    });

    // A second timeline entry, attributed to the agent. `createInquiry` already
    // logged the system "Opportunity created" line; this one answers "who?".
    await logActivity({
      opportunityId: result.opportunityId,
      contactId: result.contactId,
      adminUserId: admin.id,
      type: 'note',
      subject: 'Lead added manually',
      body:
        `${admin.name} entered this lead in the portal (${parsed.data.source}). ` +
        'No automated email was sent — follow up directly.',
      metadata: {
        source: parsed.data.source,
        enteredVia: 'admin-portal',
        automationsSkipped: true,
      },
    }).catch((error) => {
      // The lead is already committed — a failed note must not fail the request.
      console.error('[admin-inquiries] could not log manual-entry note:', error);
    });

    return {
      success: true,
      opportunityId: result.opportunityId,
      contactId: result.contactId,
      inquiryId: result.inquiryId,
      isReturningCustomer: result.isReturningCustomer,
    };
  });
}
