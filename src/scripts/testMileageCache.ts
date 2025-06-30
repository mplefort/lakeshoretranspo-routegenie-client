#!/usr/bin/env node

/**
 * Test script for mileage cache functionality
 */

import { mileageCache } from '../services/mileageCache';
import { Logger } from '../utils/logger';

async function testMileageCache() {
  try {
    console.log('Testing mileage cache initialization...');
    
    // Initialize the cache
    await mileageCache.initialize();
    console.log('✅ Cache initialized successfully');

    // Test creating a cache entry
    const testParams = {
      firstName: 'JOHN',
      lastName: 'DOE',
      puAddress: '123 Test St, Plymouth, WI 53073, USA',
      doAddress: '456 Main Ave, Sheboygan, WI 53081, USA'
    };

    console.log('Testing cache lookup (should be empty)...');
    const existingEntry = await mileageCache.findCacheEntry(testParams);
    console.log('Existing entry:', existingEntry);

    if (!existingEntry) {
      console.log('Creating new cache entry with test data...');
      const newEntry = await mileageCache.createCacheEntry(testParams, 5.0, 2.0);
      console.log('✅ Created entry:', newEntry);

      // Test getting values
      const mileage = mileageCache.getCachedMileage(newEntry);
      const deadMileage = mileageCache.getCachedDeadMileage(newEntry);
      console.log(`✅ Cached mileage: ${mileage}, Dead mileage: ${deadMileage}`);
    }

    // Close the cache
    await mileageCache.close();
    console.log('✅ Cache closed successfully');

  } catch (error) {
    console.error('❌ Error testing mileage cache:', error);
    process.exit(1);
  }
}

// Run the test
testMileageCache();
