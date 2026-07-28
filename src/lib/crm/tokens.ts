/**
 * Code and token generation — server only (uses Node's crypto).
 *
 * Kept apart from ./normalize.ts so client components can import the label
 * helpers without dragging `node:crypto` into the browser bundle.
 */

import 'server-only';

import { randomBytes } from 'crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters

/** A shareable, human-readable code like 'JUAN-7QK2' (plan §7A.3 rule 4). */
export function generateReferralCode(fullName: string | null | undefined): string {
  const base =
    (fullName ?? '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4) || 'RIDE';

  const bytes = randomBytes(4);
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${base}-${suffix}`;
}

/** Unguessable token for the /review/[token] links. */
export function generateToken(): string {
  return randomBytes(24).toString('base64url');
}
