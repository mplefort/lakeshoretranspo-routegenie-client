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
  'Post?', 'Invoice/Bill Date', 'Due Date', 'Invoice / Bill Number', 'Transaction Type', 'Customer', 'Vendor', 'Currency Code', 'Product/Services', 'Description', 'Qty', 'Discount %', 'Unit Price', 'Category', 'Location', 'Class', 'Tax', 'Payment/Receipt Reference', 'Payment/Receip Date', 'Payment/Receipt Account', 'Payment/Receip Amount', 'Payer', 'Invoice Billing Status', 'Authorization Code Exp', 'Auth Code (Customer)', 'Wheelchair', 'Case-Manager', 'Authorizations 2', 'Authorizations 1', 'Billing Frequency', 'Service End Date', 'Service Start Date'
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
export async function buildQBSyncFile(
  records: OutputRecordType[],
  qbCodes: QBServiceCode,
  firstInvoiceNum: number,
  today: Date,
  outputDir: string,
  payerMap?: Record<string, string>,
  billingFrequencyFilter: string = 'All'
) {
   const todayStr = `${today.getFullYear()}_${String(today.getMonth()+1).padStart(2,'0')}_${String(today.getDate()).padStart(2,'0')}`;
   const outPath = path.join(outputDir, `${todayStr}_QB_invoice_sync.csv`);
   const dueDate = new Date(today.getTime() + 30*24*60*60*1000);
   const dateFmt = (d: Date) => `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  // Filter records based on billing frequency (include blank or matching, or all)
  const filteredRecords = billingFrequencyFilter === 'All'
    ? records
    : records.filter(rec => !rec.BillingFrequency || rec.BillingFrequency === billingFrequencyFilter);
  
  // Assign invoice numbers only to filtered records, incrementing per unique passenger-auth combination
  let invoiceNum = firstInvoiceNum;
  const seenPassengerKeys = new Set<string>();
  const recordsWithInvoiceNumbers = filteredRecords.map(rec => {
    if (!seenPassengerKeys.has(rec.PassengerKey || '')) {
      seenPassengerKeys.add(rec.PassengerKey || '');
      if (rec.PassengerKey) invoiceNum++;
    }
    return { ...rec, InvoiceNumber: invoiceNum - 1 };
  });
  
  const mainRows: any[] = [];
  const missingRows: any[] = [];

  for (const rec of recordsWithInvoiceNumbers) {
     // Format customer as Lastname, Firstname
     const [first, ...rest] = rec.CustomerName.split(' ');
     const last = rest.join(' ');
     const customer = `${last}, ${first}`.trim();
     const code = rec.ServiceItem;
     const qb = qbCodes[code];
     
     // Use the original payer name from the record for lookup
     const originalPayerName = rec.OriginalPayer || '';
     const payerFullName = payerMap && payerMap[originalPayerName] ? payerMap[originalPayerName] : originalPayerName;
     
     const authorizations1 = rec.ClientAuthorization || '';
     const invoiceBillingStatus = authorizations1 ? '' : 'Authorization Needed';
     
     // Use the invoice number from the record (which is already correctly assigned)
     const invoiceNumber = rec.InvoiceNumber;
     
     // Build description with Order IDs
     let description = qb?.description || '';
     if (rec.OrderIds && rec.OrderIds.length > 0) {
       description += ` | Order IDs: ${rec.OrderIds.join(', ')}`;
     }
     
     const row = {
       'Post?': 'Yes',
       'Invoice/Bill Date': dateFmt(today),
       'Due Date': dateFmt(dueDate),
       'Invoice / Bill Number': invoiceNumber,
       'Transaction Type': 'Invoice',
       'Customer': customer,
       'Vendor': '',
       'Currency Code': 'USD',
       'Product/Services': code,
       'Description': description,
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
       'Authorization Code Exp': '',
       'Auth Code (Customer)': '',
       'Wheelchair': '',
       'Case-Manager': rec.CaseWorker || '',
       'Authorizations 2': '',
       'Authorizations 1': authorizations1,
       'Billing Frequency': rec.BillingFrequency || '',
       'Service End Date': rec.ServiceEndDate || '',
       'Service Start Date': rec.ServiceStartDate || ''
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
     allRows.push({
       'Post?': 'WARNING THESE CODES NOT FOUND IN QUICKBOOKS, DO NOT COPY TO SYNC SHEET'
     }); // warning row
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
