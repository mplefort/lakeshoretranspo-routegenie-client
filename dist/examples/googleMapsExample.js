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
exports.demonstrateGoogleMapsAdapter = void 0;
const googleMaps_1 = require("../adapters/googleMaps");
/**
 * Example usage of the Google Maps adapter
 *
 * Before running this example, make sure to:
 * 1. Set up your GOOGLE_MAPS_API_KEY in the .env file
 * 2. Enable the Directions API in Google Cloud Console
 */
function demonstrateGoogleMapsAdapter() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Google Maps Adapter Example');
            console.log('================================\n');
            // Example addresses (you can change these)
            const startAddress = '13111 N Port Washington Ln, Mequon, WI 53092, USA';
            const endAddress = '605 South St, Plymouth, WI 53073, USA';
            console.log(`From: ${startAddress}`);
            console.log(`To: ${endAddress}\n`);
            // Get the shortest distance between two addresses
            console.log('📏 Finding shortest distance...');
            const shortestDistance = yield (0, googleMaps_1.getShortestDistance)(startAddress, endAddress);
            console.log(`Shortest distance: ${shortestDistance.distanceText}`);
            console.log(`Distance in miles: ${shortestDistance.distanceMiles}`);
            console.log(`Formatted origin: ${shortestDistance.origin}`);
            console.log(`Formatted destination: ${shortestDistance.destination}\n`);
            console.log('✅ Google Maps adapter demonstration completed successfully!');
        }
        catch (error) {
            console.error('❌ Error demonstrating Google Maps adapter:', error);
            console.error('\nMake sure you have:');
            console.error('1. Set GOOGLE_MAPS_API_KEY in your .env file');
            console.error('2. Enabled Directions API in Google Cloud Console');
            console.error('3. Have sufficient API quota/billing set up');
        }
    });
}
exports.demonstrateGoogleMapsAdapter = demonstrateGoogleMapsAdapter;
// Run the example if this file is executed directly
if (require.main === module) {
    demonstrateGoogleMapsAdapter();
}
//# sourceMappingURL=googleMapsExample.js.map