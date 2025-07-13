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
exports.getShortestDistance = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
if (!config_1.GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is required');
}
// Initialize Google Maps client
const googleMapsClient = new google_maps_services_js_1.Client({});
/**
 * Get the shortest distance between two addresses using Google Maps Directions API
 * This function prioritizes distance over time by using alternative routes and selecting the shortest one
 *
 * @param startAddress - Starting address as a string
 * @param endAddress - Ending address as a string
 * @returns Promise<RouteDistance> - Route information with distance in miles and formatted text
 */
function getShortestDistance(startAddress, endAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.Logger.info(`Calculating shortest distance from "${startAddress}" to "${endAddress}"`);
            const directionsRequest = {
                params: {
                    key: config_1.GOOGLE_MAPS_API_KEY,
                    origin: startAddress,
                    destination: endAddress,
                    mode: google_maps_services_js_1.TravelMode.driving,
                    alternatives: true,
                    optimize: false,
                    avoid: [], // Don't avoid any route types to get all options
                },
            };
            const response = yield googleMapsClient.directions(directionsRequest);
            if (!response.data.routes || response.data.routes.length === 0) {
                throw new Error(`No routes found between "${startAddress}" and "${endAddress}"`);
            }
            // Find the route with the shortest total distance
            let shortestRoute = response.data.routes[0];
            let shortestDistanceMeters = calculateTotalDistance(shortestRoute);
            for (const route of response.data.routes) {
                const routeDistanceMeters = calculateTotalDistance(route);
                if (routeDistanceMeters < shortestDistanceMeters) {
                    shortestDistanceMeters = routeDistanceMeters;
                    shortestRoute = route;
                }
            }
            // Convert meters to miles
            const shortestDistanceMiles = metersToMiles(shortestDistanceMeters);
            const result = {
                distanceMiles: shortestDistanceMiles,
                distanceText: formatDistance(shortestDistanceMiles),
                origin: shortestRoute.legs[0].start_address,
                destination: shortestRoute.legs[shortestRoute.legs.length - 1].end_address,
            };
            logger_1.Logger.info(`Shortest distance calculated: ${result.distanceText} (${result.distanceMiles} miles)`);
            return result;
        }
        catch (error) {
            logger_1.Logger.error('Error calculating shortest distance:', error);
            throw new Error(`Failed to calculate distance between addresses: ${error}`);
        }
    });
}
exports.getShortestDistance = getShortestDistance;
/**
 * Calculate total distance for a route by summing all leg distances
 *
 * @param route - Google Maps route object
 * @returns number - Total distance in meters
 */
function calculateTotalDistance(route) {
    return route.legs.reduce((total, leg) => {
        var _a;
        return total + (((_a = leg.distance) === null || _a === void 0 ? void 0 : _a.value) || 0);
    }, 0);
}
/**
 * Convert meters to miles
 *
 * @param meters - Distance in meters
 * @returns number - Distance in miles
 */
function metersToMiles(meters) {
    return meters * 0.000621371; // 1 meter = 0.000621371 miles
}
/**
 * Format distance in miles to a human-readable string
 *
 * @param distanceMiles - Distance in miles
 * @returns string - Formatted distance string
 */
function formatDistance(distanceMiles) {
    if (distanceMiles >= 1) {
        return `${distanceMiles.toFixed(2)} miles`;
    }
    else {
        // For distances less than 1 mile, show in feet
        const feet = distanceMiles * 5280;
        return `${Math.round(feet)} feet`;
    }
}
//# sourceMappingURL=googleMaps.js.map