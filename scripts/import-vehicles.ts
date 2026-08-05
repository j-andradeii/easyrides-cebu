/**
 * Seeds the fleet that used to be hard-coded at the top of `FleetSection.tsx`,
 * so /admin/vehicles has something to manage on day one.
 *
 *   npm run import-vehicles                   # insert the vehicles that are missing
 *   npm run import-vehicles -- --force        # also overwrite ones that exist
 *   npm run import-vehicles -- --only-if-empty # do nothing unless the table is bare
 *
 * Idempotent by vehicle class: a class already in the database is left exactly
 * as it is unless --force is passed, because by then the portal's copy — not
 * this file — is the one an editor has been working on.
 *
 * --only-if-empty exists because "idempotent by class" is not the same as safe
 * to re-run forever. Rename "Sedan" to "Sedan (AT)" in the portal and the seed's
 * "Sedan" looks MISSING, so the next run re-inserts it — leaving two cards on
 * the landing page. The deploy workflow passes this flag for exactly that
 * reason: it wants to fill a fresh database, not to top up a live fleet.
 *
 * The array below is a verbatim copy of the component's old constant. It is a
 * one-time import source, not the live fleet; after this runs, the table is.
 */

import { config as loadEnv } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../src/db/schema';
import type { Vehicle } from '../src/types/vehicle';

loadEnv({ path: '.env.local' });

const FLEET: Vehicle[] = [
  {
    type: 'Sedan',
    models: 'Vios / Mirage G4 (AT)',
    capacity: '5-seater',
    rate: 1500,
    features: ['Air Conditioned', 'Automatic Transmission', 'Fuel Efficient', 'City-friendly'],
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/vios.png',
    popular: false,
  },
  {
    type: 'SUV',
    models: 'Xpander / Avanza / Innova (AT)',
    capacity: '7-seater',
    rate: 2500,
    features: [
      'Air Conditioned',
      'Automatic Transmission',
      'Spacious Interior',
      'Family-friendly',
    ],
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/suv.png',
    popular: true,
  },
  {
    type: 'Van',
    models: 'NV350 / Hiace Commuter',
    capacity: '15-seater',
    rate: 3500,
    features: ['Air Conditioned', 'Group Travel', 'Luggage Space', 'Tour-ready'],
    image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/van.png',
    popular: false,
  },
];

async function main() {
  const force = process.argv.includes('--force');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — check .env.local');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    if (process.argv.includes('--only-if-empty')) {
      const [any] = await db.select({ id: schema.vehicles.id }).from(schema.vehicles).limit(1);
      if (any) {
        console.log('Vehicles already exist — leaving the fleet alone (--only-if-empty).');
        return;
      }
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const [index, vehicle] of FLEET.entries()) {
      const values = {
        type: vehicle.type,
        models: vehicle.models,
        capacity: vehicle.capacity,
        rate: vehicle.rate,
        features: vehicle.features,
        image: vehicle.image,
        popular: vehicle.popular,
        isPublished: true,
        // Array order is the order the site has always shown them in; keeping it
        // means nothing on the landing page moves because of this import.
        sortOrder: index,
      };

      const [existing] = await db
        .select({ id: schema.vehicles.id })
        .from(schema.vehicles)
        .where(eq(schema.vehicles.type, vehicle.type))
        .limit(1);

      if (!existing) {
        await db.insert(schema.vehicles).values(values);
        inserted += 1;
        console.log(`  + ${vehicle.type}`);
        continue;
      }

      if (!force) {
        skipped += 1;
        console.log(`  = ${vehicle.type} (already imported)`);
        continue;
      }

      await db
        .update(schema.vehicles)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.vehicles.id, existing.id));
      updated += 1;
      console.log(`  ~ ${vehicle.type} (overwritten)`);
    }

    console.log(
      `\n✔ ${inserted} inserted, ${updated} overwritten, ${skipped} left alone (${FLEET.length} in the seed).`
    );
    console.log('Manage them at /admin/vehicles');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('import-vehicles failed:', error);
  process.exit(1);
});
