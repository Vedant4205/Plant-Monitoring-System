import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'your-default-id';

export async function initializeSheets() {
    const auth = new GoogleAuth({
        keyFile: path.join(__dirname, '../../../config/credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();

    // ⚠️ Cast it to expected type to silence type conflict
    return google.sheets({
        version: 'v4',
        auth: authClient as any
    });
}

export async function getSensorData(sheets: any) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:F',
        valueRenderOption: 'FORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    const dataRows = rows[0][0] === 'Timestamp' ? rows.slice(1) : rows;

    return dataRows.slice(-20).reverse(); // show latest data last
}
