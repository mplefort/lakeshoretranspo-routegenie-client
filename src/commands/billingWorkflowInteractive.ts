#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import * as readline from 'readline';
import { generateBillingReport } from '../adapters/routeGenie';
import { buildInvoices, flattenAggregatedResults, parseCsvRows, aggregateRows } from '../services/invoiceBuilder';
import { loadQBServiceCodes, buildQBSyncFile } from '../services/qbSync';
import { Logger } from '../utils/logger';
import { resolveFromExecutable } from '../utils/paths';
import { parse as csvParse } from 'fast-csv';
import { config } from 'dotenv';

// Load environment variables
config();

interface WorkflowOptions {
  startDate?: string;
  endDate?: string;
  invoiceNumber?: string;
  outputDir?: string;
  logFile?: string;
  help?: boolean;
  interactive?: boolean;
  debug?: boolean;
}

class BillingWorkflowInteractive {
  private options: WorkflowOptions;
  private rl: readline.Interface;

  constructor(options: WorkflowOptions) {
    this.options = options;
    const logFile = options.logFile || resolveFromExecutable('logs', `billing-workflow-${this.getDateString()}.log`);
    const debugMode = options.debug || false;
    if(debugMode) {
      console.log('Debug mode enabled. Verbose logging to console.');
    }
    
    // Initialize the global logger
    Logger.initialize(logFile, debugMode);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
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

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private parseArgs(): WorkflowOptions {
    const args = process.argv.slice(2);
    const options: WorkflowOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '-s':
        case '--start-date':
          options.startDate = args[++i];
          break;
        case '-e':
        case '--end-date':
          options.endDate = args[++i];
          break;
        case '-n':
        case '--invoice-number':
          options.invoiceNumber = args[++i];
          break;
        case '-o':
        case '--output-dir':
          options.outputDir = args[++i];
          break;
        case '-l':
        case '--log-file':
          options.logFile = args[++i];
          break;
        case '-i':
        case '--interactive':
          options.interactive = true;
          break;
        case '-d':
        case '--debug':
          options.debug = true;
          break;
        case '-h':
        case '--help':
          options.help = true;
          break;
      }
    }

