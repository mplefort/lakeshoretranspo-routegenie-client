/**
 * Test script to verify the database path and initialization
 */
import { getMileageCache } from '../services/mileageCache';
import { Logger } from '../utils/logger';

async function testDatabasePath() {
  try {
    const cache = getMileageCache();
    
    // Log the database path before initialization
    console.log('Database path:', (cache as any).dbPath);
    
    // Initialize the cache
    await cache.initialize();
    
    Logger.success('Database initialized successfully');
    
    // Close the cache
    await cache.close();
    
    Logger.success('Database closed successfully');
  } catch (error) {
    Logger.error('Error testing database path:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDatabasePath();
}

export { testDatabasePath };
