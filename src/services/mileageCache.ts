import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Storage } from '@google-cloud/storage';
import { Logger } from '../utils/logger';
import { normalizeAddress, normalizeName } from '../utils/addressNormalizer';
import { getShortestDistance } from '../adapters/googleMaps';

// Constants
const COMPANY_ADDRESS = "N5806 Co Rd M, Plymouth, WI 53073, USA";
const GCS_BUCKET_NAME = "lakeshore-mileage-cache-db";
const GCS_DB_FILENAME = "mileage_cache.db";
const GCS_METADATA_FILENAME = "mileage_cache_metadata.json";

/**
 * Get the user data directory path for storing persistent data
 */
function getUserDataPath(): string {
  try {
    // Try to get Electron's user data path
    const { app } = require('electron');
    if (app && app.getPath) {
      return app.getPath('userData');
    }
  } catch (error) {
    // Electron not available, fallback to OS-specific user data directories
  }

  // Fallback to OS-specific user data directories
  const appName = 'lakeshore-invoicer';
  
  switch (process.platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', appName);
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appName);
    case 'linux':
      return path.join(os.homedir(), '.config', appName);
    default:
      return path.join(os.homedir(), `.${appName}`);
  }
}

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

export interface DatabaseMetadata {
  version: number;
  lastSync: string;
  lastModified: string;
  fileSize: number;
}

export class MileageCache {
  private db: Database.Database | null = null;
  private dbPath: string;
  private metadataPath: string;
  private isInitialized = false;
  private storage: Storage | null = null;
  private bucket: any = null;

  constructor() {
    // Use user data directory for persistent storage across app updates
    const userDataPath = getUserDataPath();
    const dataDir = path.join(userDataPath, 'data');
    this.dbPath = path.join(dataDir, 'mileage_cache.db');
    this.metadataPath = path.join(dataDir, 'mileage_cache_metadata.json');
    
    // Initialize Google Cloud Storage
    this.initializeGCS();
  }

  /**
   * Initialize Google Cloud Storage client
   */
  private initializeGCS(): void {
    try {
      const keyPath = process.env.GOOGLE_CLOUD_STORAGE_KEY;
      if (!keyPath) {
        Logger.warn('GOOGLE_CLOUD_STORAGE_KEY environment variable not set');
        return;
      }

      // Check if key file exists
      if (!fs.existsSync(keyPath)) {
        Logger.warn(`Google Cloud Storage key file not found: ${keyPath}`);
        return;
      }

      this.storage = new Storage({
        keyFilename: keyPath,
      });

      this.bucket = this.storage.bucket(GCS_BUCKET_NAME);
      Logger.info('Google Cloud Storage client initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize Google Cloud Storage client:', error);
    }
  }

  /**
   * Download database from Google Cloud Storage
   */
  private async downloadDatabaseFromCloud(): Promise<boolean> {
    if (!this.storage || !this.bucket) {
      Logger.warn('Google Cloud Storage not initialized, skipping download');
      return false;
    }

    try {
      const file = this.bucket.file(GCS_DB_FILENAME);
      const metadataFile = this.bucket.file(GCS_METADATA_FILENAME);

      // Check if files exist
      const [fileExists] = await file.exists();
      const [metadataExists] = await metadataFile.exists();

      if (!fileExists) {
        Logger.info('No remote database found, will create new local database');
        return true; // Not an error, just no remote DB yet
      }

      Logger.info('Downloading database from Google Cloud Storage...');

      // Download database file
      await file.download({ destination: this.dbPath });
      Logger.info(`Database downloaded to: ${this.dbPath}`);

      // Download metadata if it exists
      if (metadataExists) {
        await metadataFile.download({ destination: this.metadataPath });
        Logger.info(`Metadata downloaded to: ${this.metadataPath}`);
      }

      return true;
    } catch (error) {
      Logger.error('Failed to download database from cloud:', error);
      return false;
    }
  }

  /**
   * Upload database to Google Cloud Storage
   */
  private async uploadDatabaseToCloud(): Promise<boolean> {
    if (!this.storage || !this.bucket) {
      Logger.warn('Google Cloud Storage not initialized, skipping upload');
      return false;
    }

    try {
      // Close database connection temporarily for upload
      if (this.db) {
        this.db.close();
      }

      // Create/update metadata
      const metadata = await this.createMetadata();
      fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));

      Logger.info('Uploading database to Google Cloud Storage...');

      // Upload database file
      const dbFile = this.bucket.file(GCS_DB_FILENAME);
      await dbFile.save(fs.readFileSync(this.dbPath));