    return { ...this.options, ...options };
  }

  private showHelp(): void {
    console.log(`
Lakeshore Transportation Billing Workflow v1.0.0

USAGE:
  billing-workflow [OPTIONS]

OPTIONS:
  -s, --start-date <date>      Start date (MM/DD/YYYY)
  -e, --end-date <date>        End date (MM/DD/YYYY)  
  -n, --invoice-number <num>   Starting invoice number (default: 1000)
  -o, --output-dir <path>      Output directory (default: ./reports/billing)
  -l, --log-file <path>        Log file path
  -i, --interactive            Interactive mode - prompt for missing inputs
  -d, --debug                  Enable debug mode (verbose console logging)
  -h, --help                   Show this help message

EXAMPLES:
  billing-workflow                                    # Use today's date for both start and end
  billing-workflow -s 06/01/2025 -e 06/19/2025      # Specify date range
  billing-workflow -s 06/01/2025 -e 06/19/2025 -n 2000 -o ./output
  billing-workflow --interactive                     # Force interactive mode
  billing-workflow --debug                           # Enable verbose console logging
  
NOTES:
  • Dates must be in MM/DD/YYYY format
  • If dates are not provided, today's date will be used
  • Output directory defaults to ./reports/billing
  • Logs are saved to ./logs/billing-workflow-YYYY-MM-DD.log
`);
  }

  private async getInputsInteractively(): Promise<{ startDate: string; endDate: string; invoiceNumber: number; outputDir: string }> {
    const today = new Date();
    const defaultDate = this.formatDateToMDY(today);
    const defaultOutputDir = resolveFromExecutable('reports', 'billing');
    const defaultInvoiceNum = '1000';

    let startDate = this.options.startDate;
    let endDate = this.options.endDate;
    let invoiceNumber = this.options.invoiceNumber;
    let outputDir = this.options.outputDir;

    if (!startDate) {
      startDate = await this.question(`Enter start date (MM/DD/YYYY) [${defaultDate}]: `);
      if (!startDate) startDate = defaultDate;

      while (!this.validateDate(startDate)) {
        Logger.error('Invalid date format. Please use MM/DD/YYYY.');
        startDate = await this.question('Enter start date (MM/DD/YYYY): ');
      }
    }

    if (!endDate) {
      endDate = await this.question(`Enter end date (MM/DD/YYYY) [${defaultDate}]: `);
      if (!endDate) endDate = defaultDate;

      while (!this.validateDate(endDate)) {
        Logger.error('Invalid date format. Please use MM/DD/YYYY.');
        endDate = await this.question('Enter end date (MM/DD/YYYY): ');
      }
    }

    if (!invoiceNumber) {
      invoiceNumber = await this.question(`Enter starting invoice number [${defaultInvoiceNum}]: `);
      if (!invoiceNumber) invoiceNumber = defaultInvoiceNum;
    }

    if (!outputDir) {
      outputDir = await this.question(`Enter output directory [${defaultOutputDir}]: `);
      if (!outputDir) outputDir = defaultOutputDir;
    }

    return {
      startDate,
      endDate,
      invoiceNumber: parseInt(invoiceNumber, 10),
      outputDir: path.resolve(outputDir)
    };
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

  async run(): Promise<void> {
    const options = this.parseArgs();

    if (options.help) {
      this.showHelp();
      this.rl.close();
      return;
    }

    try {
      Logger.info('starting Lakeshore Transportation Billing Workflow', true);
      
      const logFile = this.options.logFile || resolveFromExecutable('logs', `billing-workflow-${this.getDateString()}.log`);
      Logger.info(`Log file: ${logFile}`, true);

      let startDate: string, endDate: string, invoiceNumber: number, outputDir: string;

      if (options.interactive || !options.startDate || !options.endDate) {
        Logger.info('Starting interactive input mode...');
        const inputs = await this.getInputsInteractively();
        startDate = inputs.startDate;
        endDate = inputs.endDate;
        invoiceNumber = inputs.invoiceNumber;
        outputDir = inputs.outputDir;
      } else {
        // Use provided options or defaults
        const today = new Date();
        const defaultDate = this.formatDateToMDY(today);

        startDate = options.startDate || defaultDate;
        endDate = options.endDate || defaultDate;
        invoiceNumber = parseInt(options.invoiceNumber || '1000', 10);
        outputDir = path.resolve(options.outputDir || resolveFromExecutable('reports', 'billing'));
      }

      // Don't close readline here if we're in interactive mode

      // Validate dates
      if (!this.validateDate(startDate)) {
        Logger.error(`Invalid start date format: ${startDate}. Please use MM/DD/YYYY format.`);
        this.rl.close();
        process.exit(1);
      }

      if (!this.validateDate(endDate)) {
        Logger.error(`Invalid end date format: ${endDate}. Please use MM/DD/YYYY format.`);
        this.rl.close();
        process.exit(1);
      }

      Logger.info(`Configuration:`);
      Logger.info(`  • Date Range: ${startDate} to ${endDate}`);
      Logger.info(`  • Starting Invoice Number: ${invoiceNumber}`);
      Logger.info(`  • Output Directory: ${outputDir}`);

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
      await buildQBSyncFile(records, qbCodes, invoiceNumber, today, outputDir, payerMap);


      // Summary
      Logger.success(
        `Billing workflow completed successfully - Generated files:\n  
        • Billing Report: ${billingCsvPath}\n  
        • Invoices: ${invoicesCsvPath}\n  
        • QuickBooks Sync: QB sync file in ${outputDir}`,
      );

      const fileCount = fs.readdirSync(outputDir).length;
      Logger.info(`Total files in output directory: ${fileCount}`);

      // Wait for user to press enter before exiting
      await this.question('\n✅ Workflow completed! Press Enter to exit...');

    } catch (error: any) {
      console.log(error);
      Logger.error(`❌ Workflow failed:${error}`);

      if (error.message?.includes('authenticate') || error.message?.includes('credentials')) {
        Logger.error('Authentication failed. Please check your RouteGenie credentials in .env file.');
        Logger.error('Make sure RG_CLIENT_ID and RG_CLIENT_SECRET are set in your .env file.');
      } else if (error.message?.includes('ENOENT')) {
        Logger.error('File not found. Please check that all required mapping files exist.');
        Logger.error('Required files: mappings/QB_Service_codes.csv');
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        Logger.error('Network error. Please check your internet connection and try again.');
      }

      // Wait for user to press enter before exiting even on error
      await this.question('\n❌ Workflow failed! Press Enter to exit...');
      process.exit(1);
    } finally {
      this.rl.close();
      Logger.close();
    }
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the workflow
const workflow = new BillingWorkflowInteractive({});
workflow.run();
