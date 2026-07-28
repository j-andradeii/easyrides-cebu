/** PATCH /api/admin/tasks/[taskId] — complete, cancel or reschedule (plan §11). */

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { tasks } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { logActivity } from '@/lib/crm/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.enum(['open', 'done', 'cancelled']).optional(),
  dueAt: z.string().nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError('Invalid task update', 400);
    }

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) {
      throw new AdminRouteError('Task not found', 404);
    }

    const updates: Partial<typeof tasks.$inferInsert> = {};

    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.assignedTo !== undefined) updates.assignedTo = parsed.data.assignedTo;

    if (parsed.data.dueAt !== undefined) {
      if (parsed.data.dueAt === null) {
        updates.dueAt = null;
      } else {
        const dueAt = new Date(parsed.data.dueAt);
        if (Number.isNaN(dueAt.getTime())) throw new AdminRouteError('Invalid due date', 400);
        updates.dueAt = dueAt;
      }
    }

    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
      updates.completedAt = parsed.data.status === 'done' ? new Date() : null;
    }

    if (Object.keys(updates).length === 0) {
      return { success: true as const };
    }

    await db.update(tasks).set(updates).where(eq(tasks.id, taskId));

    if (parsed.data.status === 'done') {
      await logActivity({
        opportunityId: task.opportunityId,
        contactId: task.contactId,
        adminUserId: admin.id,
        type: 'task_completed',
        subject: task.title,
        metadata: { taskId: task.id },
      });
    }

    return { success: true as const };
  });
}
