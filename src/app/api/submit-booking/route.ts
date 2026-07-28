/**
 * POST /api/submit-booking — legacy alias, kept for the transition (plan §8.1).
 *
 * The Google Sheets implementation is gone; anything still posting to this path
 * (cached clients, bookmarks, third-party integrations) is forwarded to the
 * Postgres intake so no lead is lost. New code should call /api/inquiries.
 */

import { NextResponse } from 'next/server';

import { createInquiry, isRateLimited } from '@/lib/crm/intake';
import { inquirySubmissionSchema } from '@/models/inquiry.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUCCESS_MESSAGE = 'Booking inquiry received! We will contact you shortly.';

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

  if (parsed.data.website) {
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip');

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
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process booking. Please try again or contact us directly.' },
      { status: 500 }
    );
  }
}
