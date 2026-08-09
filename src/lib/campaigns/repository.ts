/**
 * Campaigns — SERVER ONLY.
 *
 * One module owns every read and write of the `campaigns` table: /promo/[slug]
 * reads through it and /admin/campaigns writes through it, the same arrangement
 * `lib/tours/repository` and `lib/vehicles/repository` keep.
 *
 * The description is sanitised on the way IN, not on the way out — a promo page
 * renders it with `dangerouslySetInnerHTML`, and storing it already clean means
 * the public site can never render markup that no longer passes the allowlist.
 */

import 'server-only';

import { cache } from 'react';
import { and, count, desc, eq, ne, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  adminUsers,
  campaigns,
  opportunities,
  type CampaignRow,
  type NewCampaignRow,
} from '@/db/schema';
import { sanitizeRichText } from '@/lib/sanitize-rich-text';
import { uniqueSlug } from '@/lib/slug';
import type { CampaignInput, CampaignPatch } from '@/models/campaign.schema';
import type { Campaign, CampaignListItem, CampaignRecord } from '@/types/campaign';

// --- Row → API shapes -------------------------------------------------------

/**
 * Whether the offer has lapsed, decided on the server.
 *
 * The public page closes its form on this, so it must not be computed from the
 * visitor's clock — the same reason `isQuoteExpired` lives server-side.
 */
function hasEnded(endsAt: Date | null): boolean {
  return endsAt !== null && endsAt.getTime() <= Date.now();
}

function toCampaign(row: CampaignRow): Campaign {
  return {
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.description,
    bannerImage: row.bannerImage,
    ctaLabel: row.ctaLabel,
    serviceType: row.serviceType,
    vehicleType: row.vehicleType,
    endsAt: row.endsAt?.toISOString() ?? null,
    hasEnded: hasEnded(row.endsAt),
  };
}

function toCampaignRecord(
  row: CampaignRow,
  updatedByName: string | null,
  leadCount: number
): CampaignRecord {
  return {
    ...toCampaign(row),
    id: row.id,
    isPublished: row.isPublished,
    viewCount: row.viewCount,
    leadCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    updatedByName,
  };
}

/** Newest first: a campaign list is a history of what you have posted. */
const DISPLAY_ORDER = [desc(campaigns.createdAt)];

// --- Public site ------------------------------------------------------------

/**
 * One promo's public page.
 *
 * Deliberately does NOT swallow errors, matching `getPublishedVehicleBySlug`: a
 * 500 is more honest than a 404 on a campaign that exists.
 *
 * An *ended* campaign is still returned. A link already pasted into a Facebook
 * post outlives the offer, and "this promo has ended, here's what else we run"
 * keeps that traffic; a 404 throws it away. Only unpublishing hides the page.
 */
export const getPublishedCampaignBySlug = cache(async (slug: string): Promise<Campaign | null> => {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.slug, slug), eq(campaigns.isPublished, true)))
    .limit(1);

  return row ? toCampaign(row) : null;
});

/** Every live promo — the sitemap reads this. Never throws. */
export const getPublishedCampaigns = cache(async (): Promise<Campaign[]> => {
  try {
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.isPublished, true))
      .orderBy(...DISPLAY_ORDER);

    return rows.map(toCampaign);
  } catch (error) {
    console.error('[campaigns] could not load the promo list:', error);
    return [];
  }
});

/**
 * Records that someone opened the page.
 *
 * Fire-and-forget on purpose: a counter is not worth failing a page render
 * over, and it is the one write a public page makes.
 */
export async function recordCampaignView(slug: string): Promise<void> {
  try {
    await db
      .update(campaigns)
      .set({ viewCount: sql`${campaigns.viewCount} + 1` })
      .where(eq(campaigns.slug, slug));
  } catch (error) {
    console.error('[campaigns] view count failed:', error);
  }
}

/** Resolves a slug to the row intake needs — id for attribution, name for the title. */
export async function findCampaignForIntake(
  slug: string
): Promise<{ id: string; slug: string; name: string } | null> {
  const [row] = await db
    .select({ id: campaigns.id, slug: campaigns.slug, name: campaigns.name })
    .from(campaigns)
    .where(eq(campaigns.slug, slug))
    .limit(1);

  return row ?? null;
}

// --- Admin portal -----------------------------------------------------------

/**
 * Every campaign with its two numbers: leads captured, and how many of those
 * deals were won.
 *
 * Counted with grouped sub-selects rather than a per-row query, so a portal
 * with fifty campaigns still issues three statements.
 */
