/**
 * JWT helpers built on `jose` (plan §9.1).
 *
 * Deliberately edge-safe — no bcrypt, no database, no Node built-ins — because
 * `src/middleware.ts` runs on the Edge runtime and imports this module to gate
 * /admin/**. Password hashing lives in the Node-only route handlers.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export const AUTH_COOKIE = 'auth-token';

export type AdminRole = 'owner' | 'admin' | 'agent';

/** The claims we add on top of the registered JWT ones. */
export interface AdminClaims {
  email: string;
  name: string;
  role: AdminRole;
}

export type AdminTokenPayload = JWTPayload & AdminClaims & { sub: string };

/** Session length. A staff portal wants a working day, not 15 minutes. */
const DEFAULT_TTL = '8h';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET is missing or too short. Set a long random value in .env.local (see plan §13).'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: AdminClaims & { sub: string }): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_TTL ?? DEFAULT_TTL)
    .sign(getSecret());
}

/** Returns the payload, or null for a missing/expired/tampered token. */
export async function verifyAccessToken(
  token: string | undefined | null
): Promise<AdminTokenPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Cookie options. `secure` is off on plain-HTTP localhost, otherwise the login
 * cookie would be silently dropped in local dev.
 */
export function authCookieOptions(maxAgeSeconds = 60 * 60 * 8) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** True once a token is past the halfway mark — used to slide the session. */
export function shouldRefresh(payload: AdminTokenPayload): boolean {
  if (!payload.exp || !payload.iat) return false;
  const halfway = payload.iat + (payload.exp - payload.iat) / 2;
  return Date.now() / 1000 > halfway;
}
