/**
 * GET /api/admin/payments/[id]/proof — the customer's payment screenshot.
 *
 * Returns image bytes rather than JSON, so it authenticates by hand instead of
 * going through `handleAdminRoute`. The guard is the point: these are pictures
 * of people's banking apps, and the reason they live in the database rather
 * than a public bucket is that a bucket URL works for anyone who has it.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { payments } from '@/db/schema';
import { getAdminIdentity } from '@/lib/auth/require-admin';
import { decodeProof } from '@/lib/crm/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const admin = await getAdminIdentity();
  if (!admin) {
    return new Response('Not authenticated', { status: 401 });
  }

  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) {
    return new Response('Payment not found', { status: 404 });
  }

  const bytes = decodeProof(payment);
  if (!bytes) {
    return new Response('No proof was uploaded for this payment', { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': payment.proofMime ?? 'application/octet-stream',
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `inline; filename="${(payment.proofFilename ?? 'proof').replace(/"/g, '')}"`,
      // Private: the image is per-admin-session, never a shared CDN object.
      'Cache-Control': 'private, max-age=300',
    },
  });
}
