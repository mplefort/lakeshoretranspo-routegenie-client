import { getShortestDistance } from '../adapters/googleMaps';

/**
 * Example usage of the Google Maps adapter
 * 
 * Before running this example, make sure to:
 * 1. Set up your GOOGLE_MAPS_API_KEY in the .env file
 * 2. Enable the Directions API in Google Cloud Console
 */
async function demonstrateGoogleMapsAdapter() {
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
    const shortestDistance = await getShortestDistance(startAddress, endAddress);
    console.log(`Shortest distance: ${shortestDistance.distanceText}`);
    console.log(`Distance in miles: ${shortestDistance.distanceMiles}`);
    console.log(`Formatted origin: ${shortestDistance.origin}`);
    console.log(`Formatted destination: ${shortestDistance.destination}\n`);

    console.log('✅ Google Maps adapter demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error demonstrating Google Maps adapter:', error);
    console.error('\nMake sure you have:');
    console.error('1. Set GOOGLE_MAPS_API_KEY in your .env file');
    console.error('2. Enabled Directions API in Google Cloud Console');
    console.error('3. Have sufficient API quota/billing set up');
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  demonstrateGoogleMapsAdapter();
}

export { demonstrateGoogleMapsAdapter };
