#!/usr/bin/env node

/**
 * Script to check the mileage cache database contents
 */

import { mileageCache } from '../services/mileageCache';

async function checkCacheContents() {
  try {
    await mileageCache.initialize();
    
    // Query the database manually using the SQLite connection
    const db = (mileageCache as any).db;
    
    await new Promise<void>((resolve, reject) => {
      db.all("SELECT * FROM mileage_cache ORDER BY id LIMIT 10", [], (err: any, rows: any[]) => {
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
    
    await mileageCache.close();
    
  } catch (error) {
    console.error('Error checking cache contents:', error);
    process.exit(1);
  }
}

checkCacheContents();
