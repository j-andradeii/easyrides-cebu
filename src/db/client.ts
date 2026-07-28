/**
 * Drizzle database client — SERVER ONLY.
 *
 * Never import this from a client component: the browser talks to our API
 * routes, never to Postgres directly.
 *
 * The connection is cached on globalThis so Next.js dev hot-reloads reuse one
 * pool instead of opening a new one on every module re-evaluation.
 */

import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local (see docs/CRM_FUNNEL_IMPLEMENTATION_PLAN.md §13).'
  );
}

const globalForDb = globalThis as unknown as {
  __easyrideSql?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__easyrideSql ??
  postgres(connectionString, {
    // Transaction-pooler friendly (Neon / Supabase / pgBouncer).
    prepare: false,
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__easyrideSql = client;
}

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;

/** A transaction handle — the type passed to `db.transaction(async (tx) => ...)`. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Either the pooled client or an open transaction. Handy for helpers that run in both. */
export type DbExecutor = Db | DbTransaction;
