/**
 * PATCH /api/admin/reviews/[id] — approve a review for the public site.
 *
 * Published reviews are what `getPublishedReviews()` feeds into the landing
 * page testimonials (plan §7A.2).
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { reviews } from '@/db/schema';
import { AdminRouteError, handleAdminRoute } from '@/lib/auth/require-admin';
import { logActivity } from '@/lib/crm/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  isPublished: z.boolean(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return handleAdminRoute(async (admin) => {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AdminRouteError('Invalid request', 400);
    }

    const [review] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!review) {
      throw new AdminRouteError('Review not found', 404);
    }

    await db
      .update(reviews)
      .set({ isPublished: parsed.data.isPublished })
      .where(eq(reviews.id, id));

    await logActivity({
      opportunityId: review.opportunityId,
      contactId: review.contactId,
      adminUserId: admin.id,
      type: 'note',
      subject: parsed.data.isPublished
        ? 'Review published to the website'
        : 'Review unpublished',
      metadata: { reviewId: review.id },
    });

    return { success: true as const };
  });
}
