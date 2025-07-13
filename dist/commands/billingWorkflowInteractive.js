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
exports.BillingWorkflowInteractive = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const routeGenie_1 = require("../adapters/routeGenie");
const invoiceBuilder_1 = require("../services/invoiceBuilder");
const qbSync_1 = require("../services/qbSync");
const logger_1 = require("../utils/logger");
const paths_1 = require("../utils/paths");
const fast_csv_1 = require("fast-csv");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
class BillingWorkflowInteractive {
    constructor() {
        // Initialize logger with default settings for UI usage
        // This will use electron-log's default location:
        // Windows: %USERPROFILE%\AppData\Roaming\lakeshore-invoicer\logs\main.log
        // macOS: ~/Library/Logs/lakeshore-invoicer/main.log
        // Linux: ~/.config/lakeshore-invoicer/logs/main.log
        logger_1.Logger.initialize(undefined, false); // No debug mode for UI, use default location
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
    buildPayerMap(inputCsv) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    formatDateForFile(dateStr) {
        const [month, day, year] = dateStr.split('/');
        return `${year}_${month.padStart(2, '0')}_${day.padStart(2, '0')}`;
    }
    /**
     * Execute billing workflow with form inputs (for UI integration)
     */
    runFromFormInputs(inputs) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.Logger.info('Starting Lakeshore Transportation Billing Workflow from form inputs', true);
                const logFile = logger_1.Logger.getLogFilePath();
                logger_1.Logger.info(`Log file: ${logFile}`, true);
                // Use form inputs
                const startDate = inputs.startDate;
                const endDate = inputs.endDate;
                const invoiceNumber = inputs.invoiceNumber;
                const outputDir = path_1.default.resolve(inputs.outputFolder);
                const billingFrequencyFilter = inputs.billingFrequency;
                // Validate dates
                if (!this.validateDate(startDate)) {
                    const errorMsg = `Invalid start date format: ${startDate}. Please use MM/DD/YYYY format.`;
                    logger_1.Logger.error(errorMsg);
                    return { success: false, message: errorMsg, outputDir };
                }
                if (!this.validateDate(endDate)) {
                    const errorMsg = `Invalid end date format: ${endDate}. Please use MM/DD/YYYY format.`;
                    logger_1.Logger.error(errorMsg);
                    return { success: false, message: errorMsg, outputDir };
                }
                logger_1.Logger.info(`Configuration:`);
                logger_1.Logger.info(`  • Date Range: ${startDate} to ${endDate}`);
                logger_1.Logger.info(`  • Starting Invoice Number: ${invoiceNumber}`);
                logger_1.Logger.info(`  • Output Directory: ${outputDir}`);
                logger_1.Logger.info(`  • Billing Frequency Filter: ${billingFrequencyFilter}`);
                // Ensure output directory exists
                if (!fs_1.default.existsSync(outputDir)) {
                    fs_1.default.mkdirSync(outputDir, { recursive: true });
                    logger_1.Logger.info(`Created output directory: ${outputDir}`);
                }
                // Step 1: Pull billing report from RouteGenie
                logger_1.Logger.progress('Downloading billing report from RouteGenie...');
                yield (0, routeGenie_1.generateBillingReport)(startDate, endDate, outputDir);
                const prefix = `${this.formatDateForFile(startDate)}-${this.formatDateForFile(endDate)}`;
                const billingCsvPath = path_1.default.join(outputDir, `${prefix}_billing.csv`);
                if (!fs_1.default.existsSync(billingCsvPath)) {
                    throw new Error(`Billing report not found at expected location: ${billingCsvPath}`);
                }
                // Step 2: Build invoices
                logger_1.Logger.progress('Building invoices from billing data...');
                const invoicesCsvPath = path_1.default.join(outputDir, 'invoices.csv');
                yield (0, invoiceBuilder_1.buildInvoices)(billingCsvPath, invoicesCsvPath, invoiceNumber);
                logger_1.Logger.success('Invoices generated successfully');
                // Step 3: Generate QuickBooks sync file
                logger_1.Logger.progress('Generating QuickBooks sync file...');
                const qbCodesPath = (0, paths_1.resolveFromExecutable)('mappings', 'QB_Service_codes.csv');
                logger_1.Logger.info(`Looking for QB Service codes at: ${qbCodesPath}`);
                if (!fs_1.default.existsSync(qbCodesPath)) {
                    // Try alternative paths for debugging
                    const execDir = (0, paths_1.resolveFromExecutable)('');
                    logger_1.Logger.error(`QB Service codes file not found at: ${qbCodesPath}`);
                    logger_1.Logger.error(`Executable directory: ${execDir}`);
                    logger_1.Logger.error(`Directory contents: ${fs_1.default.existsSync(execDir) ? fs_1.default.readdirSync(execDir).join(', ') : 'Directory does not exist'}`);
                    const mappingsDir = (0, paths_1.resolveFromExecutable)('mappings');
                    logger_1.Logger.error(`Mappings directory: ${mappingsDir}`);
                    logger_1.Logger.error(`Mappings directory exists: ${fs_1.default.existsSync(mappingsDir)}`);
                    if (fs_1.default.existsSync(mappingsDir)) {
                        logger_1.Logger.error(`Mappings directory contents: ${fs_1.default.readdirSync(mappingsDir).join(', ')}`);
                    }
                    throw new Error(`QuickBooks service codes mapping file not found: ${qbCodesPath}`);
                }
                const qbCodes = yield (0, qbSync_1.loadQBServiceCodes)(qbCodesPath);
                const payerMap = yield this.buildPayerMap(billingCsvPath);
                // Get invoice records using the exported helpers
                const agg = yield (0, invoiceBuilder_1.parseCsvRows)(billingCsvPath).then(invoiceBuilder_1.aggregateRows);
                const records = (0, invoiceBuilder_1.flattenAggregatedResults)(agg, invoiceNumber);
                const today = new Date();
                yield (0, qbSync_1.buildQBSyncFile)(records, qbCodes, invoiceNumber, today, outputDir, payerMap, billingFrequencyFilter);
                const fileCount = fs_1.default.readdirSync(outputDir).length;
                const successMessage = `Billing workflow completed successfully! Generated ${fileCount} files in ${outputDir}`;
                logger_1.Logger.success(successMessage);
                logger_1.Logger.info(`Generated files:\n  • Billing Report: ${billingCsvPath}\n  • Invoices: ${invoicesCsvPath}\n  • QuickBooks Sync file in ${outputDir}`);
                return {
                    success: true,
                    message: successMessage,
                    outputDir
                };
            }
            catch (error) {
                const errorMessage = `Workflow failed: ${error.message || error}`;
                logger_1.Logger.error(errorMessage);
                if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('authenticate')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('credentials'))) {
                    logger_1.Logger.error('Authentication failed. Please check your RouteGenie credentials in .env file.');
                }
                else if ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('ENOENT')) {
                    logger_1.Logger.error('File not found. Please check that all required mapping files exist.');
                }
                else if (((_d = error.message) === null || _d === void 0 ? void 0 : _d.includes('network')) || ((_e = error.message) === null || _e === void 0 ? void 0 : _e.includes('timeout'))) {
                    logger_1.Logger.error('Network error. Please check your internet connection and try again.');
                }
                return {
                    success: false,
                    message: errorMessage,
                    outputDir: inputs.outputFolder
                };
            }
        });
    }
}
exports.BillingWorkflowInteractive = BillingWorkflowInteractive;
//# sourceMappingURL=billingWorkflowInteractive.js.map