import fs from 'fs';
import { parse } from 'fast-csv';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { Logger } from '../utils/logger';
import { mileageCache, type MileageCacheEntry, type CacheQueryParams } from './mileageCache';

// --- CONSTANTS & TYPES ---

/**
 * Normalizes payer names to handle PP_# format by converting to PP
 */
function normalizePayer(payer: string): string {
  if (payer && payer.match(/^PP_\d+$/)) {
    return 'PP';
  }
  return payer;
}

const CUSTOM_SERVICE_CODE_REGEX = /Service code:\s*([\w-]+),\s*Modifier:\s*([\w-]+),\s*Quantity:([\d.]+),\s*Cost:\s*([\d.]+)/g;
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
  orderIds: Set<string>; // Track unique Order IDs for this service item
}

type Key = string; // "fn|ln|clientAuth"
interface ExtraFields {
  caseWorker: string;
  caseWorkerEmail: string;
  clientAuth: string;
  billingFrequency?: string;
  originalPayers: Set<string>; // Track original payer names for this passenger
  serviceStartDate?: string; // Earliest Date Of Service
  serviceEndDate?: string; // Latest Date Of Service
}
interface AggregationType {
  [key: string]: { items: Record<string, AggregatedItem>, extra: ExtraFields };
}

// Output record type for invoice and QB sync
export type OutputRecordType = {
  InvoiceNumber?: number; // Optional, will be assigned in buildQBSyncFile
  CustomerName: string;
  ServiceItem: string;
  Quantity: number;
  TotalCost: number;
  CaseWorker: string;
  CaseWorkerEmail: string;
  ClientAuthorization: string;
  BillingFrequency?: string;
  OriginalPayer?: string; // Store original payer name for QB sync lookup
  ServiceStartDate?: string; // Earliest Date Of Service
  ServiceEndDate?: string; // Latest Date Of Service
  OrderIds?: string[]; // Array of Order IDs for this service item
  PassengerKey?: string; // Key to track passenger-auth combinations for invoice numbering
};

/**
 * Main entry point for building invoices.
 */
export async function buildInvoices(inputCsv: string, outputCsv: string, startingInvoiceNumber: number = 1000): Promise<void> {
  // Initialize the mileage cache
  await mileageCache.initialize();
  Logger.info('Mileage cache initialized for invoice building');
  
  try {
    const rows = await parseCsvRows(inputCsv);
    const agg = await aggregateRows(rows);
    const records = flattenAggregatedResults(agg, startingInvoiceNumber);
    await writeCsvRecords(outputCsv, records);
  } finally {
    // Always close the cache connection
    await mileageCache.close();
    Logger.info('Mileage cache connection closed');
  }
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
          rows.push(row);
      })
      .on('end', resolve);
  });
  return rows;
}

/**
 * Aggregates all rows into a nested object by passenger and service item.
 * Groups by passenger name AND client authorization to create separate invoices
 * for different authorization numbers under the same passenger.
 */
async function aggregateRows(rows: RouteRow[]): Promise<AggregationType> {
  const agg: AggregationType = {};
  
  for (const row of rows) {
    const fn = row["Passenger's First Name"] || '';
    const ln = row["Passenger's Last Name"] || '';
    const originalPayer = row['Payer Name'] || '';
    const payer = normalizePayer(originalPayer);
    const orderId = row['Order ID'] || ''; // Get Order ID from the row
    
    let clientAuth = row['Orders Client Authorization'] || '';
    // Blank out if numeric and > 1E15. Remove the auto created RG auth numbers.
    if (!isNaN(Number(clientAuth)) && Number(clientAuth) > 1e15) clientAuth = '';
    
    // Create key that includes both passenger name and client authorization
    const key = `${fn}|${ln}|${clientAuth}`;
    
    // Get the Date Of Service for this row
    const dateOfService = row['Date Of Service'] || '';
    
    if (!agg[key]) {
      agg[key] = {
        items: {},
        extra: {
          caseWorker: row['Custom Field: CaseWorker'] || '',
          caseWorkerEmail: row['Custom Field: CaseWorker Email'] || '',
          clientAuth,
          billingFrequency: row['Custom Field: Billing Frequency'] || '',
          originalPayers: new Set<string>(),
          serviceStartDate: dateOfService,
          serviceEndDate: dateOfService
        }
      };
    }
    
    // Update service date range for this passenger
    if (dateOfService) {
      const currentStart = agg[key].extra.serviceStartDate;
      const currentEnd = agg[key].extra.serviceEndDate;
      
      if (!currentStart || dateOfService < currentStart) {
        agg[key].extra.serviceStartDate = dateOfService;
      }
      if (!currentEnd || dateOfService > currentEnd) {
        agg[key].extra.serviceEndDate = dateOfService;
      }
    }
    
    // Track original payer names for this passenger
    agg[key].extra.originalPayers.add(originalPayer);
    
    // Get cached mileage data for this row
    const cacheEntry = await getCachedMileageData(row);
    
    await aggregateDetailFields(row, agg, key, payer, orderId, cacheEntry);
    await aggregateCustomServiceCodes(row, agg, key, payer, orderId, cacheEntry);
    aggregateOrderItems(row, agg, key, payer, orderId);
  }
  return agg;
}

