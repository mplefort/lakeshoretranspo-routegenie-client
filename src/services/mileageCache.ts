import * as sqlite3 from 'sqlite3';
import path from 'path';
import { Logger } from '../utils/logger';
import { normalizeAddress, normalizeName, createCacheKey } from '../utils/addressNormalizer';
import { getShortestDistance } from '../adapters/googleMaps';
import { resolveFromExecutable } from '../utils/paths';

// Constants
const COMPANY_ADDRESS = "N5806 Co Rd M, Plymouth, WI 53073, USA";

// Interfaces
export interface MileageCacheEntry {
  id?: number;
  passenger_last_name: string;
  passenger_first_name: string;
  PU_address: string;
  DO_address: string;
  RG_miles: number;
  Google_miles: number;
  overwrite_miles?: number;
  RG_dead_miles: number;
  Google_dead_miles: number;
  overwrite_dead_miles?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CacheQueryParams {
  firstName: string;
  lastName: string;
  puAddress: string;
  doAddress: string;
}

export class MileageCache {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isInitialized: boolean = false;

  constructor() {
    this.dbPath = resolveFromExecutable('data', 'mileage_cache.db');
  }

  /**
   * Initialize the database connection and create tables if they don't exist
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!require('fs').existsSync(dataDir)) {
        require('fs').mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err: Error | null) => {
        if (err) {
          Logger.error('Failed to connect to mileage cache database:', err);
          reject(err);
          return;
        }

        Logger.info(`Connected to mileage cache database at ${this.dbPath}`);
        this.createTables()
          .then(() => {
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }

  /**
   * Create the mileage_cache table if it doesn't exist
   */
  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS mileage_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          passenger_last_name TEXT NOT NULL,
          passenger_first_name TEXT NOT NULL,
          PU_address TEXT NOT NULL,
          DO_address TEXT NOT NULL,
          RG_miles REAL NOT NULL,
          Google_miles REAL NOT NULL,
          overwrite_miles REAL,
          RG_dead_miles REAL NOT NULL,
          Google_dead_miles REAL NOT NULL,
          overwrite_dead_miles REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db!.run(createTableSQL, (err: Error | null) => {
        if (err) {
          Logger.error('Failed to create mileage_cache table:', err);
          reject(err);
          return;
        }

        // Create index for faster lookups
        const createIndexSQL = `
          CREATE INDEX IF NOT EXISTS idx_mileage_cache_lookup 
          ON mileage_cache(passenger_last_name, passenger_first_name, PU_address, DO_address)
        `;

        this.db!.run(createIndexSQL, (indexErr: Error | null) => {
          if (indexErr) {
            Logger.error('Failed to create index on mileage_cache table:', indexErr);
            reject(indexErr);
            return;
          }

          Logger.info('Mileage cache database tables created successfully');
          resolve();
        });
      });
    });
  }

  /**
   * Find an existing cache entry
   */
  async findCacheEntry(params: CacheQueryParams): Promise<MileageCacheEntry | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const normalizedFirst = normalizeName(params.firstName);
    const normalizedLast = normalizeName(params.lastName);
    const normalizedPU = normalizeAddress(params.puAddress);
    const normalizedDO = normalizeAddress(params.doAddress);

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM mileage_cache 
        WHERE passenger_last_name = ? 
        AND passenger_first_name = ? 
        AND PU_address = ? 
        AND DO_address = ?
      `;

      this.db!.get(sql, [normalizedLast, normalizedFirst, normalizedPU, normalizedDO], (err: Error | null, row: any) => {
        if (err) {
          Logger.error('Error querying mileage cache:', err);
          reject(err);
          return;
        }

        resolve(row as MileageCacheEntry || null);
      });
    });
  }

  /**
   * Create a new cache entry with Google Maps API calls
   */
  async createCacheEntry(
    params: CacheQueryParams,
    rgMiles: number,
    rgDeadMiles: number
  ): Promise<MileageCacheEntry> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const normalizedFirst = normalizeName(params.firstName);
    const normalizedLast = normalizeName(params.lastName);
    const normalizedPU = normalizeAddress(params.puAddress);
    const normalizedDO = normalizeAddress(params.doAddress);

    try {
      // Get Google Maps distances
      Logger.info(`Fetching Google Maps distance from ${normalizedPU} to ${normalizedDO}`);
      const puToDoRoute = await getShortestDistance(normalizedPU, normalizedDO);
      const googleMiles = puToDoRoute.distanceMiles;

      Logger.info(`Fetching Google Maps dead mile distance from ${COMPANY_ADDRESS} to ${normalizedPU}`);
      const deadMileRoute = await getShortestDistance(COMPANY_ADDRESS, normalizedPU);
      const googleDeadMiles = deadMileRoute.distanceMiles;

      // Insert into database
      const sql = `
        INSERT INTO mileage_cache (
          passenger_last_name, passenger_first_name, PU_address, DO_address,
          RG_miles, Google_miles, RG_dead_miles, Google_dead_miles
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        this.db!.run(
          sql,
          [normalizedLast, normalizedFirst, normalizedPU, normalizedDO, rgMiles, googleMiles, rgDeadMiles, googleDeadMiles],
          function(this: sqlite3.RunResult, err: Error | null) {
            if (err) {
              Logger.error('Error inserting into mileage cache:', err);
              reject(err);
              return;
            }

            const entry: MileageCacheEntry = {
              id: this.lastID,
              passenger_last_name: normalizedLast,
              passenger_first_name: normalizedFirst,
              PU_address: normalizedPU,
              DO_address: normalizedDO,
              RG_miles: rgMiles,
              Google_miles: googleMiles,
              RG_dead_miles: rgDeadMiles,
              Google_dead_miles: googleDeadMiles
            };

            Logger.success(`Created cache entry for ${normalizedFirst} ${normalizedLast}: ${googleMiles} miles, ${googleDeadMiles} dead miles`);
            resolve(entry);
          }
        );
      });

    } catch (error) {
      Logger.error('Error fetching Google Maps distances:', error);
      // Fallback: create entry with RG values as Google values
      Logger.warn('Falling back to Route Genie values for Google distances');
      
      const sql = `
        INSERT INTO mileage_cache (
          passenger_last_name, passenger_first_name, PU_address, DO_address,
          RG_miles, Google_miles, RG_dead_miles, Google_dead_miles
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        this.db!.run(
          sql,
          [normalizedLast, normalizedFirst, normalizedPU, normalizedDO, rgMiles, rgMiles, rgDeadMiles, rgDeadMiles],
          function(this: sqlite3.RunResult, err: Error | null) {
            if (err) {
              Logger.error('Error inserting fallback cache entry:', err);
              reject(err);
              return;
            }

            const entry: MileageCacheEntry = {
              id: this.lastID,
              passenger_last_name: normalizedLast,
              passenger_first_name: normalizedFirst,
              PU_address: normalizedPU,
              DO_address: normalizedDO,
              RG_miles: rgMiles,
              Google_miles: rgMiles,
              RG_dead_miles: rgDeadMiles,
              Google_dead_miles: rgDeadMiles
            };

            resolve(entry);
          }
        );
      });
    }
  }

  /**
   * Update an existing cache entry
   */
  async updateCacheEntry(id: number, updates: Partial<MileageCacheEntry>): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClause) return;

    const values = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => (updates as any)[key]);

    const sql = `UPDATE mileage_cache SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db!.run(sql, [...values, id], (err: Error | null) => {
        if (err) {
          Logger.error('Error updating mileage cache:', err);
          reject(err);
          return;
        }

        Logger.info(`Updated cache entry ${id}`);
        resolve();
      });
    });
  }

  /**
   * Get the appropriate mileage value from a cache entry
   * Priority: overwrite_miles > Google_miles > RG_miles
   */
  getCachedMileage(entry: MileageCacheEntry): number {
    if (entry.overwrite_miles !== undefined && entry.overwrite_miles !== null) {
      return entry.overwrite_miles;
    }
    if (entry.Google_miles !== undefined && entry.Google_miles !== null) {
      return entry.Google_miles;
    }
    return entry.RG_miles;
  }

  /**
   * Get the appropriate dead mileage value from a cache entry
   * Priority: overwrite_dead_miles > Google_dead_miles > RG_dead_miles
   */
  getCachedDeadMileage(entry: MileageCacheEntry): number {
    if (entry.overwrite_dead_miles !== undefined && entry.overwrite_dead_miles !== null) {
      return entry.overwrite_dead_miles;
    }
    if (entry.Google_dead_miles !== undefined && entry.Google_dead_miles !== null) {
      return entry.Google_dead_miles;
    }
    return entry.RG_dead_miles;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err: Error | null) => {
          if (err) {
            Logger.error('Error closing mileage cache database:', err);
            reject(err);
            return;
          }

          Logger.info('Mileage cache database connection closed');
          this.isInitialized = false;
          resolve();
        });
      });
    }
  }
}

// Export singleton instance
export const mileageCache = new MileageCache();
