/**
 * GET /api/admin/inquiries — the searchable, filterable lead list (plan §10.2).
 *
 * Returns one row per *opportunity* (the deal), not per raw form submission: a
 * returning customer shows up once per deal, which is what an agent works from.
 */

import type { NextRequest } from 'next/server';
import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers, contacts, inquiries, opportunities, pipelineStages, tasks } from '@/db/schema';
import { handleAdminRoute } from '@/lib/auth/require-admin';
import { getStages } from '@/lib/crm/repository';
import type { InquiryListItem, InquiryListResponse } from '@/models/crm.types';

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
