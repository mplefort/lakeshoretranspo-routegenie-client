import { Client, DirectionsRequest, DirectionsResponse, TravelMode } from '@googlemaps/google-maps-services-js';
import { Logger } from '../utils/logger';
import { GOOGLE_MAPS_API_KEY } from '../config';

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('GOOGLE_MAPS_API_KEY environment variable is required');
}

// Initialize Google Maps client
const googleMapsClient = new Client({});

// Interface for route calculation result
export interface RouteDistance {
  distanceMiles: number;
  distanceText: string;
  origin: string;
  destination: string;
}



/**
 * Get the shortest distance between two addresses using Google Maps Directions API
 * This function prioritizes distance over time by using alternative routes and selecting the shortest one
 * 
 * @param startAddress - Starting address as a string
 * @param endAddress - Ending address as a string
 * @returns Promise<RouteDistance> - Route information with distance in miles and formatted text
 */
export async function getShortestDistance(
  startAddress: string, 
  endAddress: string
): Promise<RouteDistance> {
  try {
    Logger.info(`Calculating shortest distance from "${startAddress}" to "${endAddress}"`);

    const directionsRequest: DirectionsRequest = {
      params: {
        key: GOOGLE_MAPS_API_KEY!,
        origin: startAddress,
        destination: endAddress,
        mode: TravelMode.driving,
        alternatives: true, // Request alternative routes to find the shortest distance
        optimize: false, // Don't optimize for time, we want distance
        avoid: [], // Don't avoid any route types to get all options
      },
    };

    const response: DirectionsResponse = await googleMapsClient.directions(directionsRequest);

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

    const result: RouteDistance = {
      distanceMiles: shortestDistanceMiles,
      distanceText: formatDistance(shortestDistanceMiles),
      origin: shortestRoute.legs[0].start_address,
      destination: shortestRoute.legs[shortestRoute.legs.length - 1].end_address,
    };

    Logger.info(`Shortest distance calculated: ${result.distanceText} (${result.distanceMiles} miles)`);
    return result;

  } catch (error) {
    Logger.error('Error calculating shortest distance:', error);
    throw new Error(`Failed to calculate distance between addresses: ${error}`);
  }
}

/**
 * Calculate total distance for a route by summing all leg distances
 * 
 * @param route - Google Maps route object
 * @returns number - Total distance in meters
 */
function calculateTotalDistance(route: any): number {
  return route.legs.reduce((total: number, leg: any) => {
    return total + (leg.distance?.value || 0);
  }, 0);
}

/**
 * Convert meters to miles
 * 
 * @param meters - Distance in meters
 * @returns number - Distance in miles
 */
function metersToMiles(meters: number): number {
  return meters * 0.000621371; // 1 meter = 0.000621371 miles
}

/**
 * Format distance in miles to a human-readable string
 * 
 * @param distanceMiles - Distance in miles
 * @returns string - Formatted distance string
 */
function formatDistance(distanceMiles: number): string {
  if (distanceMiles >= 1) {
    return `${distanceMiles.toFixed(2)} miles`;
  } else {
    // For distances less than 1 mile, show in feet
    const feet = distanceMiles * 5280;
    return `${Math.round(feet)} feet`;
  }
}