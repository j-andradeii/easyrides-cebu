/**
 * Public review capture — plan §7A.2, §7A.6.
 *
 *   GET  /api/reviews?token=…  → who this link belongs to (for the page to greet them)
 *   POST /api/reviews          → submit a rating / NPS / comment
 *
 * Token-gated rather than logged in: the customer taps a link from the W4
 * email and leaves feedback in one tap.
 *
 * Compliance note (§7A.2): promoters and detractors BOTH get the public review
 * links. We additionally route unhappy customers to private recovery, but we
 * never hide the public option from anyone — that would be review gating.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { contacts, opportunities, reviews } from '@/db/schema';
import { firstName, serviceLabel } from '@/lib/crm/normalize';
import { buildTemplateContext, logActivity } from '@/lib/crm/repository';
import { deliverMessage } from '@/lib/messaging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 4-5 stars, or NPS 9-10, means "happy" (§7A.1). */
function computeIsPromoter(rating: number | null, nps: number | null): boolean {
  if (rating !== null) return rating >= 4;
  if (nps !== null) return nps >= 9;
  return false;
}

const submitSchema = z.object({
  token: z.string().min(10).max(200),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  nps: z.number().int().min(0).max(10).nullable().optional(),
  comment: z.string().max(2000).optional(),
  /** Set when the customer clicks out to Google/Facebook. */
  publicChannel: z.enum(['google', 'facebook', 'tripadvisor']).optional(),
});

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ message: 'Missing token' }, { status: 400 });
  }

  const [row] = await db
    .select({ review: reviews, contact: contacts, opportunity: opportunities })
    .from(reviews)
    .innerJoin(contacts, eq(contacts.id, reviews.contactId))
    .leftJoin(opportunities, eq(opportunities.id, reviews.opportunityId))
    .where(eq(reviews.token, token))
    .limit(1);

  if (!row) {
    return NextResponse.json({ message: 'This link is no longer valid' }, { status: 404 });
  }

  return NextResponse.json({
    name: firstName(row.contact.fullName),
    service: serviceLabel(row.opportunity?.serviceType),
    tripDate: row.opportunity?.preferredDate ?? null,
    referralCode: row.contact.referralCode,
    alreadySubmitted: row.review.submittedAt !== null,
    rating: row.review.rating,
    nps: row.review.nps,
  });
}

export async function POST(request: Request) {
  const parsed = submitSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid feedback' }, { status: 400 });
  }

  const { token, comment, publicChannel } = parsed.data;
  const rating = parsed.data.rating ?? null;
  const nps = parsed.data.nps ?? null;

  if (rating === null && nps === null && !publicChannel) {
    return NextResponse.json({ message: 'Give us a rating first' }, { status: 400 });
  }

  try {
    const [row] = await db
      .select({ review: reviews, contact: contacts })
      .from(reviews)
      .innerJoin(contacts, eq(contacts.id, reviews.contactId))
      .where(eq(reviews.token, token))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: 'This link is no longer valid' }, { status: 404 });
    }

    // A follow-up click-out shouldn't wipe the rating already captured.
    if (publicChannel && rating === null && nps === null) {
      await db
        .update(reviews)
        .set({ leftPublic: true, publicChannel })
        .where(eq(reviews.id, row.review.id));

      await logActivity({
        opportunityId: row.review.opportunityId,
        contactId: row.contact.id,
        type: 'note',
        subject: `Clicked through to leave a ${publicChannel} review`,
      });

      return NextResponse.json({ success: true, isPromoter: row.review.isPromoter });
    }

    const isPromoter = computeIsPromoter(rating, nps);

    await db
      .update(reviews)
      .set({
        rating,
        nps,
        comment: comment ?? null,
        isPromoter,
        submittedAt: new Date(),
        ...(publicChannel ? { leftPublic: true, publicChannel } : {}),
      })
      .where(eq(reviews.id, row.review.id));

    await logActivity({
      opportunityId: row.review.opportunityId,
      contactId: row.contact.id,
      type: 'note',
      subject: `Left feedback — ${rating !== null ? `${rating}★` : `NPS ${nps}`}`,
      body: comment ?? null,
      metadata: { reviewId: row.review.id, isPromoter },
    });

    // Detractors get a private recovery path: alert the team so someone can
    // call before this turns into a public one-star.
    if (!isPromoter && row.review.opportunityId) {
      const [opportunity] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, row.review.opportunityId))
        .limit(1);

      if (opportunity) {
        const context = await buildTemplateContext(opportunity, row.contact);
        await deliverMessage({
          channel: 'email',
          template: 'detractor_alert',
          context,
          audience: 'admin',
        }).catch((error) => console.error('[reviews] detractor alert failed:', error));
      }
    }

    return NextResponse.json({ success: true, isPromoter });
  } catch (error) {
    console.error('[reviews] submit failed:', error);
    return NextResponse.json({ message: 'Could not save your feedback' }, { status: 500 });
  }
}
