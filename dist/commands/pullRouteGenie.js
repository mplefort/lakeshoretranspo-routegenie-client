#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routeGenie_1 = require("../adapters/routeGenie");
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// example usage: node pullRouteGenie.js 01/01/2025 01/31/2025
const [, , periodFrom, periodTo] = process.argv;
if (!periodFrom || !periodTo) {
    console.error('Usage: pullRouteGenie <MM/DD/YYYY> <MM/DD/YYYY>');
    process.exit(1);
}
const outDir = path_1.default.resolve(process.cwd(), 'reports', 'billing');
(0, routeGenie_1.generateBillingReport)(periodFrom, periodTo, outDir)
    .catch(err => {
    console.error('Fatal:', err.message || err);
    process.exit(1);
});
