/**
 * POST /api/inquiries — the public lead-capture endpoint (plan §8.1).
 *
 * Replaces the Google Sheets intake. All three site forms already post this
 * shape through `queryService.submitQuery()`, so they needed no changes.
 */

import { NextResponse } from 'next/server';

import { createInquiry, isRateLimited } from '@/lib/crm/intake';
import { inquirySubmissionSchema } from '@/models/inquiry.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The message the three forms already display on success. */
const SUCCESS_MESSAGE = 'Booking inquiry received! We will contact you shortly.';

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip');
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = inquirySubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid submission data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // §15 — honeypot. Bots fill every field; humans never see this one. Answer
  // with the normal success shape so the bot has nothing to learn.
  if (parsed.data.website) {
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  }

  const ipAddress = clientIp(request);

  try {
    if (await isRateLimited(ipAddress)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please message us on WhatsApp instead.' },
        { status: 429 }
      );
    }

    const result = await createInquiry({
      data: parsed.data,
      rawPayload: body,
      ipAddress,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGE,
      inquiryId: result.inquiryId,
    });
  } catch (error) {
    console.error('Inquiry intake error:', error);
    return NextResponse.json(
      { error: 'Failed to process booking. Please try again or contact us directly.' },
      { status: 500 }
    );
  }
}
