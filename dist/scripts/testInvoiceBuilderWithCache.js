#!/usr/bin/env node
"use strict";
/**
 * Test script for invoice builder with mileage cache integration
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const invoiceBuilder_1 = require("../services/invoiceBuilder");
const logger_1 = require("../utils/logger");
const paths_1 = require("../utils/paths");
function testInvoiceBuilderWithCache() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const inputCsv = '/home/mlefort/git/lakeshoretransp-routegenie-client/reports/billing/2025_06_23-2025_06_25_billing.csv';
            const outputCsv = '/home/mlefort/git/lakeshoretransp-routegenie-client/reports/billing/test_invoices_with_cache.csv';
            console.log('Testing invoice builder with mileage cache integration...');
            console.log(`Input: ${inputCsv}`);
            console.log(`Output: ${outputCsv}`);
            // Initialize logger for this test
            const logPath = (0, paths_1.resolveFromExecutable)('logs', 'test-invoice-builder-cache.log');
            logger_1.Logger.initialize(logPath, true);
            yield (0, invoiceBuilder_1.buildInvoices)(inputCsv, outputCsv, 2000);
            console.log('✅ Invoice building with cache completed successfully!');
            console.log(`Check the output file: ${outputCsv}`);
        }
        catch (error) {
            console.error('❌ Error testing invoice builder with cache:', error);
            process.exit(1);
        }
    });
}
// Run the test
testInvoiceBuilderWithCache();
//# sourceMappingURL=testInvoiceBuilderWithCache.js.map