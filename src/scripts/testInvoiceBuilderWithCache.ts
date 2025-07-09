#!/usr/bin/env node

/**
 * Test script for invoice builder with mileage cache integration
 */

import { buildInvoices } from '../services/invoiceBuilder';
import { Logger } from '../utils/logger';
import { resolveFromExecutable } from '../utils/paths';
import path from 'path';

async function testInvoiceBuilderWithCache() {
  try {
    const inputCsv = '/home/mlefort/git/lakeshoretransp-routegenie-client/reports/billing/2025_06_23-2025_06_25_billing.csv';
    const outputCsv = '/home/mlefort/git/lakeshoretransp-routegenie-client/reports/billing/test_invoices_with_cache.csv';
    
    console.log('Testing invoice builder with mileage cache integration...');
    console.log(`Input: ${inputCsv}`);
    console.log(`Output: ${outputCsv}`);
    
    // Initialize logger for this test
    const logPath = resolveFromExecutable('logs', 'test-invoice-builder-cache.log');
    Logger.initialize(logPath, true);
    
    await buildInvoices(inputCsv, outputCsv, 2000);
    
    console.log('✅ Invoice building with cache completed successfully!');
    console.log(`Check the output file: ${outputCsv}`);

  } catch (error) {
    console.error('❌ Error testing invoice builder with cache:', error);
    process.exit(1);
  }
}

// Run the test
testInvoiceBuilderWithCache();
