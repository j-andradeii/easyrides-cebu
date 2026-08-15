/**
 * Resets one portal admin's password. Nothing else.
 *
 *   npm run reset-admin-password                              # generate one and print it
 *   npm run reset-admin-password -- --password "…"            # set a specific one
 *   npm run reset-admin-password -- --email someone@else.ph   # a different admin
 *   npm run reset-admin-password -- --env .env.staging        # target staging instead
 *
 * Deliberately narrower than `create-admin`, which is the wrong tool for this:
 * it *upserts*, so a typo in the email silently creates a second account, and it
 * rewrites name and role from its arguments — resetting a password there quietly
 * demotes an owner to whatever `--role` defaulted to. This script only ever
 * UPDATEs `password_hash`, only ever against an account that already exists, and
 * refuses if the email doesn't match one.
 *
 * A password passed with `--password` lands in your shell history. To avoid
 * that, put it in the environment instead:
 *
 *   NEW_ADMIN_PASSWORD='…' npm run reset-admin-password
 */

import { config as loadEnv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../src/db/schema';

/** Whose password this resets when `--email` isn't given. */
const DEFAULT_EMAIL = 'joseph_andrade@outlook.ph';

/** What /admin/login enforces (`loginSchema` in src/models/validation-schemas.ts). */
const MIN_PASSWORD_LENGTH = 8;

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

/**
 * host:port/database, with the credentials stripped.
 *
 * Printed before anything is written because this repo carries both
 * `.env.local` and `.env.staging` — resetting the right password in the wrong
 * database looks exactly like success until nobody can log in.
 */
function describeTarget(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `${url.host}${url.pathname}`;
  } catch {
    return '(could not parse DATABASE_URL)';
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const envFile = args.env ?? '.env.local';
  loadEnv({ path: envFile });

  const email = (args.email ?? DEFAULT_EMAIL).trim().toLowerCase();
  const supplied = args.password ?? process.env.NEW_ADMIN_PASSWORD;
  const password = supplied ?? randomBytes(9).toString('base64url');
  const activate = args.activate === 'true';

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters — the login form rejects anything shorter.`
    );
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(`DATABASE_URL is not set — check ${envFile}`);
  }

  console.log(`Env:    ${envFile}`);
  console.log(`Target: ${describeTarget(connectionString)}`);
  console.log(`Admin:  ${email}\n`);

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    const [existing] = await db
      .select({
        id: schema.adminUsers.id,
        name: schema.adminUsers.name,
        role: schema.adminUsers.role,
        isActive: schema.adminUsers.isActive,
      })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email))
      .limit(1);

    // No account, no reset — creating one here is how you end up with a
    // duplicate admin from a mistyped address and no idea which one is live.
    if (!existing) {
      const others = await db
        .select({ email: schema.adminUsers.email, isActive: schema.adminUsers.isActive })
        .from(schema.adminUsers);

      console.error(`✖ No admin with the email ${email}.`);
      if (others.length === 0) {
        console.error('\nThere are no admin accounts at all. Create one:');
        console.error('  npm run create-admin -- --email you@example.com --name "Your Name"');
      } else {
        console.error('\nAccounts that do exist:');
        for (const other of others) {
          console.error(`  ${other.email}${other.isActive ? '' : '  (deactivated)'}`);
        }
      }
      process.exitCode = 1;
      return;
    }

    // Re-enabling a disabled account is a separate decision from changing its
    // password — someone switched it off on purpose. Say so and make them ask.
    if (!existing.isActive && !activate) {
      console.error(`✖ ${email} is deactivated, so a new password won't get them in.`);
      console.error('   Re-run with --activate to reset the password and re-enable the account.');
      process.exitCode = 1;
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Name and role are untouched on purpose: this resets a credential, it does
    // not re-provision the account.
    await db
      .update(schema.adminUsers)
      .set({
        passwordHash,
        ...(activate ? { isActive: true } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, existing.id));

    console.log(`✔ Reset the password for ${existing.name} <${email}> (role: ${existing.role}).`);
    if (activate && !existing.isActive) {
      console.log('✔ Re-enabled the account.');
    }

    if (!supplied) {
      console.log(`\n  New password: ${password}`);
      console.log('  Save it now — it is stored only as a bcrypt hash.\n');
    }

    console.log('Sign in at /admin/login');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('reset-admin-password failed:', error);
  process.exit(1);
});