/**
 * Aggregates standard detail fields.
 */
async function aggregateDetailFields(row: RouteRow, agg: AggregationType, key: string, payer: string, orderId: string, cacheEntry: MileageCacheEntry | null): Promise<void> {
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
      let quantity = Number(qtyVals[i] || 0);
      const costVal = Number(costVals[i] || 0);
      
      // Use cached mileage for S0215 service codes
      if (code === 'S0215' && qty === 'Order Mileage Quantity' && cacheEntry) {
        const cachedMiles = mileageCache.getCachedMileage(cacheEntry);
        quantity = cachedMiles;
        Logger.info(`Using cached mileage for ${key}: ${cachedMiles} miles (RG: ${cacheEntry.RG_miles}, Google: ${cacheEntry.Google_miles})`);
      }
      
      // Special logic for Order Mileage Quantity: MCW/CC payers get 0 miles if <5 miles
      // BUT only if overwrite_miles is not set (overwrite_miles takes absolute priority)
      if (qty === 'Order Mileage Quantity' && (payer === 'MCW' || payer === 'CC') && quantity < 5) {
        if (!cacheEntry || cacheEntry.overwrite_miles === undefined || cacheEntry.overwrite_miles === null) {
          quantity = 0;
        }
      }
      
      if (!code || quantity === 0) continue;
      const itemKey = modifier ? `${code}-${modifier}-${payer}`:`${code}-${payer}`;
      if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0, orderIds: new Set<string>() };
      agg[key].items[itemKey].qty += quantity;
      agg[key].items[itemKey].cost += costVal;
      if (orderId) agg[key].items[itemKey].orderIds.add(orderId);
    }
  }
}

/**
 * Aggregates custom service codes (dead miles) with payer/quantity logic.
 * - S0215: Always aggregate for payer 'I'
 * - S0215: Only aggregate for 'CC', 'MCW', or 'PP' if quantity >= 15
 * - All others: aggregate as normal
 */
async function aggregateCustomServiceCodes(row: RouteRow, agg: AggregationType, key: string, payer: string, orderId: string, cacheEntry: MileageCacheEntry | null): Promise<void> {
  const customField = row['Order Custom Service codes'];
  if (customField && typeof customField === 'string') {
    let match;
    while ((match = CUSTOM_SERVICE_CODE_REGEX.exec(customField)) !== null) {
      const code = match[1];
      const modifier = match[2];
      let quantity = Number(match[3]);
      const costVal = Number(match[4]);
      
      // Use cached dead mileage for S0215 service codes
      if (code === 'S0215' && cacheEntry) {
        const cachedDeadMiles = mileageCache.getCachedDeadMileage(cacheEntry);
        quantity = cachedDeadMiles;
        Logger.info(`Using cached dead mileage for ${key}: ${cachedDeadMiles} miles (RG: ${cacheEntry.RG_dead_miles}, Google: ${cacheEntry.Google_dead_miles})`);
      }
      
      const itemKey = `${code}-${modifier}-${payer}`;
      if (code === 'S0215') {
        // Check if overwrite_dead_miles is set - if so, it overrides all payer logic
        const hasOverrideDeadMiles = cacheEntry && cacheEntry.overwrite_dead_miles !== undefined && cacheEntry.overwrite_dead_miles !== null;
        
        if (hasOverrideDeadMiles) {
          // Overwrite dead miles takes absolute priority - always aggregate regardless of payer or quantity
          if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0, orderIds: new Set<string>() };
          agg[key].items[itemKey].qty += quantity;
          agg[key].items[itemKey].cost += costVal;
          if (orderId) agg[key].items[itemKey].orderIds.add(orderId);
        } else {
          // Apply original payer/quantity logic only when no override is set
          if (payer === 'I') {
            if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0, orderIds: new Set<string>() };
            agg[key].items[itemKey].qty += quantity;
            agg[key].items[itemKey].cost += costVal;
            if (orderId) agg[key].items[itemKey].orderIds.add(orderId);
          } else if ((payer === 'CC' || payer === 'MCW' || payer === 'PP') && quantity >= 15) {
            if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0, orderIds: new Set<string>() };
            agg[key].items[itemKey].qty += quantity;
            agg[key].items[itemKey].cost += costVal;
            if (orderId) agg[key].items[itemKey].orderIds.add(orderId);
          }
        }
      } else {
        if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0, orderIds: new Set<string>() };
        agg[key].items[itemKey].qty += quantity;
        agg[key].items[itemKey].cost += costVal;
        if (orderId) agg[key].items[itemKey].orderIds.add(orderId);
      }
    }
  }
}

/**
 * Aggregates RG Invoice items that report as order items (wait time, surcharges, etc).
 */
