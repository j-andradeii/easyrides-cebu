/**
 * Wipes every lead record so you can test the funnel from a clean slate.
 *
 *   npm run db:reset-leads              # dry run — shows what would go
 *   npm run db:reset-leads -- --yes     # actually delete
 *
 * DELETES: contacts, inquiries, opportunities, activities, tasks,
 *          workflow_enrollments, reviews, referrals
 * KEEPS:   admin_users, pipelines, pipeline_stages, workflows
 *
 * Never run this against production — there is no undo.
 */

import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

import * as schema from '../src/db/schema';

loadEnv({ path: '.env.local' });

/** Order is irrelevant (TRUNCATE ... CASCADE), but reads as the dependency chain. */
const LEAD_TABLES = [
  'activities',
  'tasks',
  'workflow_enrollments',
  'reviews',
  'referrals',
  'inquiries',
  'opportunities',
  'contacts',
] as const;

const KEPT_TABLES = ['admin_users', 'pipelines', 'pipeline_stages', 'workflows'] as const;

async function counts(
  db: ReturnType<typeof drizzle<typeof schema>>,
  tables: readonly string[]
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const table of tables) {
    const [row] = await db.execute<{ count: string }>(
      sql`select count(*)::text as count from ${sql.identifier(table)}`
    );
    result[table] = Number(row?.count ?? 0);
  }
  return result;
}

async function main() {
  const confirmed = process.argv.includes('--yes');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set — check .env.local');

  // Guard against pointing this at a managed/production database by accident.
  const isLocal = /@(localhost|127\.0\.0\.1|db):/.test(connectionString);
  if (!isLocal && !process.argv.includes('--force')) {
    console.error(
      'DATABASE_URL does not look local. Refusing to wipe leads.\n' +
        'If you really mean it, re-run with --force.'
    );
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    const before = await counts(db, LEAD_TABLES);
    const total = Object.values(before).reduce((sum, value) => sum + value, 0);

    console.log('Lead records:');
    for (const [table, count] of Object.entries(before)) {
      console.log(`  ${table.padEnd(22)} ${count}`);
    }

    if (total === 0) {
      console.log('\nNothing to delete — already clean.');
      return;
    }

    if (!confirmed) {
      console.log(
        `\n${total} row(s) would be deleted. Re-run with --yes to go ahead:\n` +
          '  npm run db:reset-leads -- --yes'
      );
      return;
    }

    await db.execute(
      sql`truncate table ${sql.join(
        LEAD_TABLES.map((table) => sql.identifier(table)),
        sql`, `
      )} cascade`
    );

    const kept = await counts(db, KEPT_TABLES);
    console.log(`\n✔ Deleted ${total} lead row(s).`);
    console.log('Kept:');
    for (const [table, count] of Object.entries(kept)) {
      console.log(`  ${table.padEnd(22)} ${count}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('reset-leads failed:', error);
  process.exit(1);
});
