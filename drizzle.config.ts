import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnv({ path: '.env.local' });

/**
 * drizzle-kit runs from the HOST, so it uses the localhost:5432 DATABASE_URL in
 * .env.local (the docker "db" service maps that port). Inside the compose
 * network the app container overrides DATABASE_URL to use host "db".
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
