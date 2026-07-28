/**
 * PATCH /api/admin/opportunities/[id] — the stage stepper and quick actions
 * on the detail screen (plan §10.3, §11).
 *
 * Stage changes go through `moveStage()` so status/won_at/lost_at stay
 * consistent, the timeline gets an entry, and W3/W4 fire on the right stages.
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { adminUsers, opportunities } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';
import { toDateOnly } from '@/lib/crm/normalize';
import { isStageKey, type StageKey } from '@/lib/funnel/stages';
import { moveStage, recalculateLifetimeValue } from '@/lib/workflows/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  stageKey: z.string().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  status: z.enum(['open', 'won', 'lost', 'abandoned']).optional(),
  monetaryValue: z.string().max(20).optional(),
  lostReason: z.string().max(500).optional(),
  title: z.string().max(200).optional(),
  expectedCloseDate: z.string().nullable().optional(),
  preferredDate: z.string().nullable().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      throw new AdminRouteError('Invalid request body', 400);
    }

    const loaded = await loadOpportunityWithContact(id);
    if (!loaded) {
      throw new AdminRouteError('Inquiry not found', 404);
    }

    const { opportunity, contact } = loaded;
    const patch = parsed.data;

    // --- Field updates (everything except the stage) ---
    const updates: Partial<typeof opportunities.$inferInsert> = {};

    if (patch.title !== undefined) updates.title = patch.title;

    if (patch.monetaryValue !== undefined) {
      const amount = Number.parseFloat(patch.monetaryValue);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new AdminRouteError('Deal value must be a positive number', 400);
      }
      updates.monetaryValue = amount.toFixed(2);
    }

    if (patch.expectedCloseDate !== undefined) {
      updates.expectedCloseDate = patch.expectedCloseDate ? toDateOnly(patch.expectedCloseDate) : null;
    }

    if (patch.preferredDate !== undefined) {
      updates.preferredDate = patch.preferredDate ? toDateOnly(patch.preferredDate) : null;
    }

    if (patch.lostReason !== undefined) updates.lostReason = patch.lostReason;

    if (patch.ownerId !== undefined) {
      if (patch.ownerId) {
        const [owner] = await db
          .select({ id: adminUsers.id, name: adminUsers.name })
          .from(adminUsers)
          .where(eq(adminUsers.id, patch.ownerId))
          .limit(1);

        if (!owner) throw new AdminRouteError('That team member does not exist', 400);
        updates.ownerId = owner.id;

        await logActivity({
          opportunityId: opportunity.id,
          contactId: contact.id,
          adminUserId: admin.id,
          type: 'system',
          subject: `Assigned to ${owner.name}`,
        });
      } else {
        updates.ownerId = null;
        await logActivity({
          opportunityId: opportunity.id,
          contactId: contact.id,
          adminUserId: admin.id,
          type: 'system',
          subject: 'Unassigned',
        });
      }
    }

    // A manual status flip without a stage change (e.g. "abandoned").
    if (patch.status !== undefined && patch.stageKey === undefined) {
      updates.status = patch.status;
      if (patch.status === 'won') updates.wonAt = opportunity.wonAt ?? new Date();
      if (patch.status === 'lost') updates.lostAt = opportunity.lostAt ?? new Date();

      await logActivity({
        opportunityId: opportunity.id,
        contactId: contact.id,
        adminUserId: admin.id,
        type: 'system',
        subject: `Status set to ${patch.status}`,
        body: patch.lostReason ?? null,
      });
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(opportunities).set(updates).where(eq(opportunities.id, opportunity.id));
    }

    // --- Stage change (may fire automations) ---
    if (patch.stageKey !== undefined) {
      if (!isStageKey(patch.stageKey)) {
        throw new AdminRouteError(`Unknown stage "${patch.stageKey}"`, 400);
      }

      // Re-read so moveStage sees the values we just wrote.
      const refreshed = await loadOpportunityWithContact(id);
      if (!refreshed) throw new AdminRouteError('Inquiry not found', 404);

      await moveStage({
        opportunity: refreshed.opportunity,
        contact: refreshed.contact,
        stage: patch.stageKey as StageKey,
        lostReason: patch.lostReason ?? null,
        adminUserId: admin.id,
        actor: admin.name,
      });
    }

    // Won deals change what the customer is worth.
    if (patch.stageKey || patch.status || patch.monetaryValue !== undefined) {
      await recalculateLifetimeValue(contact.id);
    }

    return { success: true as const };
  });
}
