# lakeshoretranspo-routegenie-client

A Node.js client for RouteGenie API using Axios and OAuth2 client_credentials.

ne-mt-invoicer/
│
├── src/
│   ├── config/                # environment, constants, mappings
│   │   ├── index.ts
│   │   └── serviceCodeMap.json
│   │
│   ├── adapters/              # external-system interfaces
│   │   ├── routeGenie.ts      # pull reports via HTTP
│   │   ├── quickBooks.ts      # QBO API client (future)
│   │   └── payerPortal/       # puppeteer scripts for portal downloads/uploads
│   │       ├── login.ts
│   │       ├── downloadAuth.ts
│   │       └── uploadAuth.ts
│   │
│   ├── services/              # core business logic
│   │   ├── invoiceBuilder.ts  # aggregate trips → invoices
│   │   └── authFollowUp.ts    # email reminders to case managers
│   │
│   ├── utils/                 # CSV parsing, logging, error handling
│   │   ├── csv.ts             # parse/write CSV
│   │   ├── logger.ts
│   │   └── email.ts           # nodemailer wrapper
│   │
│   ├── commands/              # CLI entrypoints
│   │   ├── pullRouteGenie.ts  # “rg-pull <reportName>”
│   │   ├── buildInvoices.ts   # “build-invoices <csv>”
│   │   └── startUI.ts         # (future) launch web/electron UI
│   │
│   └── index.ts               # orchestrator for scripts/HTTP server
│
├── scripts/                   # prototype/testing scripts
│   └── sync-rg-to-qb.js       # minimal MVP script
│
├── mappings/                  # data files checked into Git
│   ├── “QB Service Codes – Worksheet.csv”
│   ├── “sample_invoice_import_ship_tax.csv”
│   └── …  
│
├── package.json
└── tsconfig.json

## Setup

1. `npm install`  
2. Create a `.env` with HOST, CLIENT_ID, CLIENT_SECRET  
3. `node auth.js` to fetch your token  

2. Recommended Packages & Tools
HTTP & APIs:
• axios for RouteGenie REST calls
• node-quickbooks (Intuit’s QBO SDK) or plain axios/oauth-1.0a for QBO

CSV Handling:
• fast-csv or csv-parse + csv-stringify
• csv-writer for generating QuickBooks-formatted CSV

Headless Browser:
• puppeteer for logging in, downloading/uploading auth data

CLI & Config:
• commander or yargs for command-line interface
• dotenv for environment variables (API keys, creds)

Email Follow-up:
• nodemailer (with a service like SendGrid)

Logging & Errors:
• winston or pino

(Future UI):
• express + React/Electron for a simple dashboard

