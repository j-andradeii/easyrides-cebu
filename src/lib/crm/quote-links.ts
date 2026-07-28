/**
 * Quote link and expiry primitives.
 *
 * Split out from ./quotes.ts because `repository.ts` needs the live quote URL
 * when building message templates, while `quotes.ts` needs `repository.ts` for
 * activity logging — importing them into each other would be a cycle. This
 * module depends on nothing but the database and the site URL.
 */

import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { db, type DbExecutor } from '@/db/client';
import { quotes, type Quote } from '@/db/schema';
import { siteUrl } from './site';

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

/** The live quote link for message templates, if there is one. */
export async function latestOpenQuoteUrl(
  opportunityId: string,
  executor: DbExecutor = db
): Promise<string | null> {
  const [row] = await executor
    .select({ token: quotes.token, status: quotes.status, validUntil: quotes.validUntil })
    .from(quotes)
    .where(eq(quotes.opportunityId, opportunityId))
    .orderBy(desc(quotes.createdAt))
    .limit(1);

  if (!row) return null;
  if (row.status === 'cancelled' || row.status === 'declined') return null;
  if (isQuoteExpired({ status: row.status, validUntil: row.validUntil })) return null;

  return quoteUrl(row.token);
}
