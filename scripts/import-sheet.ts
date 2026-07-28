/**
 * Imports historical rows from the old Google Sheet into contacts + inquiries
 * (plan §8.3).
 *
 *   npm run import-sheet -- --dry-run     # preview without writing
 *   npm run import-sheet
 *
 * Reads GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY /
 * GOOGLE_SPREADSHEET_ID from .env.local — the same credentials the retired
 * /api/submit-booking route used.
 *
 * Historical leads are imported as *closed* opportunities (status 'abandoned',
 * stage Lost) and are NOT enrolled in any workflow: nobody wants an automated
 * "still planning your trip?" going out to a lead from last year.
 */

import { config as loadEnv } from 'dotenv';
import { eq, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { DEFAULT_PIPELINE_ID } from '../src/lib/funnel/stages';
import {
  buildOpportunityTitle,
  normalizeEmail,
  normalizePhone,
  toDateOnly,
} from '../src/lib/crm/normalize';
import * as schema from '../src/db/schema';

loadEnv({ path: '.env.local' });

/** Column order written by the old appendToGoogleSheet(). */
const COLUMNS = [
  'timestamp',
  'fullName',
  'email',
  'phone',
  'serviceType',
  'vehicleType',
  'preferredDate',
  'message',
  'addDriver',
  'source',
] as const;

type SheetRow = Partial<Record<(typeof COLUMNS)[number], string>>;

async function fetchRows(): Promise<string[][]> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(
      'Google Sheets is not configured. Set GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SPREADSHEET_ID in .env.local.'
    );
  }

  const { google } = await import('googleapis');

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A:J',
  });

  return (response.data.values ?? []) as string[][];
}

function toSheetRow(values: string[]): SheetRow {
  const row: SheetRow = {};
  COLUMNS.forEach((column, index) => {
    const value = values[index]?.trim();
    if (value) row[column] = value;
  });
  return row;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set — check .env.local');

  const raw = await fetchRows();
  if (raw.length === 0) {
    console.log('The sheet is empty — nothing to import.');
    return;
  }

  // Skip a header row if the first cell isn't a parseable timestamp.
  const firstCell = raw[0]?.[0] ?? '';
  const dataRows = Number.isNaN(new Date(firstCell).getTime()) ? raw.slice(1) : raw;

  console.log(`Found ${dataRows.length} row(s) in the sheet.`);

  if (dryRun) {
    for (const values of dataRows.slice(0, 10)) {
      const row = toSheetRow(values);
      console.log(
        `  ${row.timestamp ?? '?'} · ${row.fullName ?? '(no name)'} · ${normalizePhone(row.phone) ?? '(no phone)'} · ${row.source ?? '?'}`
      );
    }
    if (dataRows.length > 10) console.log(`  … and ${dataRows.length - 10} more`);
    console.log('\nDry run — nothing written. Re-run without --dry-run to import.');
    return;
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  let imported = 0;
  let skipped = 0;

  try {
    const [lostStage] = await db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.key, 'lost'))
      .limit(1);

    if (!lostStage) throw new Error('Pipeline stages are missing — run `npm run db:seed` first.');

    for (const values of dataRows) {
      const row = toSheetRow(values);
      const phone = normalizePhone(row.phone);
      const email = normalizeEmail(row.email);

      if (!phone && !email) {
        skipped += 1;
        continue;
      }

      const createdAt = row.timestamp ? new Date(row.timestamp) : new Date();
      const validCreatedAt = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;

      await db.transaction(async (tx) => {
        const predicates = [];
        if (phone) predicates.push(eq(schema.contacts.phone, phone));
        if (email) predicates.push(eq(schema.contacts.email, email));

        const [existing] = await tx
          .select()
          .from(schema.contacts)
          .where(predicates.length === 1 ? predicates[0] : or(...predicates))
          .limit(1);

        const contact =
          existing ??
          (
            await tx
              .insert(schema.contacts)
              .values({
                fullName: row.fullName ?? null,
                email,
                phone,
                firstSource: row.source ?? 'google-sheet',
                createdAt: validCreatedAt,
                updatedAt: validCreatedAt,
              })
              .returning()
          )[0];

        const [opportunity] = await tx
          .insert(schema.opportunities)
          .values({
            contactId: contact.id,
            pipelineId: DEFAULT_PIPELINE_ID,
            stageId: lostStage.id,
            title: buildOpportunityTitle(row.serviceType, contact.fullName, contact.phone),
            status: 'abandoned',
            serviceType: row.serviceType ?? null,
            vehicleType: row.vehicleType ?? null,
            preferredDate: toDateOnly(row.preferredDate),
            source: row.source ?? 'google-sheet',
            lostReason: 'Imported from the historical Google Sheet',
            createdAt: validCreatedAt,
            updatedAt: validCreatedAt,
            stageChangedAt: validCreatedAt,
          })
          .returning();

        await tx.insert(schema.inquiries).values({
          contactId: contact.id,
          opportunityId: opportunity.id,
          source: row.source ?? 'google-sheet',
          serviceType: row.serviceType ?? null,
          vehicleType: row.vehicleType ?? null,
          preferredDate: toDateOnly(row.preferredDate),
          addDriver: (row.addDriver ?? '').toLowerCase() === 'yes',
          message: row.message ?? null,
          rawPayload: row,
          createdAt: validCreatedAt,
        });
      });

      imported += 1;
    }

    console.log(`\n✔ Imported ${imported} inquiry/inquiries. Skipped ${skipped} (no phone or email).`);
    console.log('Historical leads land in the Lost stage with no automations enrolled.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('import-sheet failed:', error);
  process.exit(1);
});
