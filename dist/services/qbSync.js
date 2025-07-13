"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQBSyncFile = exports.loadQBServiceCodes = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fast_csv_1 = require("fast-csv");
const logger_1 = require("../utils/logger");
const QB_SYNC_HEADERS = [
    'Post?', 'Invoice/Bill Date', 'Due Date', 'Invoice / Bill Number', 'Transaction Type', 'Customer', 'Vendor', 'Currency Code', 'Product/Services', 'Description', 'Qty', 'Discount %', 'Unit Price', 'Category', 'Location', 'Class', 'Tax', 'Payment/Receipt Reference', 'Payment/Receip Date', 'Payment/Receipt Account', 'Payment/Receip Amount', 'Payer', 'Invoice Billing Status', 'Authorization Code Exp', 'Auth Code (Customer)', 'Wheelchair', 'Case-Manager', 'Authorizations 2', 'Authorizations 1', 'Billing Frequency', 'Service End Date', 'Service Start Date'
];
/**
 * Loads QB service codes from the CSV file into a lookup map.
 */
function loadQBServiceCodes(qbCsvPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const map = {};
            fs_1.default.createReadStream(qbCsvPath)
                .pipe((0, fast_csv_1.parse)({ headers: true }))
                .on('data', (row) => {
                var _a, _b, _c;
                if (row['Product/Service Name']) {
                    map[row['Product/Service Name'].trim()] = {
                        rate: ((_a = row['Sales Price / Rate']) === null || _a === void 0 ? void 0 : _a.trim()) || '',
                        taxable: ((_b = row['Taxable']) === null || _b === void 0 ? void 0 : _b.trim()) || '',
                        description: ((_c = row['Sales Description']) === null || _c === void 0 ? void 0 : _c.trim()) || ''
                    };
                }
            })
                .on('end', () => resolve(map))
                .on('error', reject);
        });
    });
}
exports.loadQBServiceCodes = loadQBServiceCodes;
/**
 * Builds the QuickBooks sync CSV from invoice records.
 */
function buildQBSyncFile(records, qbCodes, firstInvoiceNum, today, outputDir, payerMap, billingFrequencyFilter = 'All') {
    return __awaiter(this, void 0, void 0, function* () {
        const todayStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
        const outPath = path_1.default.join(outputDir, `${todayStr}_QB_invoice_sync.csv`);
        const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const dateFmt = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        // Filter records based on billing frequency (include blank or matching, or all)
        const filteredRecords = billingFrequencyFilter === 'All'
            ? records
            : records.filter(rec => !rec.BillingFrequency || rec.BillingFrequency === billingFrequencyFilter);
        // Assign invoice numbers only to filtered records, incrementing per unique passenger-auth combination
        let invoiceNum = firstInvoiceNum;
        const seenPassengerKeys = new Set();
        const recordsWithInvoiceNumbers = filteredRecords.map(rec => {
            if (!seenPassengerKeys.has(rec.PassengerKey || '')) {
                seenPassengerKeys.add(rec.PassengerKey || '');
                if (rec.PassengerKey)
                    invoiceNum++;
            }
            return Object.assign(Object.assign({}, rec), { InvoiceNumber: invoiceNum - 1 });
        });
        const mainRows = [];
        const missingRows = [];
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
            let description = (qb === null || qb === void 0 ? void 0 : qb.description) || '';
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
                'Unit Price': (qb === null || qb === void 0 ? void 0 : qb.rate) || '',
                'Category': '',
                'Location': '',
                'Class': '',
                'Tax': (qb === null || qb === void 0 ? void 0 : qb.taxable) || '',
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
            }
            else {
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
        yield csvWriter.writeRecords(allRows);
        logger_1.Logger.success(`QB Sync CSV written to ${outPath}`);
    });
}
exports.buildQBSyncFile = buildQBSyncFile;
//# sourceMappingURL=qbSync.js.map