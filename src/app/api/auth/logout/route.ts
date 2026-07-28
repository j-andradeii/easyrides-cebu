/** POST /api/auth/logout — clears the session cookie (plan §9.3). */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { AUTH_COOKIE, authCookieOptions } from '@/lib/auth/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, '', { ...authCookieOptions(0), maxAge: 0 });
  return NextResponse.json({ success: true });
}
