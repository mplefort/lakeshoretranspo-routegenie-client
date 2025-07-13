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
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabasePath = void 0;
/**
 * Test script to verify the database path and initialization
 */
const mileageCache_1 = require("../services/mileageCache");
const logger_1 = require("../utils/logger");
function testDatabasePath() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cache = (0, mileageCache_1.getMileageCache)();
            // Log the database path before initialization
            console.log('Database path:', cache.dbPath);
            // Initialize the cache
            yield cache.initialize();
            logger_1.Logger.success('Database initialized successfully');
            // Close the cache
            yield cache.close();
            logger_1.Logger.success('Database closed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error testing database path:', error);
        }
    });
}
exports.testDatabasePath = testDatabasePath;
// Run the test if this script is executed directly
if (require.main === module) {
    testDatabasePath();
}
//# sourceMappingURL=testDatabasePath.js.map