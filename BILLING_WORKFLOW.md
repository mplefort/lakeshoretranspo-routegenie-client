# Billing Workflow CLI Documentation

## Overview

The Lakeshore Transportation Billing Workflow CLI is a comprehensive tool that automates the complete billing process from RouteGenie data extraction to QuickBooks-ready invoice generation.

## Features

✅ **Single CLI Entry Point** - One command runs the entire workflow  
✅ **Interactive Mode** - Prompts for missing inputs  
✅ **Flexible Arguments** - Command-line arguments or interactive prompts  
✅ **Smart Defaults** - Uses today's date if not specified  
✅ **Comprehensive Logging** - Detailed logs for troubleshooting  
✅ **Error Handling** - User-friendly error messages  
✅ **Cross-Platform** - Works on Windows, Linux, and macOS  
✅ **Standalone Executables** - Can be built as single-file executables  

## Quick Start

### Method 1: Using the Shell Script (Recommended)

```bash
# Make the script executable (Linux/macOS)
chmod +x run-billing-workflow.sh

# Run with interactive prompts
./run-billing-workflow.sh

# Run with specific date range
./run-billing-workflow.sh -s 06/01/2025 -e 06/19/2025
```

### Method 2: Using Node.js Directly

```bash
# Install dependencies
npm install

# Run interactively
npm run billing-workflow:interactive

# Run with arguments
npm run billing-workflow:interactive -- -s 06/01/2025 -e 06/19/2025 -n 2000
```

### Method 3: Using Windows Batch File

```cmd
REM Run with interactive prompts
run-billing-workflow.bat

REM Run with specific date range
run-billing-workflow.bat -s 06/01/2025 -e 06/19/2025
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--start-date` | `-s` | Start date (MM/DD/YYYY) | Today's date |
| `--end-date` | `-e` | End date (MM/DD/YYYY) | Today's date |
| `--invoice-number` | `-n` | Starting invoice number | 1000 |
| `--output-dir` | `-o` | Output directory | ./reports/billing |
| `--log-file` | `-l` | Log file path | ./logs/billing-workflow-YYYY-MM-DD.log |
| `--interactive` | `-i` | Force interactive mode | false |
| `--help` | `-h` | Show help message | - |

## Usage Examples

### Basic Usage (Interactive)
```bash
./run-billing-workflow.sh
```
This will prompt you for:
- Start date (defaults to today)
- End date (defaults to today)  
- Starting invoice number (defaults to 1000)
- Output directory (defaults to ./reports/billing)

### Specify Date Range
```bash
./run-billing-workflow.sh -s 06/01/2025 -e 06/19/2025
```

### Custom Invoice Number and Output Directory
```bash
./run-billing-workflow.sh -s 06/01/2025 -e 06/19/2025 -n 2000 -o ./custom-output
```

### Force Interactive Mode
```bash
./run-billing-workflow.sh --interactive
```

## Generated Files

The workflow generates several files in the output directory:

1. **Billing Report**: `YYYY_MM_DD-YYYY_MM_DD_billing.csv`
   - Raw billing data from RouteGenie
   
2. **Invoices**: `invoices.csv`
   - Processed invoices ready for review
   
3. **QuickBooks Sync**: `YYYY_MM_DD_QB_invoice_sync.csv`
   - QuickBooks-formatted import file

4. **Log File**: `logs/billing-workflow-YYYY-MM-DD.log`
   - Detailed execution log for troubleshooting

## Prerequisites

### Required Environment Variables

Create a `.env` file in the project root with:

```env
# RouteGenie API Configuration
RG_HOST=https://lakeshoretranspo.routegenie.com:8000
RG_USER_ID=37
RG_CLIENT_ID=your_route_genie_client_id_here
RG_CLIENT_SECRET=your_route_genie_client_secret_here
```

### Required Files

Ensure these mapping files exist:
- `mappings/QB_Service_codes.csv` - QuickBooks service code mappings

### System Requirements

- **Node.js**: Version 16 or later
- **npm**: Comes with Node.js
- **Internet Connection**: Required for RouteGenie API calls

## Building Standalone Executables

To create standalone executables that don't require Node.js:

```bash
# Install nexe build tool
npm run install:nexe

# Build all platforms
npm run build:executables

# Or build specific platforms
npm run build:windows    # Creates build/billingWorkflow-windows.exe
npm run build:linux      # Creates build/billingWorkflow-linux  
npm run build:macos      # Creates build/billingWorkflow-macos
```

The executables will be created in the `build/` directory and can be distributed to users who don't have Node.js installed.

## Error Handling

The CLI provides detailed error messages for common issues:

### Authentication Errors
```
❌ Authentication failed. Please check your RouteGenie credentials in .env file.
Make sure RG_CLIENT_ID and RG_CLIENT_SECRET are set in your .env file.
```

### File Not Found Errors
```
❌ File not found. Please check that all required mapping files exist.
Required files: mappings/QB_Service_codes.csv
```

### Network Errors
```
❌ Network error. Please check your internet connection and try again.
```

### Date Format Errors
```
❌ Invalid start date format: 6/1/2025. Please use MM/DD/YYYY format.
```

## Troubleshooting

### Check Log Files
Log files are automatically created in `logs/billing-workflow-YYYY-MM-DD.log` and contain detailed information about the workflow execution.

### Common Issues

1. **Missing .env file**: Copy `.env.example` to `.env` and fill in your credentials
2. **Missing mapping files**: Ensure `mappings/QB_Service_codes.csv` exists
3. **Date format**: Always use MM/DD/YYYY format (e.g., 06/01/2025, not 6/1/2025)
4. **Permissions**: Make sure the script has execute permissions on Linux/macOS

### Verbose Output
All operations include progress indicators:
```
🚀 Starting Lakeshore Transportation Billing Workflow
ℹ️  Configuration:
ℹ️    • Date Range: 06/01/2025 to 06/19/2025
ℹ️    • Starting Invoice Number: 1000
ℹ️    • Output Directory: /path/to/reports/billing
🔄 Downloading billing report from RouteGenie...
✅ Billing report downloaded successfully
🔄 Building invoices from billing data...
✅ Invoices generated successfully
🔄 Generating QuickBooks sync file...
✅ QuickBooks sync file generated successfully
🎉 Billing workflow completed successfully!
```

## Integration with Existing Workflow

This CLI can be integrated into existing processes:

### Scheduled Execution
```bash
# Add to cron for daily execution at 6 AM
0 6 * * * cd /path/to/project && ./run-billing-workflow.sh
```

### Batch Processing
```bash
# Process multiple date ranges
./run-billing-workflow.sh -s 06/01/2025 -e 06/07/2025 -o ./week1
./run-billing-workflow.sh -s 06/08/2025 -e 06/14/2025 -o ./week2
./run-billing-workflow.sh -s 06/15/2025 -e 06/21/2025 -o ./week3
```

## Support

For issues or questions:
1. Check the log files for detailed error information
2. Verify all prerequisites are met
3. Ensure environment variables are correctly set
4. Test with a simple date range first
