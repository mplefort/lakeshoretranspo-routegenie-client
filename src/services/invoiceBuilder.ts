import fs from 'fs';
import { parse } from 'fast-csv';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { Logger } from '../utils/logger';

// --- CONSTANTS & TYPES ---

const CUSTOM_SERVICE_CODE_REGEX = /Service code:\s*([\w-]+),\s*Modifier:\s*([\w-]+),\s*Quantity:([\d.]+),\s*Cost:\s*([\d.]+)/g;
const PAYER_FILTER = ['CC', 'I', 'MCW', 'PP'];
const DETAIL_FIELDS = [
  ['Order Load Fee Service Code', 'Order Load Fee Modifier', 'Order Load Fee Quantity', 'Order Load Fee Cost'],
  ['Order Mileage Service Code', 'Order Mileage Modifier', 'Order Mileage Quantity', 'Order Mileage Cost'],
  ['Order Flat Rate Service Code', 'Order Flat Rate Modifier', 'Order Flat Rate Quantity', 'Order Flat Rate Cost'],
  ['Order No Show Rate Service Code', 'Order No Show Rate Modifier', 'Order No Show Rate Quantity', 'Order No Show Rate Cost'],
  ['Order Pick Up Wait Time Service Code', 'Order Pick Up Wait Time Modifier', 'Order Pick Up Wait Time Quantity', 'Order Pick Up Wait Time Cost'],
];

interface RouteRow {
  [key: string]: any;
}

interface AggregatedItem {
  qty: number;
  cost: number;
}

type Key = string; // "fn|ln"
interface ExtraFields {
  caseWorker: string;
  caseWorkerEmail: string;
  clientAuth: string;
  billingFrequency?: string;
}
interface AggregationType {
  [key: string]: { items: Record<string, AggregatedItem>, extra: ExtraFields };
}

// Output record type for invoice and QB sync
export type OutputRecordType = {
  InvoiceNumber: number;
  CustomerName: string;
  ServiceItem: string;
  Quantity: number;
  TotalCost: number;
  CaseWorker: string;
  CaseWorkerEmail: string;
  ClientAuthorization: string;
  BillingFrequency?: string;
};

/**
 * Main entry point for building invoices.
 */
export async function buildInvoices(inputCsv: string, outputCsv: string, startingInvoiceNumber: number = 1000): Promise<void> {
  const rows = await parseCsvRows(inputCsv);
  const agg = aggregateRows(rows);
  const records = flattenAggregatedResults(agg, startingInvoiceNumber);
  await writeCsvRecords(outputCsv, records);
}

/**
 * Reads and parses CSV rows, skipping the first line.
 */
async function parseCsvRows(inputCsv: string): Promise<RouteRow[]> {
  const rows: RouteRow[] = [];
  await new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(inputCsv);
    let isFirstLine = true;
    const passThrough = new (require('stream').PassThrough)();
    readStream.on('data', function handler(chunk) {
      if (isFirstLine) {
        const idx = chunk.indexOf('\n');
        if (idx !== -1) {
          passThrough.write(chunk.slice(idx + 1));
          isFirstLine = false;
          readStream.removeListener('data', handler);
          readStream.pipe(passThrough);
        }
      }
    });
    readStream.on('end', () => {
      if (isFirstLine) passThrough.end();
    });
    readStream.on('error', reject);
    passThrough
      .pipe(parse({ headers: true }))
      .on('error', reject)
      .on('data', (row: any) => {
        Object.keys(row).forEach(key => {
          row[key] = typeof row[key] === 'string' ? row[key].trim() : row[key];
        });
        // if (PAYER_FILTER.includes(row['Payer Name'])) {
          rows.push(row);
        // }
      })
      .on('end', resolve);
  });
  return rows;
}

/**
 * Aggregates all rows into a nested object by passenger and service item.
 */
