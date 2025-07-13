#!/usr/bin/env node
"use strict";
/**
 * Script to check the mileage cache database contents
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mileageCache_1 = require("../services/mileageCache");
function checkCacheContents() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mileageCache_1.mileageCache.initialize();
            // Query the database manually using the SQLite connection
            const db = mileageCache_1.mileageCache.db;
            yield new Promise((resolve, reject) => {
                db.all("SELECT * FROM mileage_cache ORDER BY id LIMIT 10", [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('Mileage Cache Contents:');
                    console.log('========================');
                    rows.forEach((row, index) => {
                        console.log(`${index + 1}. ${row.passenger_first_name} ${row.passenger_last_name}`);
                        console.log(`   PU: ${row.PU_address}`);
                        console.log(`   DO: ${row.DO_address}`);
                        console.log(`   RG Miles: ${row.RG_miles}, Google Miles: ${row.Google_miles}`);
                        console.log(`   RG Dead Miles: ${row.RG_dead_miles}, Google Dead Miles: ${row.Google_dead_miles}`);
                        console.log(`   Overwrite Miles: ${row.overwrite_miles || 'None'}, Overwrite Dead Miles: ${row.overwrite_dead_miles || 'None'}`);
                        console.log('---');
                    });
                    resolve();
                });
            });
            yield mileageCache_1.mileageCache.close();
        }
        catch (error) {
            console.error('Error checking cache contents:', error);
            process.exit(1);
        }
    });
}
checkCacheContents();
//# sourceMappingURL=checkCacheContents.js.map