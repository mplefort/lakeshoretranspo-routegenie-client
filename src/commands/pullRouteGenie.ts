#!/usr/bin/env node
import { generateBillingReport } from '../adapters/routeGenie';
import path from 'path';
import { config } from 'dotenv';
config();

// example usage: node pullRouteGenie.js 01/01/2025 01/31/2025
const [,, periodFrom, periodTo] = process.argv;
if (!periodFrom || !periodTo) {
  console.error('Usage: pullRouteGenie <MM/DD/YYYY> <MM/DD/YYYY>');
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), 'reports', 'billing');

generateBillingReport(periodFrom, periodTo, outDir)
  .catch(err => {
    console.error('Fatal:', err.message || err);
    process.exit(1);
  });
