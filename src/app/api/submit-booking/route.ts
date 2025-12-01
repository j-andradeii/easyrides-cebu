import { NextResponse } from 'next/server';
import { bookingSubmissionSchema } from '@/models/booking.schema';

// Google Sheets API integration
// To enable, install: npm install googleapis
// And set up environment variables:
// - GOOGLE_SHEETS_CLIENT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY
// - GOOGLE_SPREADSHEET_ID

interface SheetResult {
  success: boolean;
  message: string;
}

async function appendToGoogleSheet(data: Record<string, unknown>): Promise<SheetResult> {
  // Check if Google Sheets is configured
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    // Log the submission for development/testing
    console.log('=== New Booking Submission ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('==============================');
    return { success: true, message: 'Logged locally (Google Sheets not configured)' };
  }

  try {
    // Try to use googleapis if available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { google } = require('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare row data
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      data.fullName || '',
      data.email || '',
      data.phone || '',
      data.serviceType || '',
      data.vehicleType || '',
      data.preferredDate || '',
      data.message || '',
      data.addDriver ? 'Yes' : 'No',
      data.source || '',
    ];

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:J', // Adjust based on your sheet structure
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return { success: true, message: 'Added to Google Sheets' };
  } catch (error) {
    // If googleapis is not installed or there's an error, log and continue
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      console.log('googleapis not installed. Logging submission locally.');
      console.log('To enable Google Sheets: npm install googleapis');
      console.log('Submission data:', JSON.stringify(data, null, 2));
      return { success: true, message: 'Logged locally (googleapis not installed)' };
    }

    console.error('Google Sheets error:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the submission
    const validationResult = bookingSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Save to Google Sheets (or log if not configured)
    const result = await appendToGoogleSheet(data);

    return NextResponse.json({
      ...result,
      message: 'Booking inquiry received! We will contact you shortly.',
    });
  } catch (error) {
    console.error('Booking submission error:', error);

    return NextResponse.json(
      { error: 'Failed to process booking. Please try again or contact us directly.' },
      { status: 500 }
    );
  }
}
