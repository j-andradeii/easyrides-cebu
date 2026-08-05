/**
 * Moves the tour catalogue out of `src/data/tours.json` and into Postgres, so
 * /admin/tours has something to manage on day one.
 *
 *   npm run import-tours                   # insert the tours that are missing
 *   npm run import-tours -- --force        # also overwrite tours that exist
 *   npm run import-tours -- --only-if-empty # do nothing unless the table is bare
 *
 * Idempotent by slug: a tour already in the database is left exactly as it is
 * unless --force is passed, because by then the portal's copy — not the JSON —
 * is the one an editor has been working on.
 *
 * --only-if-empty exists because "idempotent by slug" is not the same as safe to
 * re-run forever. Rename a tour in the portal and its slug changes, so the JSON's
 * original slug looks MISSING and the next run happily re-inserts it — leaving
 * two copies of one tour, at the old URL and the new. The deploy workflow passes
 * this flag for exactly that reason: it wants to fill a fresh database, not to
 * top up a catalogue an editor now owns.
 *
 * The one shape change is the description. It was plain text; the column now
 * holds the rich-text HTML the portal writes, so each paragraph is wrapped in
 * <p> on the way in and comes back out of the editor unchanged.
 */

import { config as loadEnv } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../src/db/schema';
import toursData from '../src/data/tours.json';
import type { Tour } from '../src/types/tour';

loadEnv({ path: '.env.local' });

/** Plain text → the HTML the rich-text editor round-trips. */
function toRichText(text: string): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

async function main() {
  const force = process.argv.includes('--force');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — check .env.local');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  const tours = toursData.tours as Tour[];

  try {
    if (process.argv.includes('--only-if-empty')) {
      const [any] = await db.select({ id: schema.tours.id }).from(schema.tours).limit(1);
      if (any) {
        console.log('Tours already exist — leaving the catalogue alone (--only-if-empty).');
        return;
      }
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const [index, tour] of tours.entries()) {
      const values = {
        slug: tour.slug,
        title: tour.title,
        shortDescription: tour.shortDescription,
        description: toRichText(tour.description),
        image: tour.image,
        gallery: tour.gallery ?? [],
        duration: tour.duration,
        featured: tour.featured,
        isPublished: true,
        // JSON order is the order the site has always shown them in; keeping it
        // means nothing on the public pages moves because of this import.
        sortOrder: index,
        pricing: tour.pricing,
        itinerary: tour.itinerary,
        inclusions: tour.inclusions,
        exclusions: tour.exclusions,
      };

      const [existing] = await db
        .select({ id: schema.tours.id })
        .from(schema.tours)
        .where(eq(schema.tours.slug, tour.slug))
        .limit(1);

      if (!existing) {
        await db.insert(schema.tours).values(values);
        inserted += 1;
        console.log(`  + ${tour.slug}`);
        continue;
      }

      if (!force) {
        skipped += 1;
        console.log(`  = ${tour.slug} (already imported)`);
        continue;
      }

      await db
        .update(schema.tours)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.tours.id, existing.id));
      updated += 1;
      console.log(`  ~ ${tour.slug} (overwritten)`);
    }

    console.log(
      `\n✔ ${inserted} inserted, ${updated} overwritten, ${skipped} left alone (${tours.length} in the JSON).`
    );
    console.log('Manage them at /admin/tours');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('import-tours failed:', error);
  process.exit(1);
});