export async function listCampaigns(): Promise<CampaignListItem[]> {
  const [rows, leadCounts] = await Promise.all([
    db.select().from(campaigns).orderBy(...DISPLAY_ORDER),
    db
      .select({
        campaignId: opportunities.campaignId,
        leads: count(opportunities.id),
        booked: sql<number>`count(*) filter (where ${opportunities.status} = 'won')::int`,
      })
      .from(opportunities)
      .where(sql`${opportunities.campaignId} is not null`)
      .groupBy(opportunities.campaignId),
  ]);

  const totals = new Map(leadCounts.map((row) => [row.campaignId, row]));

  return rows.map((row) => {
    const total = totals.get(row.id);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.shortDescription,
      bannerImage: row.bannerImage,
      isPublished: row.isPublished,
      endsAt: row.endsAt?.toISOString() ?? null,
      hasEnded: hasEnded(row.endsAt),
      viewCount: row.viewCount,
      leadCount: Number(total?.leads ?? 0),
      bookedCount: Number(total?.booked ?? 0),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function getCampaignById(id: string): Promise<CampaignRecord | null> {
  const [row] = await db
    .select({ campaign: campaigns, updatedByName: adminUsers.name })
    .from(campaigns)
    .leftJoin(adminUsers, eq(adminUsers.id, campaigns.updatedBy))
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!row) return null;

  const [leads] = await db
    .select({ value: count() })
    .from(opportunities)
    .where(eq(opportunities.campaignId, id));

  return toCampaignRecord(row.campaign, row.updatedByName, Number(leads?.value ?? 0));
}

/** True when another campaign already owns this slug. */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const filters: SQL[] = [eq(campaigns.slug, slug)];
  if (excludeId) filters.push(ne(campaigns.id, excludeId));

  const [row] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(...filters))
    .limit(1);

  return Boolean(row);
}

/**
 * The slug a campaign will actually get: the admin's own if it is free,
 * otherwise the same stem with `-2`, `-3`… appended.
 */
export async function resolveSlug(input: {
  slug?: string | null;
  name: string;
  excludeId?: string;
}): Promise<string> {
  const base = input.slug?.trim() || input.name;
  return uniqueSlug(base, (candidate) => isSlugTaken(candidate, input.excludeId), 'promo');
}

/** Postgres unique-violation — two admins saving the same new slug at once. */
function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505';
}

function toTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createCampaign(
  input: CampaignInput,
  adminId: string
): Promise<CampaignRecord> {
  // Resolving the slug and inserting it are two statements, so a concurrent
  // save can still win the race. Retrying re-resolves against the row that just
  // landed — the same loop `createVehicle` runs.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = await resolveSlug({ slug: input.slug, name: input.name });

    try {
      const [row] = await db
        .insert(campaigns)
        .values({
          slug,
          name: input.name,
          shortDescription: input.shortDescription,
          description: sanitizeRichText(input.description ?? ''),
          bannerImage: input.bannerImage,
          ctaLabel: input.ctaLabel,
          serviceType: input.serviceType,
          vehicleType: input.vehicleType,
          isPublished: input.isPublished,
          endsAt: toTimestamp(input.endsAt),
          createdBy: adminId,
          updatedBy: adminId,
        })
        .returning();

      return toCampaignRecord(row, null, 0);
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }

  // The loop either returns or throws; this only satisfies the type checker.
  throw new Error('Could not find a free slug for this campaign');
}

export async function updateCampaign(
  id: string,
  patch: CampaignPatch,
  adminId: string
): Promise<CampaignRecord | null> {
  const values: Partial<NewCampaignRow> = { updatedBy: adminId, updatedAt: new Date() };

  if (patch.name !== undefined) values.name = patch.name;
  if (patch.shortDescription !== undefined) values.shortDescription = patch.shortDescription;
  if (patch.description !== undefined) values.description = sanitizeRichText(patch.description);
  if (patch.bannerImage !== undefined) values.bannerImage = patch.bannerImage;
  if (patch.ctaLabel !== undefined) values.ctaLabel = patch.ctaLabel;
  if (patch.serviceType !== undefined) values.serviceType = patch.serviceType;
  if (patch.vehicleType !== undefined) values.vehicleType = patch.vehicleType;
  if (patch.isPublished !== undefined) values.isPublished = patch.isPublished;
  if (patch.endsAt !== undefined) values.endsAt = toTimestamp(patch.endsAt);

  // The slug is only touched when the caller actually sends one. Renaming a
  // promo must not silently move a URL that is already sitting in a Facebook
  // post, and the table's publish switch must not either. Sending an empty slug
  // is the explicit "re-derive it from the name" request.
  if (patch.slug !== undefined) {
    const [current] = await db
      .select({ slug: campaigns.slug, name: campaigns.name })
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!current) return null;

    const name = patch.name ?? current.name;
    const wanted = patch.slug.trim() || name;

    if (wanted !== current.slug) {
      values.slug = await resolveSlug({ slug: wanted, name, excludeId: id });
    }
  }

  const [row] = await db.update(campaigns).set(values).where(eq(campaigns.id, id)).returning();
  if (!row) return null;

  const [leads] = await db
    .select({ value: count() })
    .from(opportunities)
    .where(eq(opportunities.campaignId, id));

  return toCampaignRecord(row, null, Number(leads?.value ?? 0));
}

/**
 * Removes a campaign.
 *
 * The leads it produced survive: both `campaign_id` columns are ON DELETE SET
 * NULL, and the deal's `source` still reads "campaign:summer-oslob-2026". A
 * promo you ran and deleted must not take its customers with it.
 */
export async function deleteCampaign(id: string): Promise<boolean> {
  const [row] = await db.delete(campaigns).where(eq(campaigns.id, id)).returning({
    id: campaigns.id,
  });
  return Boolean(row);
}
