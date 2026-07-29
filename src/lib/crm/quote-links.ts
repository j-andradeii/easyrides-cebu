/**
 * Quote link and expiry primitives.
 *
 * Split out from ./quotes.ts because `repository.ts` needs the live quote URL
 * when building message templates, while `quotes.ts` needs `repository.ts` for
 * activity logging — importing them into each other would be a cycle. This
 * module depends on nothing but the database and the site URL.
 */

import 'server-only';

import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import { quotes, type Quote } from '@/db/schema';
import { siteUrl } from './site';

/** Statuses a customer can still act on — the quote is live and unsettled. */
export const OPEN_QUOTE_STATUSES = ['sent', 'viewed'] as const;

/** A short human reference like "Q-8F3A21" for phone conversations. */
export function quoteReference(quoteId: string): string {
  return `Q-${quoteId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

export function quoteUrl(token: string): string {
  return `${siteUrl()}/quote/${token}`;
}

/** True once the quote is past its validity and nobody has settled it. */
export function isQuoteExpired(quote: Pick<Quote, 'status' | 'validUntil'>): boolean {
  if (quote.status === 'accepted' || quote.status === 'declined' || quote.status === 'cancelled') {
    return false;
  }
  return quote.validUntil.getTime() < Date.now();
}

/**
 * The link a "you still have a quote waiting" message should point at: the
 * newest one the customer can still act on. A deal can carry more than one —
 * a deposit already paid and a balance still open — so this deliberately looks
 * past settled quotes rather than reading only the newest row.
 */
export async function latestOpenQuoteUrl(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<string | null> {
  const [row] = await executor
    .select({ token: quotes.token })
    .from(quotes)
    .where(
      and(
        eq(quotes.opportunityId, opportunityId),
        inArray(quotes.status, [...OPEN_QUOTE_STATUSES]),
        gte(quotes.validUntil, new Date())
      )
    )
    .orderBy(desc(quotes.createdAt))
    .limit(1);

  return row ? quoteUrl(row.token) : null;
}

/**
 * What the customer still owes on this deal: the total of every quote that is
 * live and unpaid. Zero once everything has been settled — which is the normal
 * case, since most deals carry a single quote.
 */
export async function outstandingQuoteTotal(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<string> {
  const [row] = await executor
    .select({ total: sql<string>`coalesce(sum(${quotes.total}), 0)::text` })
    .from(quotes)
    .where(
      and(
        eq(quotes.opportunityId, opportunityId),
        inArray(quotes.status, [...OPEN_QUOTE_STATUSES]),
        gte(quotes.validUntil, new Date())
      )
    );

  return row?.total ?? '0';
}
