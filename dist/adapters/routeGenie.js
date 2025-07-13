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
exports.generateBillingReport = exports.getAccessToken = void 0;
const axios_1 = __importDefault(require("axios"));
const qs_1 = __importDefault(require("qs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Obtain OAuth2 access token from RouteGenie API using client credentials
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.Logger.info(`Requesting access token from ${config_1.RG_HOST}/oauth2/token/`);
        const creds = Buffer.from(`${config_1.RG_CLIENT_ID}:${config_1.RG_CLIENT_SECRET}`).toString('base64');
        const body = qs_1.default.stringify({ grant_type: 'client_credentials' });
        const res = yield axios_1.default.post(`${config_1.RG_HOST}/oauth2/token/`, body, {
            headers: {
                Authorization: `Basic ${creds}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return res.data.access_token; // Return the access token string
    });
}
exports.getAccessToken = getAccessToken;
// Format a date string MM/DD/YYYY to YYYY_MM_DD for filenames
function formatDateForFile(dateStr) {
    const [month, day, year] = dateStr.split('/');
    return `${year}_${month.padStart(2, '0')}_${day.padStart(2, '0')}`;
}
// Download a CSV file from the given URL, retrying if the file is not ready (still generating)
function downloadCsvWhenReady(csvUrl, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const wait = (ms) => new Promise(res => setTimeout(res, ms));
        let attempt = 1;
        while (true) {
            logger_1.Logger.progress(`Attempt to download RG Report number ${attempt}`);
            const dl = yield axios_1.default.get(csvUrl, { responseType: 'stream' });
            // Save the downloaded file to disk
            yield new Promise((resolve, reject) => {
                const writer = fs_1.default.createWriteStream(filePath);
                dl.data.pipe(writer);
                writer.on('finish', () => resolve(undefined)); // Only resolve when writing is finished
                writer.on('error', reject);
            });
            // Check if the file is actually the "report generating" HTML message
            const content = fs_1.default.readFileSync(filePath, 'utf8');
            if (!content.includes('<title>Report generating</title>')) {
                break; // Exit loop if the file is a real CSV
            }
            logger_1.Logger.info('Still generating; retrying in 10s...');
            yield wait(10000); // Wait 10 seconds before retrying
            attempt++;
        }
    });
}
// Main function to generate and download a billing report to CSV
function generateBillingReport(periodFrom, // Start date (MM/DD/YYYY)
periodTo, // End date (MM/DD/YYYY)
outputDir // Directory to save the CSV
) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAccessToken();
        // Fetch available report templates for the configured user
        const templates = yield axios_1.default.get(`${config_1.RG_HOST}/open_api/api/v1/report_template/`, { headers: { Authorization: `Bearer ${token}` }, params: { user_id: config_1.RG_USER_ID } });
        // Find the "Billing Template" report template
        const template = templates.data.results.find((t) => t.name === 'Weekly Billing Codes Report template');
        if (!template)
            throw new Error(`No Weekly Billing Codes Report template for user ${config_1.RG_USER_ID}`);
        // Request the report to be generated for the given period
        const gen = yield axios_1.default.post(`${config_1.RG_HOST}/open_api/api/v1/report/`, { name: 'Weekly Billing Report', creator: config_1.RG_USER_ID, template: template.id, period_from: periodFrom, period_to: periodTo }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        const csvUrl = gen.data.csv; // URL to download the generated CSV
        // Ensure the output directory exists
        yield fs_1.default.promises.mkdir(outputDir, { recursive: true });
        const prefix = `${formatDateForFile(periodFrom)}-${formatDateForFile(periodTo)}`;
        const filePath = path_1.default.join(outputDir, `${prefix}_billing.csv`);
        // Download the CSV, retrying if necessary until the report is ready
        yield downloadCsvWhenReady(csvUrl, filePath);
        logger_1.Logger.success(`RG Bill report saved to ${filePath}`);
    });
}
exports.generateBillingReport = generateBillingReport;
//# sourceMappingURL=routeGenie.js.map