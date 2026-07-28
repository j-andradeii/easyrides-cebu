/**
 * Creates (or updates) a portal admin — plan §9.1 "No public signup".
 *
 *   npm run create-admin -- --email you@example.com --name "Joseph" --role owner --password "…"
 *
 * Omit --password and one is generated and printed once.
 */

import { config as loadEnv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../src/db/schema';

loadEnv({ path: '.env.local' });

type Role = 'owner' | 'admin' | 'agent';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = 'true';
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const email = args.email?.trim().toLowerCase();
  const name = args.name?.trim();
  const role = (args.role ?? 'owner') as Role;
  const password = args.password ?? randomBytes(9).toString('base64url');

  if (!email || !name) {
    console.error(
      'Usage: npm run create-admin -- --email you@example.com --name "Your Name" [--role owner|admin|agent] [--password "…"]'
    );
    process.exit(1);
  }

  if (!['owner', 'admin', 'agent'].includes(role)) {
    console.error(`Invalid role "${role}". Use owner, admin or agent.`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters (the login form enforces this too).');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — check .env.local');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const [existing] = await db
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email))
      .limit(1);

    if (existing) {
      await db
        .update(schema.adminUsers)
        .set({ passwordHash, name, role, isActive: true, updatedAt: new Date() })
        .where(eq(schema.adminUsers.id, existing.id));
      console.log(`✔ Updated existing admin ${email} (role: ${role}) and reset the password.`);
    } else {
      await db.insert(schema.adminUsers).values({ email, name, role, passwordHash });
      console.log(`✔ Created admin ${email} (role: ${role}).`);
    }

    if (!args.password) {
      console.log(`\n  Generated password: ${password}`);
      console.log('  Save it now — it is not stored anywhere in plain text.\n');
    }

    console.log('Sign in at /admin/login');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('create-admin failed:', error);
  process.exit(1);
});
