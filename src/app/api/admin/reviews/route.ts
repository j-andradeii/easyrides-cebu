/** GET /api/admin/reviews — the moderation queue (plan §7A.6, §7A.8). */

import type { NextRequest } from 'next/server';
import { and, desc, eq, isNotNull, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { contacts, reviews } from '@/db/schema';
import { handleAdminRoute } from '@/lib/auth/require-admin';
import type { ReviewRecord } from '@/models/crm.types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleAdminRoute(async (): Promise<{ items: ReviewRecord[] }> => {
    const published = request.nextUrl.searchParams.get('published');

    // Un-submitted rows are just pending invitations — keep them out of the queue.
    const filters: SQL[] = [isNotNull(reviews.submittedAt)];
    if (published === 'true') filters.push(eq(reviews.isPublished, true));
    if (published === 'false') filters.push(eq(reviews.isPublished, false));

    const rows = await db
      .select({ review: reviews, contactName: contacts.fullName })
      .from(reviews)
      .innerJoin(contacts, eq(contacts.id, reviews.contactId))
      .where(and(...filters))
      .orderBy(desc(reviews.submittedAt))
      .limit(200);

    return {
      items: rows.map(({ review, contactName }) => ({
        id: review.id,
        rating: review.rating,
        nps: review.nps,
        comment: review.comment,
        isPromoter: review.isPromoter,
        leftPublic: review.leftPublic,
        publicChannel: review.publicChannel,
        isPublished: review.isPublished,
        token: review.token,
        contactId: review.contactId,
        contactName,
        opportunityId: review.opportunityId,
        submittedAt: review.submittedAt?.toISOString() ?? null,
        createdAt: review.createdAt.toISOString(),
      })),
    };
  });
}
