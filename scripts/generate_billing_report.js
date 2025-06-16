require('dotenv').config();
const getAccessToken = require('../route_genie_auth.js'); // Adjust path as needed
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Global report period (MM/DD/YYYY)
const PERIOD_FROM = '05/18/2025';
const PERIOD_TO   = '05/24/2025';

// Utility to format dates for filenames: MM/DD/YYYY → YYYY_MM_DD
function formatDateForFile(dateStr) {
  const [month, day, year] = dateStr.split('/');
  return `${year}_${month.padStart(2, '0')}_${day.padStart(2, '0')}`;
}

// Helper to check if report is HTML "generating" message
function isGeneratingHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('<title>Report generating</title>');
}

// Function to download the CSV file, retrying if it is still generating
async function downloadCsvWhenReady(csvUrl, filePath) {
  const wait = ms => new Promise(res => setTimeout(res, ms));
  let attempt = 1;
  while (true) {
    console.log(`⬇️  Attempt ${attempt}: Downloading CSV to ${filePath}`);
    const downloadRes = await axios.get(csvUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      downloadRes.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Check if file is the HTML "generating" message
    if (!isGeneratingHtml(filePath)) {
      console.log('✅ Report is ready and downloaded.');
      break;
    } else {
      console.log('⏳ Report is still generating. Retrying in 5 seconds...');
      await wait(5000);
      attempt++;
    }
  }
}


async function main() {
  // Ensure the output directory exists
  const reportsDir = path.join(__dirname, '..', 'reports', 'billing');

  await fs.promises.mkdir(reportsDir, { recursive: true });

  // Authenticate once and reuse the token
  const token = await getAccessToken();

  // Only use user 37 (mattlefort)
  const userId = 37;
  console.log(`\n🔍 Processing user ${userId} (mattlefort)`);

  // Get report templates for this user
  const templatesRes = await axios.get(
    `${process.env.RG_HOST}/open_api/api/v1/report_template/`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { user_id: userId }
    }
  );
  const billingTemplate = templatesRes.data.results.find(t => t.name === 'Billing Template');
  if (!billingTemplate) {
    console.log(`❗ No 'Billing Template' found for user ${userId}, exiting.`);
    return;
  }

  // Generate the report
  const genRes = await axios.post(
    `${process.env.RG_HOST}/open_api/api/v1/report/`,
    {
      name: 'Billing Template Report',
      creator: userId,
      template: billingTemplate.id,
      period_from: PERIOD_FROM,
      period_to: PERIOD_TO
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const csvUrl = genRes.data.csv;

  // Download the CSV, waiting if necessary
  const prefix = `${formatDateForFile(PERIOD_FROM)}-${formatDateForFile(PERIOD_TO)}`;
  const fileName = `${prefix}_billing.csv`;
  const filePath = path.join(reportsDir, fileName);

  await downloadCsvWhenReady(csvUrl, filePath);
  console.log(`✅ Saved billing report for user ${userId}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
