/**
 * Pushes a fleet edit onto the live site immediately.
 *
 * The landing page now renders per request (`dynamic = 'force-dynamic'` in
 * app/page.tsx), so this clears the client-side Router Cache rather than a
 * server-held copy — see the note in `lib/tours/revalidate`. The fleet only
 * appears on the landing page, so that is the single path to bust.
 */

import 'server-only';

import { revalidatePath } from 'next/cache';

export function revalidateFleetPages(): void {
  revalidatePath('/');
}
