/**
 * Drizzle database client — SERVER ONLY.
 *
 * Never import this from a client component: the browser talks to our API
 * routes, never to Postgres directly.
 *
 * The connection is cached on globalThis so Next.js dev hot-reloads reuse one
 * pool instead of opening a new one on every module re-evaluation.
 *
 * Connecting is DEFERRED to the first query. `next build` imports every route
 * module to collect page data, so anything done at module scope here runs at
 * build time — and postgres() parses DATABASE_URL with `new URL()` the moment
 * it is called. A build box legitimately has no database credentials (on CI,
 * `vercel pull` cannot read env vars marked Sensitive and writes a placeholder),
 * so an eager call turned a missing secret into `TypeError: Invalid URL` and
 * failed the build. Nothing below touches process.env until a query is issued.
 */

import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as {
  __easyrideSql?: ReturnType<typeof postgres>;
  __easyrideDb?: DrizzleDb;
};

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (see docs/CRM_FUNNEL_IMPLEMENTATION_PLAN.md §13).'
    );
  }

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

  return drizzle(client, { schema });
}

function getDb(): DrizzleDb {
  const cached = globalForDb.__easyrideDb ?? createDb();
  globalForDb.__easyrideDb = cached;
  return cached;
}

/**
 * Stands in for the drizzle instance and builds it on first property access, so
 * `db.select()` behaves exactly as before while `import { db }` stays free of
 * side effects. Methods are bound to the real instance rather than invoked with
 * the proxy as `this` — drizzle reads internal state off `this`, and handing it
 * the proxy would re-enter this trap on every internal field read.
 */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, property) {
    const value = Reflect.get(getDb() as object, property);
    return typeof value === 'function' ? value.bind(getDb()) : value;
  },
  has(_target, property) {
    return Reflect.has(getDb() as object, property);
  },
});

export { schema };
export type Db = DrizzleDb;

/** A transaction handle — the type passed to `db.transaction(async (tx) => ...)`. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Either the pooled client or an open transaction. Handy for helpers that run in both. */
export type DbExecutor = Db | DbTransaction;