function aggregateOrderItems(row: RouteRow, agg: AggregationType, key: string, payer: string, orderId: string): void {
  const orderItems = row['Order Item(s)'];
  const svcCodes = row['Invoice Item Service Code(s)'];
  const mods = row['Invoice Item Modifier(s)'];
  if (orderItems && svcCodes && mods) {
    const parsed = parseOrderItems(orderItems, svcCodes, mods, payer);
    for (const { itemKey, quantity, totalCost } of parsed) {
      if (!agg[key].items[itemKey]) agg[key].items[itemKey] = { qty: 0, cost: 0, orderIds: new Set<string>() };
      agg[key].items[itemKey].qty += quantity;
      agg[key].items[itemKey].cost += totalCost;
      if (orderId) agg[key].items[itemKey].orderIds.add(orderId);
    }
  }
}

/**
 * Flattens the aggregation object into an array of records for CSV output.
 * Each unique passenger-authorization combination gets its own invoice number.
 */
function flattenAggregatedResults(agg: AggregationType, startingInvoiceNumber: number = 1000): OutputRecordType[] {
  const records: OutputRecordType[] = [];
  for (const passengerAuth of Object.keys(agg)) {
    const [fn, ln, clientAuth] = passengerAuth.split('|');
    const custName = `${fn} ${ln}`.trim();
    const { caseWorker, caseWorkerEmail, originalPayers, serviceStartDate, serviceEndDate } = agg[passengerAuth].extra;
    
    for (const item of Object.keys(agg[passengerAuth].items)) {
      const { qty, cost, orderIds } = agg[passengerAuth].items[item];
      // Pass through Billing Frequency if present
      const billingFrequency = agg[passengerAuth].extra.billingFrequency || '';
      
      // Extract the payer from the service item (last part after last dash)
      const normalizedPayer = item.split('-').pop() || '';
      
      // Find the original payer that corresponds to this normalized payer
      let originalPayer = normalizedPayer;
      for (const op of originalPayers) {
        if (normalizePayer(op) === normalizedPayer) {
          originalPayer = op;
          break;
        }
      }
      
      records.push({
        CustomerName: custName,
        ServiceItem: item,
        Quantity: qty,
        TotalCost: cost,
        CaseWorker: caseWorker,
        CaseWorkerEmail: caseWorkerEmail,
        ClientAuthorization: clientAuth,
        BillingFrequency: billingFrequency,
        OriginalPayer: originalPayer,
        ServiceStartDate: serviceStartDate,
        ServiceEndDate: serviceEndDate,
        OrderIds: Array.from(orderIds).sort(), // Convert Set to sorted array
        PassengerKey: passengerAuth // Store the key for invoice numbering
      });
    }
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
  
  // Assign invoice numbers for the invoice CSV (all records get numbers)
  let invoiceNum = 1000;
  const seenPassengerKeys = new Set<string>();
  const recordsWithNumbers = records.map(rec => {
    if (!seenPassengerKeys.has(rec.PassengerKey || '')) {
      seenPassengerKeys.add(rec.PassengerKey || '');
      if (rec.PassengerKey) invoiceNum++;
    }
    return { ...rec, InvoiceNumber: invoiceNum - 1 };
  });
  
  await writer.writeRecords(recordsWithNumbers);
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

/**
 * Helper function to get cached mileage data or create a new cache entry
 */
async function getCachedMileageData(row: RouteRow): Promise<MileageCacheEntry | null> {
  const firstName = row["Passenger's First Name"] || '';
  const lastName = row["Passenger's Last Name"] || '';
  const puAddress = row['Pick Up Address'] || '';
  const doAddress = row['Order Drop Off Address'] || '';
  const rgMiles = Number(row['Order Mileage'] || 0);
  
  // Get RG dead miles from custom service codes
  let rgDeadMiles = 0;
  const customField = row['Order Custom Service codes'];
  if (customField && typeof customField === 'string') {
    const deadMileMatch = customField.match(/Service code:\s*S0215[^,]*,\s*Modifier:[^,]*,\s*Quantity:([\d.]+)/);
    if (deadMileMatch) {
      rgDeadMiles = Number(deadMileMatch[1]);
    }
  }
  
  if (!firstName || !lastName || !puAddress || !doAddress) {
    Logger.warn(`Missing required address data for ${firstName} ${lastName}, skipping cache lookup`);
    return null;
  }
  
  const cacheParams: CacheQueryParams = {
    firstName,
    lastName,
    puAddress,
    doAddress
  };
  
  try {
    // Try to find existing cache entry
    let cacheEntry = await mileageCache.findCacheEntry(cacheParams);
    
    if (!cacheEntry) {
      // Create new cache entry with Google Maps API calls
      Logger.info(`Creating new cache entry for ${firstName} ${lastName}`);
      cacheEntry = await mileageCache.createCacheEntry(cacheParams, rgMiles, rgDeadMiles);
    }
    
    return cacheEntry;
  } catch (error) {
    Logger.error(`Error with mileage cache for ${firstName} ${lastName}:`, error);
    return null;
  }
}

export { flattenAggregatedResults, parseCsvRows, aggregateRows };
