import path from 'path';
import fs from 'fs';
import { generateBillingReport } from '../adapters/routeGenie';
import { buildInvoices, flattenAggregatedResults, parseCsvRows, aggregateRows } from '../services/invoiceBuilder';
import { loadQBServiceCodes, buildQBSyncFile } from '../services/qbSync';
import { Logger } from '../utils/logger';
import { resolveFromExecutable } from '../utils/paths';
import { parse as csvParse } from 'fast-csv';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config();

// Load package.json
const packageJson = JSON.parse(readFileSync(resolveFromExecutable('package.json'), 'utf8'));

interface BillingWorkflowFormInputs {
  startDate: string;
  endDate: string;
  billingFrequency: 'All' | 'Daily' | 'Weekly' | 'Monthly';
  invoiceNumber: number;
  outputFolder: string;
}

class BillingWorkflowInteractive {
  constructor() {
    // Initialize logger with default settings for UI usage
    const logFile = resolveFromExecutable('logs', `billing-workflow-${this.getDateString()}.log`);
    Logger.initialize(logFile, false); // No debug mode for UI
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  }

  private formatDateToMDY(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private validateDate(dateStr: string): boolean {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!regex.test(dateStr)) return false;

    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getMonth() === month - 1 && date.getDate() === day && date.getFullYear() === year;
  }

  private async buildPayerMap(inputCsv: string): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const payerMap: Record<string, string> = {};
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

  private formatDateForFile(dateStr: string): string {
    const [month, day, year] = dateStr.split('/');
    return `${year}_${month.padStart(2, '0')}_${day.padStart(2, '0')}`;
  }

  /**
   * Execute billing workflow with form inputs (for UI integration)
   */
  async runFromFormInputs(inputs: BillingWorkflowFormInputs): Promise<{ success: boolean; message: string; outputDir: string }> {
    try {
      console.log(`Lakeshore Transportation Billing Workflow v${packageJson.version}`);
      Logger.info('Starting Lakeshore Transportation Billing Workflow from form inputs', true);
      
      const logFile = resolveFromExecutable('logs', `billing-workflow-${this.getDateString()}.log`);
      Logger.info(`Log file: ${logFile}`, true);

      // Use form inputs
      const startDate = inputs.startDate;
      const endDate = inputs.endDate;
      const invoiceNumber = inputs.invoiceNumber;
      const outputDir = path.resolve(inputs.outputFolder);
      const billingFrequencyFilter = inputs.billingFrequency;

      // Validate dates
      if (!this.validateDate(startDate)) {
        const errorMsg = `Invalid start date format: ${startDate}. Please use MM/DD/YYYY format.`;
        Logger.error(errorMsg);
        return { success: false, message: errorMsg, outputDir };
      }

      if (!this.validateDate(endDate)) {
        const errorMsg = `Invalid end date format: ${endDate}. Please use MM/DD/YYYY format.`;
        Logger.error(errorMsg);
        return { success: false, message: errorMsg, outputDir };
      }

      Logger.info(`Configuration:`);
      Logger.info(`  • Date Range: ${startDate} to ${endDate}`);
      Logger.info(`  • Starting Invoice Number: ${invoiceNumber}`);
      Logger.info(`  • Output Directory: ${outputDir}`);
      Logger.info(`  • Billing Frequency Filter: ${billingFrequencyFilter}`);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        Logger.info(`Created output directory: ${outputDir}`);
      }

      // Step 1: Pull billing report from RouteGenie
      Logger.progress('Downloading billing report from RouteGenie...');
      await generateBillingReport(startDate, endDate, outputDir);

      const prefix = `${this.formatDateForFile(startDate)}-${this.formatDateForFile(endDate)}`;
      const billingCsvPath = path.join(outputDir, `${prefix}_billing.csv`);

      if (!fs.existsSync(billingCsvPath)) {
        throw new Error(`Billing report not found at expected location: ${billingCsvPath}`);
      }

      // Step 2: Build invoices
      Logger.progress('Building invoices from billing data...');
      const invoicesCsvPath = path.join(outputDir, 'invoices.csv');
      await buildInvoices(billingCsvPath, invoicesCsvPath, invoiceNumber);
      Logger.success('Invoices generated successfully');

      // Step 3: Generate QuickBooks sync file
      Logger.progress('Generating QuickBooks sync file...');

      const qbCodesPath = resolveFromExecutable('mappings', 'QB_Service_codes.csv');
      if (!fs.existsSync(qbCodesPath)) {
        throw new Error(`QuickBooks service codes mapping file not found: ${qbCodesPath}`);
      }

      const qbCodes = await loadQBServiceCodes(qbCodesPath);
      const payerMap = await this.buildPayerMap(billingCsvPath);

      // Get invoice records using the exported helpers
      const agg = await parseCsvRows(billingCsvPath).then(aggregateRows);
      const records = flattenAggregatedResults(agg, invoiceNumber);

      const today = new Date();
      await buildQBSyncFile(records, qbCodes, invoiceNumber, today, outputDir, payerMap, billingFrequencyFilter);

      const fileCount = fs.readdirSync(outputDir).length;
      const successMessage = `Billing workflow completed successfully! Generated ${fileCount} files in ${outputDir}`;
      
      Logger.success(successMessage);
      Logger.info(`Generated files:\n  • Billing Report: ${billingCsvPath}\n  • Invoices: ${invoicesCsvPath}\n  • QuickBooks Sync file in ${outputDir}`);

      return { 
        success: true, 
        message: successMessage,
        outputDir 
      };

    } catch (error: any) {
      const errorMessage = `Workflow failed: ${error.message || error}`;
      Logger.error(errorMessage);

      if (error.message?.includes('authenticate') || error.message?.includes('credentials')) {
        Logger.error('Authentication failed. Please check your RouteGenie credentials in .env file.');
      } else if (error.message?.includes('ENOENT')) {
        Logger.error('File not found. Please check that all required mapping files exist.');
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        Logger.error('Network error. Please check your internet connection and try again.');
      }

      return { 
        success: false, 
        message: errorMessage,
        outputDir: inputs.outputFolder 
      };
    }
  }
}

// Export for use in other modules
export { BillingWorkflowInteractive, BillingWorkflowFormInputs };
