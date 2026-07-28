/**
 * Published reviews → landing page social proof (plan §7A.2).
 *
 * Closes the loop: a review approved in /admin/reviews shows up on the site,
 * where it lifts conversion on the next batch of new leads.
 */

import 'server-only';

import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { contacts, reviews } from '@/db/schema';

export interface PublishedTestimonial {
  id: string;
  quote: string;
  name: string;
  rating: number;
}

/** Shows only the last name initial — customers didn't sign up to be named in full. */
function displayName(fullName: string | null): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return 'EasyRideCebu guest';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

/**
 * Never throws: if the database is unreachable at build/render time the landing
 * page still renders with its curated testimonials.
 */
export async function getPublishedTestimonials(limit = 3): Promise<PublishedTestimonial[]> {
  try {
    const rows = await db
      .select({
        id: reviews.id,
        comment: reviews.comment,
        rating: reviews.rating,
        fullName: contacts.fullName,
        submittedAt: reviews.submittedAt,
      })
      .from(reviews)
      .innerJoin(contacts, eq(contacts.id, reviews.contactId))
      .where(and(eq(reviews.isPublished, true), isNotNull(reviews.comment)))
      .orderBy(desc(reviews.submittedAt))
      .limit(limit);

    return rows
      .filter((row) => row.comment && row.comment.trim().length > 0)
      .map((row) => ({
        id: row.id,
        quote: row.comment!.trim(),
        name: displayName(row.fullName),
        rating: row.rating ?? 5,
      }));
  } catch (error) {
    console.error('[testimonials] could not load published reviews:', error);
    return [];
  }
}
