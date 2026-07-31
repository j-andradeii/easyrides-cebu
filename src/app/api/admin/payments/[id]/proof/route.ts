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

/**
 * Builds a Content-Disposition value that cannot throw on the filename.
 *
 * Header values are ByteStrings — every code unit must be <= 255 — and the
 * stored filename is whatever the customer's device called the file. macOS
 * screenshots are the case that broke this: "5.02.12 AM.webp" separates the
 * time from AM/PM with U+202F (narrow no-break space, 8239), so assigning it
 * raw threw `TypeError: Cannot convert argument to a ByteString` and, because
 * this route builds its own Response instead of going through
 * `handleAdminRoute`, the admin just saw a 500 and a broken image.
 *
 * RFC 6266: `filename` carries an ASCII-safe fallback for old clients,
 * `filename*` carries the real UTF-8 name percent-encoded. Browsers that
 * understand `filename*` prefer it, so the true name still reaches the user.
 */
function contentDisposition(filename: string | null): string {
  const raw = filename && filename.trim() ? filename : 'proof';
  // Printable ASCII only; quotes and backslashes would break out of the quoted string.
  const ascii = raw.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '') || 'proof';
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(raw)}`;
}

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
      'Content-Disposition': contentDisposition(payment.proofFilename),
      // Private: the image is per-admin-session, never a shared CDN object.
      'Cache-Control': 'private, max-age=300',
    },
  });
}
