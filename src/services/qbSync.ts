import fs from 'fs';
import path from 'path';
import { parse } from 'fast-csv';
import { createObjectCsvWriter } from 'csv-writer';
import type { OutputRecordType } from './invoiceBuilder';
import { Logger } from '../utils/logger';

interface QBServiceCode {
  [key: string]: {
    rate: string;
    taxable: string;
    description: string;
  };
}

const QB_SYNC_HEADERS = [
  'Post?', 'Invoice/Bill Date', 'Due Date', 'Invoice / Bill Number', 'Transaction Type', 'Customer', 'Vendor', 'Currency Code', 'Product/Services', 'Description', 'Qty', 'Discount %', 'Unit Price', 'Category', 'Location', 'Class', 'Tax', 'Payment/Receipt Reference', 'Payment/Receip Date', 'Payment/Receipt Account', 'Payment/Receip Amount', 'Payer', 'Invoice Billing Status', 'Authorizations 1', 'Billing Frequency'
];

/**
 * Loads QB service codes from the CSV file into a lookup map.
 */
export async function loadQBServiceCodes(qbCsvPath: string): Promise<QBServiceCode> {
  return new Promise((resolve, reject) => {
    const map: QBServiceCode = {};
    fs.createReadStream(qbCsvPath)
      .pipe(parse({ headers: true }))
      .on('data', (row: any) => {
        if (row['Product/Service Name']) {
          map[row['Product/Service Name'].trim()] = {
            rate: row['Sales Price / Rate']?.trim() || '',
            taxable: row['Taxable']?.trim() || '',
            description: row['Sales Description']?.trim() || ''
          };
        }
      })
      .on('end', () => resolve(map))
      .on('error', reject);
  });
}

/**
 * Builds the QuickBooks sync CSV from invoice records.
 */
export async function buildQBSyncFile(records: OutputRecordType[], qbCodes: QBServiceCode, firstInvoiceNum: number, today: Date, outputDir: string, payerMap?: Record<string, string>) {
  const todayStr = `${today.getFullYear()}_${String(today.getMonth()+1).padStart(2,'0')}_${String(today.getDate()).padStart(2,'0')}`;
  const outPath = path.join(outputDir, `${todayStr}_QB_invoice_sync.csv`);
  const dueDate = new Date(today.getTime() + 30*24*60*60*1000);
  const dateFmt = (d: Date) => `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;

  const mainRows: any[] = [];
  const missingRows: any[] = [];
  let invoiceNum = firstInvoiceNum;
  let lastCustomer = '';

  for (const rec of records) {
    // Format customer as Lastname, Firstname
    const [first, ...rest] = rec.CustomerName.split(' ');
    const last = rest.join(' ');
    const customer = `${last}, ${first}`.trim();
    const code = rec.ServiceItem;
    const qb = qbCodes[code];
    const payerId = rec.ServiceItem.split('-').pop() || '';
    const payerFullName = payerMap && payerMap[payerId] ? payerMap[payerId] : payerId;
    const authorizations1 = rec.ClientAuthorization || '';
    const invoiceBillingStatus = authorizations1 ? '' : 'Authorization Needed';
    // Only increment invoiceNum when customer changes, but assign before increment
    if (lastCustomer !== customer) {
      invoiceNum++;
      lastCustomer = customer;
    }
    const row = {
      'Post?': 'Yes',
      'Invoice/Bill Date': dateFmt(today),
      'Due Date': dateFmt(dueDate),
      'Invoice / Bill Number': invoiceNum,
      'Transaction Type': 'Invoice',
      'Customer': customer,
      'Vendor': '',
      'Currency Code': 'USD',
      'Product/Services': code,
      'Description': qb?.description || '',
      'Qty': rec.Quantity,
      'Discount %': '',
      'Unit Price': qb?.rate || '',
      'Category': '',
      'Location': '',
      'Class': '',
      'Tax': qb?.taxable || '',
      'Payment/Receipt Reference': '',
      'Payment/Receip Date': '',
      'Payment/Receipt Account': '',
      'Payment/Receip Amount': '',
      'Payer': payerFullName,
      'Invoice Billing Status': invoiceBillingStatus,
      'Authorizations 1': authorizations1,
      'Billing Frequency': rec.BillingFrequency || ''
    };
    if (!qb) {
      missingRows.push(row);
    } else {
      mainRows.push(row);
    }
  }

  // Write main rows, then blank line, then missing rows
  const allRows = mainRows;
  if (missingRows.length) {
    allRows.push({}); // blank line
    allRows.push(...missingRows);
    for (const row of missingRows) {
      console.warn(`WARNING: Service code not found in QB codes: ${row['Product/Services']}`);
    }
  }

  // Write CSV
  const csvWriter = require('csv-writer').createObjectCsvWriter({
    path: outPath,
    header: QB_SYNC_HEADERS.map(h => ({ id: h, title: h }))
  });
  await csvWriter.writeRecords(allRows);
  Logger.success(`QB Sync CSV written to ${outPath}`);
}
