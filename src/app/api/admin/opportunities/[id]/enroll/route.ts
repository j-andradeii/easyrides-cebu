/** POST /api/admin/opportunities/[id]/enroll — manually start an automation (plan §11). */

import { z } from 'zod';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';
import { WORKFLOW_KEYS, type WorkflowKey } from '@/lib/workflows/definitions';
import { enrollWorkflow } from '@/lib/workflows/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  workflowKey: z.enum(WORKFLOW_KEYS),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError('Unknown workflow', 400);
    }

    const loaded = await loadOpportunityWithContact(id);
    if (!loaded) {
      throw new AdminRouteError('Inquiry not found', 404);
    }

    const enrollmentId = await enrollWorkflow({
      workflowKey: parsed.data.workflowKey as WorkflowKey,
      opportunityId: loaded.opportunity.id,
      contactId: loaded.contact.id,
      runNow: true,
    });

    if (!enrollmentId) {
      throw new AdminRouteError('That workflow is switched off', 400);
    }

    await logActivity({
      opportunityId: loaded.opportunity.id,
      contactId: loaded.contact.id,
      adminUserId: admin.id,
      type: 'workflow',
      subject: `Manually enrolled in ${parsed.data.workflowKey}`,
    });

    return { success: true as const };
  });
}
