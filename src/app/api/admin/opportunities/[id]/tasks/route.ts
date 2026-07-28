/** POST /api/admin/opportunities/[id]/tasks — create a follow-up to-do (plan §11). */

import { z } from 'zod';

import { db } from '@/db/client';
import { tasks } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  title: z.string().min(1, 'Give the task a title').max(200),
  dueAt: z.string().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError('Give the task a title', 400);
    }

    const loaded = await loadOpportunityWithContact(id);
    if (!loaded) {
      throw new AdminRouteError('Inquiry not found', 404);
    }

    let dueAt: Date | null = null;
    if (parsed.data.dueAt) {
      const parsedDate = new Date(parsed.data.dueAt);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new AdminRouteError('Invalid due date', 400);
      }
      dueAt = parsedDate;
    }

    // Default the assignee to whoever owns the deal, falling back to the actor.
    const assignedTo =
      parsed.data.assignedTo !== undefined
        ? parsed.data.assignedTo
        : (loaded.opportunity.ownerId ?? admin.id);

    const [task] = await db
      .insert(tasks)
      .values({
        opportunityId: loaded.opportunity.id,
        contactId: loaded.contact.id,
        assignedTo,
        title: parsed.data.title,
        dueAt,
      })
      .returning({ id: tasks.id });

    await logActivity({
      opportunityId: loaded.opportunity.id,
      contactId: loaded.contact.id,
      adminUserId: admin.id,
      type: 'task_created',
      subject: parsed.data.title,
      body: dueAt ? `Due ${dueAt.toISOString()}` : null,
      metadata: { taskId: task.id },
    });

    return { success: true as const };
  });
}