function aggregateRows(rows: RouteRow[]): AggregationType {
  const agg: AggregationType = {};
  for (const row of rows) {
    const fn = row["Passenger's First Name"] || '';
    const ln = row["Passenger's Last Name"] || '';
    const payer = row['Payer Name'] || '';
    const key = `${fn}|${ln}`;
    if (!agg[key]) {
      let clientAuth = row['Orders Client Authorization'] || '';
      // Blank out if numeric and > 1E15. Remove the auto created RG auth numbers.
      if (!isNaN(Number(clientAuth)) && Number(clientAuth) > 1e15) clientAuth = '';
      agg[key] = {
        items: {},
        extra: {
          caseWorker: row['Custom Field: CaseWorker'] || '',
          caseWorkerEmail: row['Custom Field: CaseWorker Email'] || '',
          clientAuth,
          billingFrequency: row['Custom Field: Billing Frequency'] || ''
        }
      };
    }
    aggregateDetailFields(row, agg, key, payer);
    aggregateCustomServiceCodes(row, agg, key, payer);
    aggregateOrderItems(row, agg, key, payer);
  }
  return agg;
}

/**
 * Aggregates standard detail fields.
 */
function aggregateDetailFields(row: RouteRow, agg: AggregationType, key: string, payer: string): void {
  for (const [svc, mod, qty, cost] of DETAIL_FIELDS) {
    const svcCode = row[svc];
    if (!svcCode) continue;
    const svcCodes = String(svcCode).split(',').map((s: string) => s.trim()).filter(Boolean);
    const modCodes = String(row[mod] || '').split(',').map((s: string) => s.trim());
    const qtyVals = String(row[qty] || '').split(',').map((s: string) => s.trim());
    const costVals = String(row[cost] || '').split(',').map((s: string) => s.trim());
    for (let i = 0; i < svcCodes.length; i++) {
      const code = svcCodes[i];
      const modifier = modCodes[i] || '';
      const quantity = Number(qtyVals[i] || 0);
      const costVal = Number(costVals[i] || 0);
      if (!code || quantity === 0) continue;
      const itemKey = modifier ? `${code}-${modifier}-${payer}`:`${code}-${payer}`;
      if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0 };
      agg[key].items[itemKey].qty += quantity;
      agg[key].items[itemKey].cost += costVal;
    }
  }
}

/**
 * Aggregates custom service codes (dead miles) with payer/quantity logic.
 * - S0215: Always aggregate for payer 'I'
 * - S0215: Only aggregate for 'CC', 'MCW', or 'PP' if quantity >= 15
 * - All others: aggregate as normal
 */
function aggregateCustomServiceCodes(row: RouteRow, agg: AggregationType, key: string, payer: string): void {
  const customField = row['Order Custom Service codes'];
  if (customField && typeof customField === 'string') {
    let match;
    while ((match = CUSTOM_SERVICE_CODE_REGEX.exec(customField)) !== null) {
      const code = match[1];
      const modifier = match[2];
      const quantity = Number(match[3]);
      const costVal = Number(match[4]);
      const itemKey = `${code}-${modifier}-${payer}`;
      if (code === 'S0215') {
        if (payer === 'I') {
          if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0 };
          agg[key].items[itemKey].qty += quantity;
          agg[key].items[itemKey].cost += costVal;
        } else if ((payer === 'CC' || payer === 'MCW' || payer === 'PP') && quantity >= 15) {
          if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0 };
          agg[key].items[itemKey].qty += quantity;
          agg[key].items[itemKey].cost += costVal;
        }
      } else {
        if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0 };
        agg[key].items[itemKey].qty += quantity;
        agg[key].items[itemKey].cost += costVal;
      }
    }
  }
}

/**
 * Aggregates RG Invoice items that report as order items (wait time, surcharges, etc).
 */
function aggregateOrderItems(row: RouteRow, agg: AggregationType, key: string, payer: string): void {
  const orderItems = row['Order Item(s)'];
  const svcCodes = row['Invoice Item Service Code(s)'];
  const mods = row['Invoice Item Modifier(s)'];
  if (orderItems && svcCodes && mods) {
    const parsed = parseOrderItems(orderItems, svcCodes, mods, payer);
    for (const { itemKey, quantity, totalCost } of parsed) {
      if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0 };
      agg[key].items[itemKey].qty += quantity;
      agg[key].items[itemKey].cost += totalCost;
    }
  }
}