      // Upload metadata
      const metadataFile = this.bucket.file(GCS_METADATA_FILENAME);
      await metadataFile.save(fs.readFileSync(this.metadataPath));

      Logger.info('Database uploaded to Google Cloud Storage successfully');

      // Reconnect to database
      this.db = new Database(this.dbPath);

      return true;
    } catch (error) {
      Logger.error('Failed to upload database to cloud:', error);
      // Reconnect to database even if upload failed
      try {
        this.db = new Database(this.dbPath);
      } catch (dbError) {
        Logger.error('Failed to reconnect to database after upload failure:', dbError);
      }
      return false;
    }
  }

  /**
   * Create metadata for the database
   */
  private async createMetadata(): Promise<DatabaseMetadata> {
    const stats = fs.statSync(this.dbPath);
    let version = 1;

    // Try to read existing metadata to increment version
    try {
      if (fs.existsSync(this.metadataPath)) {
        const existingMetadata = JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
        version = (existingMetadata.version || 0) + 1;
      }
    } catch (error) {
      Logger.warn('Could not read existing metadata, starting with version 1');
    }

    return {
      version,
      lastSync: new Date().toISOString(),
      lastModified: stats.mtime.toISOString(),
      fileSize: stats.size
    };
  }

  /**
   * Show user prompt for retry or continue
   */
  private async showRetryPrompt(message: string, action: string): Promise<boolean> {
    // In an Electron app, you'd typically use dialog.showMessageBox
    // For now, we'll use console and return true to continue
    Logger.warn(`${message} - ${action}`);
    
    // TODO: Implement actual user dialog when in Electron context
    // Example implementation for Electron:
    /*
    try {
      const { dialog } = require('electron');
      const response = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Retry', 'Continue'],
        defaultId: 0,
        message: message,
        detail: action
      });
      return response.response === 0; // 0 = Retry, 1 = Continue
    } catch (error) {
      // Fallback if not in Electron context
      return true;
    }
    */
    
    // For now, return true to continue (can be customized based on needs)
    return true;
  }

  /**
   * Get current database metadata
   */
  async getDatabaseMetadata(): Promise<DatabaseMetadata | null> {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
        return metadata;
      }
    } catch (error) {
      Logger.error('Error reading database metadata:', error);
    }
    return null;
  }

  /**
   * Initialize the database connection and create tables if they don't exist
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        Logger.info(`Created data directory: ${dataDir}`);
      }

      // Try to download latest database from cloud
      let downloadSuccess = false;
      try {
        downloadSuccess = await this.downloadDatabaseFromCloud();
      } catch (error) {
        Logger.error('Error during cloud download:', error);
      }

      // If download failed, show retry prompt
      if (!downloadSuccess && this.storage && this.bucket) {
        const shouldRetry = await this.showRetryPrompt(
          'Unable to pull database from cloud. Please check your internet connection.',
          'Would you like to retry download or continue with local database only?'
        );

        if (shouldRetry) {
          try {
            downloadSuccess = await this.downloadDatabaseFromCloud();
          } catch (retryError) {
            Logger.error('Retry download failed:', retryError);
            Logger.warn('Continuing with local database only');
          }
        }
      }

      // Connect to local database (either downloaded or existing)
      this.db = new Database(this.dbPath);
      Logger.info(`Connected to mileage cache database at ${this.dbPath}`);
      
      this.createTables();
      this.isInitialized = true;

      if (downloadSuccess) {
        Logger.success('Database synchronized from cloud successfully');
      } else if (this.storage && this.bucket) {
        Logger.warn('Running with local database only - cloud sync unavailable');
      }

    } catch (err) {
      Logger.error('Failed to connect to mileage cache database:', err);
      throw err;
    }
  }

  /**
   * Create the mileage_cache table if it doesn't exist
   */
  private createTables(): void {
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

    this.db!.exec(createTableSQL);

    // Create index for faster lookups
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_mileage_cache_lookup 
      ON mileage_cache(passenger_last_name, passenger_first_name, PU_address, DO_address)
    `;

    this.db!.exec(createIndexSQL);

    Logger.info('Mileage cache database tables created successfully');
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

    try {
      const sql = `
        SELECT * FROM mileage_cache 
        WHERE passenger_last_name = ? 
        AND passenger_first_name = ? 
        AND PU_address = ? 
        AND DO_address = ?
      `;

      const stmt = this.db!.prepare(sql);
      const row = stmt.get(normalizedLast, normalizedFirst, normalizedPU, normalizedDO) as MileageCacheEntry | undefined;
      
      return row || null;
    } catch (err) {
      Logger.error('Error querying mileage cache:', err);
      throw err;
    }
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

      const stmt = this.db!.prepare(sql);
      const result = stmt.run(normalizedLast, normalizedFirst, normalizedPU, normalizedDO, rgMiles, googleMiles, rgDeadMiles, googleDeadMiles);

      const entry: MileageCacheEntry = {
        id: result.lastInsertRowid as number,
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
      return entry;

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

      const stmt = this.db!.prepare(sql);
      const result = stmt.run(normalizedLast, normalizedFirst, normalizedPU, normalizedDO, rgMiles, rgMiles, rgDeadMiles, rgDeadMiles);

      const entry: MileageCacheEntry = {
        id: result.lastInsertRowid as number,
        passenger_last_name: normalizedLast,
        passenger_first_name: normalizedFirst,
        PU_address: normalizedPU,
        DO_address: normalizedDO,
        RG_miles: rgMiles,
        Google_miles: rgMiles,
        RG_dead_miles: rgDeadMiles,
        Google_dead_miles: rgDeadMiles
      };

      return entry;
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

    try {
      const stmt = this.db!.prepare(sql);
      stmt.run(...values, id);
      Logger.info(`Updated cache entry ${id}`);
    } catch (err) {
      Logger.error('Error updating mileage cache:', err);
      throw err;
    }
  }

  /**
   * Get the appropriate mileage value from a cache entry
   * Priority: overwrite_miles > Google_miles > RG_miles
   */
  getCachedMileage(entry: MileageCacheEntry): number {
    if (entry.overwrite_miles !== undefined && entry.overwrite_miles !== null) {
      return Math.round(entry.overwrite_miles);
    }
    if (entry.Google_miles !== undefined && entry.Google_miles !== null) {
      return Math.round(entry.Google_miles);
    }
    return Math.round(entry.RG_miles);
  }

  /**
   * Get the appropriate dead mileage value from a cache entry
   * Priority: overwrite_dead_miles > Google_dead_miles > RG_dead_miles
   */
  getCachedDeadMileage(entry: MileageCacheEntry): number {
    if (entry.overwrite_dead_miles !== undefined && entry.overwrite_dead_miles !== null) {
      return Math.round(entry.overwrite_dead_miles);
    }
    if (entry.Google_dead_miles !== undefined && entry.Google_dead_miles !== null) {
      return Math.round(entry.Google_dead_miles);
    }
    return Math.round(entry.RG_dead_miles);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        // Try to upload database to cloud before closing
        let uploadSuccess = false;
        if (this.storage && this.bucket) {
          try {
            uploadSuccess = await this.uploadDatabaseToCloud();
          } catch (error) {
            Logger.error('Error during cloud upload:', error);
          }

          // If upload failed, show retry prompt
          if (!uploadSuccess) {
            const shouldRetry = await this.showRetryPrompt(
              'Unable to push database to cloud. Changes may be lost.',
              'Would you like to retry upload or continue closing without saving to cloud?'
            );

            if (shouldRetry) {
              try {
                uploadSuccess = await this.uploadDatabaseToCloud();
              } catch (retryError) {
                Logger.error('Retry upload failed:', retryError);
                Logger.warn('Closing without cloud backup');
              }
            }
          }
        }

        // Close database connection (if not already closed by upload process)
        if (this.db) {
          this.db.close();
        }
        
        this.isInitialized = false;
        
        if (uploadSuccess) {
          Logger.success('Database backed up to cloud and connection closed');
        } else if (this.storage && this.bucket) {
          Logger.warn('Database connection closed - cloud backup failed');
        } else {
          Logger.info('Mileage cache database connection closed');
        }

      } catch (err) {
        Logger.error('Error closing mileage cache database:', err);
        throw err;
      }
    }
  }
}

// Export singleton instance - lazy loaded
let _mileageCache: MileageCache | null = null;

export function getMileageCache(): MileageCache {
  if (!_mileageCache) {
    _mileageCache = new MileageCache();
  }
  return _mileageCache;
}

// For backward compatibility
export const mileageCache = {
  get instance() {
    return getMileageCache();
  },
  initialize: () => getMileageCache().initialize(),
  close: () => getMileageCache().close(),
  findCacheEntry: (params: CacheQueryParams) => getMileageCache().findCacheEntry(params),
  createCacheEntry: (params: CacheQueryParams, rgMiles: number, rgDeadMiles: number) => 
    getMileageCache().createCacheEntry(params, rgMiles, rgDeadMiles),
  getCachedMileage: (entry: MileageCacheEntry) => getMileageCache().getCachedMileage(entry),
  getCachedDeadMileage: (entry: MileageCacheEntry) => getMileageCache().getCachedDeadMileage(entry),
  getDatabaseMetadata: () => getMileageCache().getDatabaseMetadata(),
};
