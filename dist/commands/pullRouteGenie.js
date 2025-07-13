#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routeGenie_1 = require("../adapters/routeGenie");
const dotenv_1 = require("dotenv");
const paths_1 = require("../utils/paths");
(0, dotenv_1.config)();
// example usage: node pullRouteGenie.js 01/01/2025 01/31/2025
const [, , periodFrom, periodTo] = process.argv;
if (!periodFrom || !periodTo) {
    console.error('Usage: pullRouteGenie <MM/DD/YYYY> <MM/DD/YYYY>');
    process.exit(1);
}
const outDir = (0, paths_1.resolveFromExecutable)('reports', 'billing');
(0, routeGenie_1.generateBillingReport)(periodFrom, periodTo, outDir)
    .catch(err => {
    console.error('Fatal:', err.message || err);
    process.exit(1);
});
//# sourceMappingURL=pullRouteGenie.js.map