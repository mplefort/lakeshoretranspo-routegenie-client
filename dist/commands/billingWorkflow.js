#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const readline_sync_1 = __importDefault(require("readline-sync"));
const routeGenie_1 = require("../adapters/routeGenie");
const invoiceBuilder_1 = require("../services/invoiceBuilder");
const qbSync_1 = require("../services/qbSync");
const logger_1 = require("../utils/logger");
const fast_csv_1 = require("fast-csv");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
class BillingWorkflow {
    constructor(options) {
        this.options = options;
        const logFile = options.logFile || path_1.default.join(process.cwd(), 'logs', `billing-workflow-${this.getDateString()}.log`);
        this.logger = new logger_1.Logger(logFile);
    }
    getDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    }
    formatDateToMDY(date) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }
    validateDate(dateStr) {
        const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
        if (!regex.test(dateStr))
            return false;
        const [month, day, year] = dateStr.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return date.getMonth() === month - 1 && date.getDate() === day && date.getFullYear() === year;
    }
    getInputs() {
        let startDate = this.options.startDate;
        let endDate = this.options.endDate;
        let invoiceNumber = this.options.invoiceNumber;
        let outputDir = this.options.outputDir;
        const today = new Date();
        const defaultDate = this.formatDateToMDY(today);
        if (this.options.interactive || !startDate || !endDate) {
            this.logger.info('Starting interactive input mode...');
            if (!startDate) {
                startDate = readline_sync_1.default.question(`Enter start date (MM/DD/YYYY) [${defaultDate}]: `, {
                    defaultInput: defaultDate
                });
            }
            while (startDate && !this.validateDate(startDate)) {
                this.logger.error('Invalid date format. Please use MM/DD/YYYY.');
                startDate = readline_sync_1.default.question('Enter start date (MM/DD/YYYY): ');
            }
            if (!endDate) {
                endDate = readline_sync_1.default.question(`Enter end date (MM/DD/YYYY) [${defaultDate}]: `, {
                    defaultInput: defaultDate
                });
            }
            while (endDate && !this.validateDate(endDate)) {
                this.logger.error('Invalid date format. Please use MM/DD/YYYY.');
                endDate = readline_sync_1.default.question('Enter end date (MM/DD/YYYY): ');
            }
            if (!invoiceNumber) {
                const defaultInvoiceNum = '1000';
                invoiceNumber = readline_sync_1.default.question(`Enter starting invoice number [${defaultInvoiceNum}]: `, {
                    defaultInput: defaultInvoiceNum
                });
            }
            if (!outputDir) {
                const defaultOutputDir = path_1.default.join(process.cwd(), 'reports', 'billing');
                outputDir = readline_sync_1.default.question(`Enter output directory [${defaultOutputDir}]: `, {
                    defaultInput: defaultOutputDir
                });
            }
        }
        // Set defaults if still not provided
        if (!startDate)
            startDate = defaultDate;
        if (!endDate)
            endDate = defaultDate;
        if (!invoiceNumber)
            invoiceNumber = '1000';
        if (!outputDir)
            outputDir = path_1.default.join(process.cwd(), 'reports', 'billing');
        return {
            startDate,
            endDate,
            invoiceNumber: parseInt(invoiceNumber, 10),
            outputDir: path_1.default.resolve(outputDir)
        };
    }
    async buildPayerMap(inputCsv) {
        return new Promise((resolve, reject) => {
            const payerMap = {};
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
    formatDateForFile(dateStr) {
        const [month, day, year] = dateStr.split('/');
        return `${year}_${month.padStart(2, '0')}_${day.padStart(2, '0')}`;
    }
    async run() {
        try {
            this.logger.info('🚀 Starting Lakeshore Transportation Billing Workflow');
            this.logger.info(`Log file: ${this.logger['logFile']}`);
            // Get user inputs
            const { startDate, endDate, invoiceNumber, outputDir } = this.getInputs();
            this.logger.info(`Configuration:`);
            this.logger.info(`  • Date Range: ${startDate} to ${endDate}`);
            this.logger.info(`  • Starting Invoice Number: ${invoiceNumber}`);
            this.logger.info(`  • Output Directory: ${outputDir}`);
            // Ensure output directory exists
            if (!fs_1.default.existsSync(outputDir)) {
                fs_1.default.mkdirSync(outputDir, { recursive: true });
                this.logger.info(`Created output directory: ${outputDir}`);
            }
            // Step 1: Pull billing report from RouteGenie
            this.logger.progress('Downloading billing report from RouteGenie...');
            await (0, routeGenie_1.generateBillingReport)(startDate, endDate, outputDir);
            const prefix = `${this.formatDateForFile(startDate)}-${this.formatDateForFile(endDate)}`;
            const billingCsvPath = path_1.default.join(outputDir, `${prefix}_billing.csv`);
            if (!fs_1.default.existsSync(billingCsvPath)) {
                throw new Error(`Billing report not found at expected location: ${billingCsvPath}`);
            }
            this.logger.success(`Billing report downloaded successfully`);
            // Step 2: Build invoices
            this.logger.progress('Building invoices from billing data...');
            const invoicesCsvPath = path_1.default.join(outputDir, 'invoices.csv');
            await (0, invoiceBuilder_1.buildInvoices)(billingCsvPath, invoicesCsvPath);
            this.logger.success('Invoices generated successfully');
            // Step 3: Generate QuickBooks sync file
            this.logger.progress('Generating QuickBooks sync file...');
            const qbCodesPath = path_1.default.resolve(__dirname, '../../mappings/QB_Service_codes.csv');
            if (!fs_1.default.existsSync(qbCodesPath)) {
                throw new Error(`QuickBooks service codes mapping file not found: ${qbCodesPath}`);
            }
            const qbCodes = await (0, qbSync_1.loadQBServiceCodes)(qbCodesPath);
            const payerMap = await this.buildPayerMap(billingCsvPath);
            // Get invoice records using the exported helpers
            const agg = await (0, invoiceBuilder_1.parseCsvRows)(billingCsvPath).then(invoiceBuilder_1.aggregateRows);
            const records = (0, invoiceBuilder_1.flattenAggregatedResults)(agg);
            const today = new Date();
            await (0, qbSync_1.buildQBSyncFile)(records, qbCodes, invoiceNumber, today, outputDir, payerMap);
            this.logger.success('QuickBooks sync file generated successfully');
            // Summary
            this.logger.success('🎉 Billing workflow completed successfully!');
            this.logger.info('Generated files:');
            this.logger.info(`  • Billing Report: ${billingCsvPath}`);
            this.logger.info(`  • Invoices: ${invoicesCsvPath}`);
            this.logger.info(`  • QuickBooks Sync: QB sync file in ${outputDir}`);
            const fileCount = fs_1.default.readdirSync(outputDir).length;
            this.logger.info(`Total files in output directory: ${fileCount}`);
        }
        catch (error) {
            this.logger.error('❌ Workflow failed:', error);
            if (error.message?.includes('authenticate') || error.message?.includes('credentials')) {
                this.logger.error('Authentication failed. Please check your RouteGenie credentials in .env file.');
            }
            else if (error.message?.includes('ENOENT')) {
                this.logger.error('File not found. Please check that all required mapping files exist.');
            }
            else if (error.message?.includes('network') || error.message?.includes('timeout')) {
                this.logger.error('Network error. Please check your internet connection and try again.');
            }
            process.exit(1);
        }
        finally {
            this.logger.close();
        }
    }
}
// CLI setup
const program = new commander_1.Command();
program
    .name('billing-workflow')
    .description('Lakeshore Transportation Billing Workflow - Pull reports, build invoices, and generate QuickBooks sync files')
    .version('1.0.0')
    .option('-s, --start-date <date>', 'Start date (MM/DD/YYYY)', '')
    .option('-e, --end-date <date>', 'End date (MM/DD/YYYY)', '')
    .option('-n, --invoice-number <number>', 'Starting invoice number', '1000')
    .option('-o, --output-dir <path>', 'Output directory', '')
    .option('-l, --log-file <path>', 'Log file path', '')
    .option('-i, --interactive', 'Interactive mode - prompt for missing inputs', false)
    .helpOption('-h, --help', 'Display help for command')
    .addHelpText('after', `
Examples:
  $ billing-workflow                                    # Interactive mode
  $ billing-workflow -s 06/01/2025 -e 06/19/2025      # Specify date range
  $ billing-workflow -s 06/01/2025 -e 06/19/2025 -n 2000 -o ./output
  $ billing-workflow --interactive                     # Force interactive mode
  
Notes:
  • Dates must be in MM/DD/YYYY format
  • If dates are not provided, today's date will be used
  • Output directory defaults to ./reports/billing
  • Logs are saved to ./logs/billing-workflow-YYYY-MM-DD.log
`);
program.action(async (options) => {
    const workflow = new BillingWorkflow(options);
    await workflow.run();
});
// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
// Parse command line arguments
program.parse();
