#!/usr/bin/env node
import path from 'path';
import { buildInvoices, flattenAggregatedResults, parseCsvRows, aggregateRows } from '../services/invoiceBuilder';
import { loadQBServiceCodes, buildQBSyncFile } from '../services/qbSync';
import fs from 'fs';
import { parse as csvParse } from 'fast-csv';
import 'dotenv/config';

// Helper to build a payer short id to full name map from the input CSV
async function buildPayerMap(inputCsv: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const payerMap: Record<string, string> = {};
    let isFirstLine = true;
    fs.createReadStream(inputCsv)
      .pipe(csvParse({ headers: true, skipLines: 1 }))
      .on('data', (row: any) => {
        if (row['Payer Name'] && row['Payer ID']) {
          payerMap[row['Payer Name'].trim()] = row['Payer ID'].trim();
        }
      })
      .on('end', () => resolve(payerMap))
      .on('error', reject);
  });
}

(async () => {
  const [,, inputCsv, invoiceNumArg] = process.argv;
  if (!inputCsv || !invoiceNumArg) {
    console.error('Usage: buildInvoices <path/to/RB_billing.csv> <first_invoice_number>');
    process.exit(1);
  }
  const outputCsv = path.resolve(path.dirname(inputCsv), 'invoices.csv');
  await buildInvoices(inputCsv, outputCsv);

  // QB Sync generation
  const qbCodesPath = path.resolve(__dirname, '../../mappings/QB_Service_codes.csv');
  const qbCodes = await loadQBServiceCodes(qbCodesPath);
  const payerMap = await buildPayerMap(inputCsv);
  // Use exported helpers to get invoice records
  const agg = await parseCsvRows(inputCsv).then(aggregateRows);
  const records = flattenAggregatedResults(agg);
  const today = new Date();
  await buildQBSyncFile(records, qbCodes, parseInt(invoiceNumArg, 10), today, path.dirname(inputCsv), payerMap);
})();
