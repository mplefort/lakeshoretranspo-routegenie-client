#!/usr/bin/env node

/**
 * Simple Billing Workflow - JavaScript Version
 * This version can be run directly without TypeScript compilation
 */

const fs = require('fs');
const path = require('path');

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`)
};

function showHelp() {
  console.log(`
🚀 Billing Workflow CLI

USAGE:
  node billing-workflow.js [OPTIONS]

OPTIONS:
  -s, --start-date    Start date (MM/DD/YYYY) [default: today]
  -e, --end-date      End date (MM/DD/YYYY) [default: today]  
  -n, --invoice-num   Starting invoice number [default: 1001]
  -o, --output        Output directory [default: ./reports/billing]
  -h, --help          Show this help message

EXAMPLES:
  # Run with default settings (today's date)
  node billing-workflow.js

  # Specify date range
  node billing-workflow.js -s 06/01/2025 -e 06/19/2025

  # With custom invoice number and output directory
  node billing-workflow.js -s 06/01/2025 -e 06/19/2025 -n 2000 -o ./my-output

PREREQUISITES:
  1. Make sure your .env file is configured with RouteGenie credentials
  2. Ensure TypeScript is compiled: npm run build
  3. Install dependencies: npm install

NEXT STEPS:
  To use the full TypeScript version, run:
    npm run billing-workflow
  
  Or use the interactive version:
    npm run billing-workflow:interactive
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    startDate: null,
    endDate: null,
    invoiceNumber: 1001,
    outputDir: './reports/billing',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-s':
      case '--start-date':
        options.startDate = nextArg;
        i++;
        break;
      case '-e':
      case '--end-date':
        options.endDate = nextArg;
        i++;
        break;
      case '-n':
      case '--invoice-num':
        options.invoiceNumber = parseInt(nextArg, 10);
        i++;
        break;
      case '-o':
      case '--output':
        options.outputDir = nextArg;
        i++;
        break;
    }
  }

  // Set defaults for dates
  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  
  if (!options.startDate) options.startDate = todayStr;
  if (!options.endDate) options.endDate = todayStr;

  return options;
}

function validateEnvironment() {
  logger.info('🔍 Validating environment...');
  
  // Check for .env file
  if (!fs.existsSync('.env')) {
    logger.error('❌ .env file not found. Please create it with your RouteGenie credentials.');
    return false;
  }

  // Check for dist directory (compiled TypeScript)
  if (!fs.existsSync('dist')) {
    logger.warn('⚠️  TypeScript not compiled. Run "npm run build" first.');
    logger.info('💡 Attempting to compile now...');
    return false;
  }

  // Check for required mappings
  const mappingsDir = './mappings';
  if (!fs.existsSync(mappingsDir)) {
    logger.error('❌ Mappings directory not found.');
    return false;
  }

  const requiredFiles = ['QB_Service_codes.csv'];
  for (const file of requiredFiles) {
    const filePath = path.join(mappingsDir, file);
    if (!fs.existsSync(filePath)) {
      logger.error(`❌ Required mapping file not found: ${filePath}`);
      return false;
    }
  }

  logger.success('✅ Environment validation passed');
  return true;
}

function main() {
  console.log('🚀 Billing Workflow CLI (JavaScript Version)\n');
  
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }

  logger.info('📋 Configuration:');
  logger.info(`   Start Date: ${options.startDate}`);
  logger.info(`   End Date: ${options.endDate}`);
  logger.info(`   Starting Invoice #: ${options.invoiceNumber}`);
  logger.info(`   Output Directory: ${options.outputDir}`);
  
  if (!validateEnvironment()) {
    console.log(`
❌ Environment validation failed.

🛠️  SETUP INSTRUCTIONS:

1. Install dependencies:
   npm install

2. Build TypeScript:
   npm run build

3. Ensure .env file exists with RouteGenie credentials

4. Then run the full workflow:
   npm run billing-workflow -s ${options.startDate} -e ${options.endDate} -n ${options.invoiceNumber}

📖 For detailed setup instructions, see BILLING_WORKFLOW.md
`);
    process.exit(1);
  }

  logger.info(`
✅ Environment ready! 

🚀 To run the full billing workflow, use:
   npm run billing-workflow -- -s ${options.startDate} -e ${options.endDate} -n ${options.invoiceNumber} -o "${options.outputDir}"

🎯 Or for interactive mode:
   npm run billing-workflow:interactive

📖 For help and documentation, see BILLING_WORKFLOW.md
`);
}

if (require.main === module) {
  main();
}
