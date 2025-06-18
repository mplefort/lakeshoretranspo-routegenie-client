import axios from 'axios';
import qs from 'qs';
import fs from 'fs';
import path from 'path';
import { RG_HOST, RG_CLIENT_ID, RG_CLIENT_SECRET, RG_USER_ID } from '../config';

// Obtain OAuth2 access token from RouteGenie API using client credentials
export async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(`${RG_CLIENT_ID}:${RG_CLIENT_SECRET}`).toString('base64');
  const body = qs.stringify({ grant_type: 'client_credentials' });
  const res = await axios.post(
    `${RG_HOST}/oauth2/token/`,
    body,
    {
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return res.data.access_token; // Return the access token string
}

// Format a date string MM/DD/YYYY to YYYY_MM_DD for filenames
function formatDateForFile(dateStr: string): string {
  const [month, day, year] = dateStr.split('/');
  return `${year}_${month.padStart(2,'0')}_${day.padStart(2,'0')}`;
}

// Download a CSV file from the given URL, retrying if the file is not ready (still generating)
async function downloadCsvWhenReady(csvUrl: string, filePath: string): Promise<void> {
  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
  let attempt = 1;
  console.log(`⬇️ Attempt to download CSV to ${filePath}`);
  while (true) {
    const dl = await axios.get(csvUrl, { responseType: 'stream' });
    // Save the downloaded file to disk
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      dl.data.pipe(writer);
      writer.on('finish', () => resolve(undefined)); // Only resolve when writing is finished
      writer.on('error', reject);
    });

    // Check if the file is actually the "report generating" HTML message
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<title>Report generating</title>')) {
      console.log('✅ Report ready.');
      break; // Exit loop if the file is a real CSV
    }
    console.log('⏳ Still generating; retrying in 10s...');
    await wait(10000); // Wait 10 seconds before retrying
    attempt++;
  }
}


// Main function to generate and download a billing report to CSV
export async function generateBillingReport(
  periodFrom: string, // Start date (MM/DD/YYYY)
  periodTo: string,   // End date (MM/DD/YYYY)
  outputDir: string   // Directory to save the CSV
): Promise<void> {
  const token = await getAccessToken();

  // Fetch available report templates for the configured user
  const templates = await axios.get(
    `${RG_HOST}/open_api/api/v1/report_template/`,
    { headers: { Authorization: `Bearer ${token}` }, params: { user_id: RG_USER_ID } }
  );

  // Find the "Billing Template" report template
  const template = templates.data.results.find((t: any) => t.name === 'Weekly Billing Codes Report template');
  if (!template) throw new Error(`No Weekly Billing Codes Report template for user ${RG_USER_ID}`);

  // Request the report to be generated for the given period
  const gen = await axios.post(
    `${RG_HOST}/open_api/api/v1/report/`,
    { name: 'Weekly Billing Report', creator: RG_USER_ID, template: template.id, period_from: periodFrom, period_to: periodTo },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  const csvUrl: string = gen.data.csv; // URL to download the generated CSV

  // Ensure the output directory exists
  await fs.promises.mkdir(outputDir, { recursive: true });
  const prefix = `${formatDateForFile(periodFrom)}-${formatDateForFile(periodTo)}`;
  const filePath = path.join(outputDir, `${prefix}_billing.csv`);

  // Download the CSV, retrying if necessary until the report is ready
  await downloadCsvWhenReady(csvUrl, filePath);
  console.log(`✅ Saved to ${filePath}`);
}
