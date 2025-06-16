#!/usr/bin/env node
import path from 'path';
import { buildInvoices } from '../services/invoiceBuilder';
import 'dotenv/config';

(async () => {
  const [,, inputCsv] = process.argv;
  if (!inputCsv) {
    console.error('Usage: buildInvoices <path/to/2025_05_25-2025_05_31_billing.csv>');
    process.exit(1);
  }
  const outputCsv = path.resolve(path.dirname(inputCsv), 'invoices.csv');
  await buildInvoices(inputCsv, outputCsv);
})();
