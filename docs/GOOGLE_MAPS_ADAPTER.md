# Google Maps API Adapter

This adapter provides integration with Google Maps APIs to calculate distances and routes between addresses. It's specifically designed to find the **shortest distance** (not fastest time) between two points.

## Features

- ✅ Calculate shortest distance between two addresses
- ✅ Comprehensive error handling and logging
- ✅ TypeScript interfaces for type safety

## Setup

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following API:
   - **Directions API** (for route calculation)
4. Create an API key:
   - Go to "Credentials" > "Create Credentials" > "API Key"
   - Optionally restrict the key to your specific APIs and IP addresses

### 2. Environment Configuration

Add your Google Maps API key to your `.env` file:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Dependencies

The required dependencies are already installed:
- `@googlemaps/google-maps-services-js` - Official Google Maps client library

## Usage

### Get Shortest Distance

```typescript
import { getShortestDistance } from './src/adapters/googleMaps';

async function example() {
  const result = await getShortestDistance(
    '1600 Amphitheatre Parkway, Mountain View, CA',
    '1 Hacker Way, Menlo Park, CA'
  );
  
  console.log(`Distance: ${result.distanceText}`);
  console.log(`Miles: ${result.distanceMiles}`);
}
```

## API Reference

### Types

```typescript
interface RouteDistance {
  distanceMiles: number;       // Distance in miles
  distanceText: string;        // Human-readable distance (e.g., "15.2 miles")
  origin: string;              // Formatted origin address
  destination: string;         // Formatted destination address
}
```

### Functions

#### `getShortestDistance(startAddress: string, endAddress: string): Promise<RouteDistance>`

Calculates the shortest driving distance between two addresses by requesting alternative routes and selecting the one with the minimum total distance.

## Example Usage

Run the example to see the adapter in action:

```bash
npm run build
ts-node src/examples/googleMapsExample.ts
```

## Error Handling

The adapter includes comprehensive error handling:

- Validates API key presence
- Handles network failures
- Manages rate limiting
- Provides clear error messages

All errors are logged using the project's logging utility.

## API Costs

Be aware of Google Maps API pricing:
- **Directions API**: $5 per 1,000 requests

Consider implementing caching for repeated requests to reduce costs.

## Integration with Billing Workflow

This adapter is designed to integrate with the lakeshoretransp billing workflow to:

1. Calculate accurate distances for route billing
2. Validate addresses before processing
3. Provide distance-based pricing calculations
4. Generate accurate mileage reports

The focus on **shortest distance** rather than fastest time ensures accurate billing calculations based on actual route mileage.
