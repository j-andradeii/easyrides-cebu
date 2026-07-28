/**
 * POST /api/auth/login — plan §9.3.
 *
 * There is no public signup: admins are created with `npm run create-admin`.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers } from '@/db/schema';
import { authCookieOptions, AUTH_COOKIE, signAccessToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/models/validation-schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Same reply for "no such user" and "wrong password" — no account enumeration. */
const INVALID_CREDENTIALS = 'Invalid email or password';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: INVALID_CREDENTIALS }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);

    if (!user || !user.isActive) {
      // Burn a comparable amount of time so timing does not leak account existence.
      await bcrypt.compare(parsed.data.password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
      return NextResponse.json({ message: INVALID_CREDENTIALS }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json({ message: INVALID_CREDENTIALS }, { status: 401 });
    }

    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, token, authCookieOptions());

    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(adminUsers.id, user.id));

    // The token stays in the httpOnly cookie — never in the response body.
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('[auth] login failed:', error);
    return NextResponse.json({ message: 'Login is unavailable right now' }, { status: 500 });
  }
}
