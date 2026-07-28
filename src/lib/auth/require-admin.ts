/**
 * Route-handler guard — defense in depth (plan §11).
 *
 * The middleware already gates /admin/** pages, but middleware does not run for
 * /api/** in this app's matcher, so every admin route handler calls this too.
 */

import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { adminUsers } from '@/db/schema';
import { AUTH_COOKIE, verifyAccessToken, type AdminRole } from './jwt';

export interface AdminIdentity {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/**
 * Any error an admin route wants to surface with a specific status — auth
 * failures, validation problems, missing records. `handleAdminRoute` turns it
 * into a JSON response; anything else becomes a 500.
 */
export class AdminRouteError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'AdminRouteError';
  }
}

/**
 * Resolves the signed-in admin from the auth cookie. The token is re-checked
 * against the database so a deactivated account loses access immediately
 * instead of at token expiry.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const cookieStore = await cookies();
  const payload = await verifyAccessToken(cookieStore.get(AUTH_COOKIE)?.value);
  if (!payload) return null;

  const [user] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, payload.sub))
    .limit(1);

  if (!user || !user.isActive) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/**
 * Throws `AdminRouteError` when the caller is not an authenticated admin with a
 * permitted role. Use with `handleAdminRoute` below.
 */
export async function requireAdmin(allowedRoles?: AdminRole[]): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();

  if (!identity) {
    throw new AdminRouteError('Not authenticated', 401);
  }
  if (allowedRoles && !allowedRoles.includes(identity.role)) {
    throw new AdminRouteError('You do not have access to this action', 403);
  }

  return identity;
}

/**
 * Wraps an admin route handler: authenticates, then converts auth failures and
 * unexpected errors into clean JSON responses.
 */
export async function handleAdminRoute<T>(
  handler: (admin: AdminIdentity) => Promise<T>,
  options?: { roles?: AdminRole[] }
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin(options?.roles);
    const data = await handler(admin);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AdminRouteError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('[admin-api] unhandled error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
