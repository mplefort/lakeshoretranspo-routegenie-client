#!/usr/bin/env node
"use strict";
/**
 * Test script for mileage cache functionality
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
function testMileageCache() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Testing mileage cache initialization...');
            // Initialize the cache
            yield mileageCache_1.mileageCache.initialize();
            console.log('✅ Cache initialized successfully');
            // Test creating a cache entry
            const testParams = {
                firstName: 'JOHN',
                lastName: 'DOE',
                puAddress: '123 Test St, Plymouth, WI 53073, USA',
                doAddress: '456 Main Ave, Sheboygan, WI 53081, USA'
            };
            console.log('Testing cache lookup (should be empty)...');
            const existingEntry = yield mileageCache_1.mileageCache.findCacheEntry(testParams);
            console.log('Existing entry:', existingEntry);
            if (!existingEntry) {
                console.log('Creating new cache entry with test data...');
                const newEntry = yield mileageCache_1.mileageCache.createCacheEntry(testParams, 5.0, 2.0);
                console.log('✅ Created entry:', newEntry);
                // Test getting values
                const mileage = mileageCache_1.mileageCache.getCachedMileage(newEntry);
                const deadMileage = mileageCache_1.mileageCache.getCachedDeadMileage(newEntry);
                console.log(`✅ Cached mileage: ${mileage}, Dead mileage: ${deadMileage}`);
            }
            // Close the cache
            yield mileageCache_1.mileageCache.close();
            console.log('✅ Cache closed successfully');
        }
        catch (error) {
            console.error('❌ Error testing mileage cache:', error);
            process.exit(1);
        }
    });
}
// Run the test
testMileageCache();
//# sourceMappingURL=testMileageCache.js.map