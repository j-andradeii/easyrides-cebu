/**
 * POST /api/admin/opportunities/[id]/activities — add a note, log a call, or
 * record a message you sent or received (plan §11).
 *
 * Logging an inbound message/call is what makes W2's "Replied?" branch exit, so
 * this is how an agent tells the automations to back off.
 */

import { z } from 'zod';

import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { loadOpportunityWithContact, logActivity } from '@/lib/crm/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  type: z.enum(['note', 'call', 'message_out', 'message_in', 'email']),
  subject: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  channel: z.enum(['whatsapp', 'email', 'sms', 'phone', 'facebook', 'system']).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      throw new AdminRouteError('Invalid activity', 400);
    }
    if (!parsed.data.body?.trim() && !parsed.data.subject?.trim()) {
      throw new AdminRouteError('Add a note or a subject', 400);
    }

    const loaded = await loadOpportunityWithContact(id);
    if (!loaded) {
      throw new AdminRouteError('Inquiry not found', 404);
    }

    await logActivity({
      opportunityId: loaded.opportunity.id,
      contactId: loaded.contact.id,
      adminUserId: admin.id,
      type: parsed.data.type,
      channel: parsed.data.channel ?? null,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body ?? null,
    });

    return { success: true as const };
  });
}
