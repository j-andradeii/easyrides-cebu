/**
 * POST /api/admin/enrollments/[id]/pause — pause, resume or exit an automation
 * from the "Active Automations" panel (plan §10.3).
 *
 * Pausing keeps the enrollment's place in the workflow; exiting ends it for
 * good. Both are what an agent reaches for when they'd rather handle a lead
 * personally than let the drip keep messaging them.
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { workflowEnrollments, workflows } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { logActivity } from '@/lib/crm/repository';
import { runEnrollment } from '@/lib/workflows/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  action: z.enum(['pause', 'resume', 'exit']),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError('Choose pause, resume or exit', 400);
    }

    const [row] = await db
      .select({ enrollment: workflowEnrollments, workflowName: workflows.name })
      .from(workflowEnrollments)
      .innerJoin(workflows, eq(workflows.id, workflowEnrollments.workflowId))
      .where(eq(workflowEnrollments.id, id))
      .limit(1);

    if (!row) {
      throw new AdminRouteError('Automation not found', 404);
    }

    const { enrollment } = row;
    const { action } = parsed.data;

    if (enrollment.status === 'completed' || enrollment.status === 'exited') {
      throw new AdminRouteError('That automation has already finished', 400);
    }

    if (action === 'pause') {
      await db
        .update(workflowEnrollments)
        .set({ status: 'paused' })
        .where(eq(workflowEnrollments.id, id));
    } else if (action === 'resume') {
      await db
        .update(workflowEnrollments)
        .set({ status: 'active', nextRunAt: enrollment.nextRunAt ?? new Date() })
        .where(eq(workflowEnrollments.id, id));
    } else {
      await db
        .update(workflowEnrollments)
        .set({ status: 'exited', nextRunAt: null, completedAt: new Date() })
        .where(eq(workflowEnrollments.id, id));
    }

    await logActivity({
      opportunityId: enrollment.opportunityId,
      contactId: enrollment.contactId,
      adminUserId: admin.id,
      type: 'workflow',
      subject: `${row.workflowName} ${action === 'exit' ? 'stopped' : `${action}d`}`,
      metadata: { enrollmentId: enrollment.id, action },
    });

    // Resuming a due enrollment should act now, not on the next cron tick.
    if (action === 'resume') {
      await runEnrollment(enrollment.id).catch((error) =>
        console.error('[admin-api] resume run failed:', error)
      );
    }

    return { success: true as const };
  });
}
