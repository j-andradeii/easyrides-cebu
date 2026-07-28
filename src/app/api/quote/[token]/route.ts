/**
 * GET /api/quote/[token] — the public checkout payload.
 *
 * The token *is* the authentication: it is unguessable, scoped to one deal, and
 * expires. No account, no password — the customer taps a link from their email
 * and sees their price.
 */

import { NextResponse } from 'next/server';

import { resolveQuoteByToken } from '@/lib/crm/quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  try {
    const resolved = await resolveQuoteByToken(token);

    // Don't distinguish "never existed" from "deleted" — a 404 either way.
    if (!resolved) {
      return NextResponse.json({ message: 'This quote link is not valid' }, { status: 404 });
    }

    return NextResponse.json(resolved.publicQuote);
  } catch (error) {
    console.error('[quote] lookup failed:', error);
    return NextResponse.json({ message: 'Could not load this quote' }, { status: 500 });
  }
}