/**
 * Flattens the aggregation object into an array of records for CSV output.
 */
function flattenAggregatedResults(agg: AggregationType, startingInvoiceNumber: number = 1000): OutputRecordType[] {
  const records: OutputRecordType[] = [];
  let invoiceNum = startingInvoiceNumber;
  for (const passenger of Object.keys(agg)) {
    const [fn, ln] = passenger.split('|');
    const custName = `${fn} ${ln}`.trim();
    const { caseWorker, caseWorkerEmail, clientAuth } = agg[passenger].extra;
    for (const item of Object.keys(agg[passenger].items)) {
      const { qty, cost } = agg[passenger].items[item];
      // Pass through Billing Frequency if present
      const billingFrequency = agg[passenger].extra.billingFrequency || '';
      records.    push({
        InvoiceNumber: invoiceNum,
        CustomerName: custName,
        ServiceItem: item,
        Quantity: qty,
        TotalCost: cost,
        CaseWorker: caseWorker,
        CaseWorkerEmail: caseWorkerEmail,
        ClientAuthorization: clientAuth,
        BillingFrequency: billingFrequency
      });
    }
    invoiceNum++;
  }
  return records;
}

/**
 * Writes the final records to a CSV file.
 */
async function writeCsvRecords(outputCsv: string, records: OutputRecordType[]): Promise<void> {
  const writer = createObjectCsvWriter({
    path: outputCsv,
    header: [
      { id: 'InvoiceNumber', title: 'InvoiceNumber' },
      { id: 'CustomerName', title: 'CustomerName' },
      { id: 'ServiceItem', title: 'ServiceItem' },
      { id: 'Quantity', title: 'Quantity' },
      { id: 'TotalCost', title: 'TotalCost' },
      { id: 'CaseWorker', title: 'Custom Field: CaseWorker' },
      { id: 'CaseWorkerEmail', title: 'Custom Field: CaseWorker Email' },
      { id: 'ClientAuthorization', title: 'Orders Client Authorization' }
    ]
  });
  await writer.writeRecords(records);
  Logger.success(`Invoices written to ${outputCsv}`);
}

/**
 * Parses order item(s) and their service codes, modifiers, and quantities from the provided columns.
 * Each order item is mapped to its own quantity and totalCost, ignoring the overall total column.
 * Service code-modifier-payer is used as the ServiceItem key.
 */
function parseOrderItems(
  orderItems: string,
  serviceCodes: string,
  modifiers: string,
  payer: string
) {
  // Split and trim service codes and modifiers
  const codes = serviceCodes.split(',').map(c => c.trim());
  const mods = modifiers.split(',').map(m => m.trim());
  // Split order items by comma or newline, handle multi-line and multi-item order items
  const items = orderItems.split(/\r?\n|,/).map(i => i.trim()).filter(Boolean);
  const results: { itemKey: string; quantity: number; totalCost: number }[] = [];
  for (const desc of items) {
    // Extract the left part (code-modifier) and right part (description and qty/cost)
    const [left, right] = desc.split(':');
    if (!left || !right) continue;
    // Extract service code from left part, e.g. T2003-RD-U5C2-CC
    const leftParts = left.split('-');
    const code = leftParts[0].trim();
    // Find the index of this code in the codes array
    const codeIdx = codes.findIndex(c => c === code);
    // Use the found index to get the correct modifier, fallback to first if not found
    const modifier = (codeIdx !== -1 ? mods[codeIdx] : mods[0]) || '';
    // Extract quantity and unit cost, e.g. (2.0@$21.0)
    const match = right.match(/\((\d+(?:\.\d+)?)@\$(\d+(?:\.\d+)?)\)/);
    const quantity = match ? parseFloat(match[1]) : 1;
    const unitCost = match ? parseFloat(match[2]) : 0;
    const itemKey = `${code}-${modifier}-${payer}`;
    results.push({ itemKey, quantity, totalCost: +(quantity * unitCost).toFixed(2) });
  }
  return results;
}

export { flattenAggregatedResults, parseCsvRows, aggregateRows };
