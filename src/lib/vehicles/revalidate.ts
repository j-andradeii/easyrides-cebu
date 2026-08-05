/**
 * Pushes a fleet edit onto the live site immediately.
 *
 * The landing page is statically rendered and revalidated on a timer
 * (`export const revalidate` in app/page.tsx), so without this an admin would
 * change a rate and still see the old one. The fleet only appears on the
 * landing page, so that is the single path to bust.
 */

import 'server-only';

import { revalidatePath } from 'next/cache';

export function revalidateFleetPages(): void {
  revalidatePath('/');
}
