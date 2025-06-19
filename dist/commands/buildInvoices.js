#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const invoiceBuilder_1 = require("../services/invoiceBuilder");
const qbSync_1 = require("../services/qbSync");
const fs_1 = __importDefault(require("fs"));
const fast_csv_1 = require("fast-csv");
require("dotenv/config");
// Helper to build a payer short id to full name map from the input CSV
async function buildPayerMap(inputCsv) {
    return new Promise((resolve, reject) => {
        const payerMap = {};
        let isFirstLine = true;
        fs_1.default.createReadStream(inputCsv)
            .pipe((0, fast_csv_1.parse)({ headers: true, skipLines: 1 }))
            .on('data', (row) => {
            if (row['Payer Name'] && row['Payer ID']) {
                payerMap[row['Payer Name'].trim()] = row['Payer ID'].trim();
            }
        })
            .on('end', () => resolve(payerMap))
            .on('error', reject);
    });
}
(async () => {
    const [, , inputCsv, invoiceNumArg] = process.argv;
    if (!inputCsv || !invoiceNumArg) {
        console.error('Usage: buildInvoices <path/to/RB_billing.csv> <first_invoice_number>');
        process.exit(1);
    }
    const outputCsv = path_1.default.resolve(path_1.default.dirname(inputCsv), 'invoices.csv');
    await (0, invoiceBuilder_1.buildInvoices)(inputCsv, outputCsv);
    // QB Sync generation
    const qbCodesPath = path_1.default.resolve(__dirname, '../../mappings/QB_Service_codes.csv');
    const qbCodes = await (0, qbSync_1.loadQBServiceCodes)(qbCodesPath);
    const payerMap = await buildPayerMap(inputCsv);
    // Use exported helpers to get invoice records
    const agg = await (0, invoiceBuilder_1.parseCsvRows)(inputCsv).then(invoiceBuilder_1.aggregateRows);
    const records = (0, invoiceBuilder_1.flattenAggregatedResults)(agg);
    const today = new Date();
    await (0, qbSync_1.buildQBSyncFile)(records, qbCodes, parseInt(invoiceNumArg, 10), today, path_1.default.dirname(inputCsv), payerMap);
})();
