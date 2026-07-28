/**
 * GET /api/auth/me — portal bootstrap (plan §9.3).
 *
 * Also slides the session: once the token is past its halfway point, a fresh
 * one is issued so an admin working all day is never logged out mid-task.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import {
  AUTH_COOKIE,
  authCookieOptions,
  shouldRefresh,
  signAccessToken,
  verifyAccessToken,
} from '@/lib/auth/jwt';
import { getAdminIdentity } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const identity = await getAdminIdentity();

  if (!identity) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const payload = await verifyAccessToken(cookieStore.get(AUTH_COOKIE)?.value);

  if (payload && shouldRefresh(payload)) {
    const token = await signAccessToken({
      sub: identity.id,
      email: identity.email,
      name: identity.name,
      role: identity.role,
    });
    cookieStore.set(AUTH_COOKIE, token, authCookieOptions());
  }

  return NextResponse.json({ user: identity });
}
