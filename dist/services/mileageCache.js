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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mileageCache = exports.getMileageCache = exports.MileageCache = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const addressNormalizer_1 = require("../utils/addressNormalizer");
const googleMaps_1 = require("../adapters/googleMaps");
// Constants
const COMPANY_ADDRESS = "N5806 Co Rd M, Plymouth, WI 53073, USA";
/**
 * Get the user data directory path for storing persistent data
 */
function getUserDataPath() {
    try {
        // Try to get Electron's user data path
        const { app } = require('electron');
        if (app && app.getPath) {
            return app.getPath('userData');
        }
    }
    catch (error) {
        // Electron not available, fallback to OS-specific user data directories
    }
    // Fallback to OS-specific user data directories
    const appName = 'lakeshore-invoicer';
    switch (process.platform) {
        case 'win32':
            return path_1.default.join(os_1.default.homedir(), 'AppData', 'Roaming', appName);
        case 'darwin':
            return path_1.default.join(os_1.default.homedir(), 'Library', 'Application Support', appName);
        case 'linux':
            return path_1.default.join(os_1.default.homedir(), '.config', appName);
        default:
            return path_1.default.join(os_1.default.homedir(), `.${appName}`);
    }
}
class MileageCache {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        // Use user data directory for persistent storage across app updates
        const userDataPath = getUserDataPath();
        const dataDir = path_1.default.join(userDataPath, 'data');
        this.dbPath = path_1.default.join(dataDir, 'mileage_cache.db');
    }
    /**
     * Initialize the database connection and create tables if they don't exist
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized)
                return;
            try {
                // Ensure data directory exists
                const dataDir = path_1.default.dirname(this.dbPath);
                if (!fs_1.default.existsSync(dataDir)) {
                    fs_1.default.mkdirSync(dataDir, { recursive: true });
                    logger_1.Logger.info(`Created data directory: ${dataDir}`);
                }
                this.db = new better_sqlite3_1.default(this.dbPath);
                logger_1.Logger.info(`Connected to mileage cache database at ${this.dbPath}`);
                this.createTables();
                this.isInitialized = true;
            }
            catch (err) {
                logger_1.Logger.error('Failed to connect to mileage cache database:', err);
                throw err;
            }
        });
    }
    /**
     * Create the mileage_cache table if it doesn't exist
     */
    createTables() {
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
        this.db.exec(createTableSQL);
        // Create index for faster lookups
        const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_mileage_cache_lookup 
      ON mileage_cache(passenger_last_name, passenger_first_name, PU_address, DO_address)
    `;
        this.db.exec(createIndexSQL);
        logger_1.Logger.info('Mileage cache database tables created successfully');
    }
    /**
     * Find an existing cache entry
     */
    findCacheEntry(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isInitialized) {
                yield this.initialize();
            }
            const normalizedFirst = (0, addressNormalizer_1.normalizeName)(params.firstName);
            const normalizedLast = (0, addressNormalizer_1.normalizeName)(params.lastName);
            const normalizedPU = (0, addressNormalizer_1.normalizeAddress)(params.puAddress);
            const normalizedDO = (0, addressNormalizer_1.normalizeAddress)(params.doAddress);
            try {
                const sql = `
        SELECT * FROM mileage_cache 
        WHERE passenger_last_name = ? 
        AND passenger_first_name = ? 
        AND PU_address = ? 
        AND DO_address = ?
      `;
                const stmt = this.db.prepare(sql);
                const row = stmt.get(normalizedLast, normalizedFirst, normalizedPU, normalizedDO);
                return row || null;
            }
            catch (err) {
                logger_1.Logger.error('Error querying mileage cache:', err);
                throw err;
            }
        });
    }
    /**
     * Create a new cache entry with Google Maps API calls
     */
    createCacheEntry(params, rgMiles, rgDeadMiles) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isInitialized) {
                yield this.initialize();
            }
            const normalizedFirst = (0, addressNormalizer_1.normalizeName)(params.firstName);
            const normalizedLast = (0, addressNormalizer_1.normalizeName)(params.lastName);
            const normalizedPU = (0, addressNormalizer_1.normalizeAddress)(params.puAddress);
            const normalizedDO = (0, addressNormalizer_1.normalizeAddress)(params.doAddress);
            try {
                // Get Google Maps distances
                logger_1.Logger.info(`Fetching Google Maps distance from ${normalizedPU} to ${normalizedDO}`);
                const puToDoRoute = yield (0, googleMaps_1.getShortestDistance)(normalizedPU, normalizedDO);
                const googleMiles = puToDoRoute.distanceMiles;
                logger_1.Logger.info(`Fetching Google Maps dead mile distance from ${COMPANY_ADDRESS} to ${normalizedPU}`);
                const deadMileRoute = yield (0, googleMaps_1.getShortestDistance)(COMPANY_ADDRESS, normalizedPU);
                const googleDeadMiles = deadMileRoute.distanceMiles;
                // Insert into database
                const sql = `
        INSERT INTO mileage_cache (
          passenger_last_name, passenger_first_name, PU_address, DO_address,
          RG_miles, Google_miles, RG_dead_miles, Google_dead_miles
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
                const stmt = this.db.prepare(sql);
                const result = stmt.run(normalizedLast, normalizedFirst, normalizedPU, normalizedDO, rgMiles, googleMiles, rgDeadMiles, googleDeadMiles);
                const entry = {
                    id: result.lastInsertRowid,
                    passenger_last_name: normalizedLast,
                    passenger_first_name: normalizedFirst,
                    PU_address: normalizedPU,
                    DO_address: normalizedDO,
                    RG_miles: rgMiles,
                    Google_miles: googleMiles,
                    RG_dead_miles: rgDeadMiles,
                    Google_dead_miles: googleDeadMiles
                };
                logger_1.Logger.success(`Created cache entry for ${normalizedFirst} ${normalizedLast}: ${googleMiles} miles, ${googleDeadMiles} dead miles`);
                return entry;
            }
            catch (error) {
                logger_1.Logger.error('Error fetching Google Maps distances:', error);
                // Fallback: create entry with RG values as Google values
                logger_1.Logger.warn('Falling back to Route Genie values for Google distances');
                const sql = `
        INSERT INTO mileage_cache (
          passenger_last_name, passenger_first_name, PU_address, DO_address,
          RG_miles, Google_miles, RG_dead_miles, Google_dead_miles
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
                const stmt = this.db.prepare(sql);
                const result = stmt.run(normalizedLast, normalizedFirst, normalizedPU, normalizedDO, rgMiles, rgMiles, rgDeadMiles, rgDeadMiles);
                const entry = {
                    id: result.lastInsertRowid,
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
        });
    }
    /**
     * Update an existing cache entry
     */
    updateCacheEntry(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isInitialized) {
                yield this.initialize();
            }
            const setClause = Object.keys(updates)
                .filter(key => key !== 'id' && key !== 'created_at')
                .map(key => `${key} = ?`)
                .join(', ');
            if (!setClause)
                return;
            const values = Object.keys(updates)
                .filter(key => key !== 'id' && key !== 'created_at')
                .map(key => updates[key]);
            const sql = `UPDATE mileage_cache SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            try {
                const stmt = this.db.prepare(sql);
                stmt.run(...values, id);
                logger_1.Logger.info(`Updated cache entry ${id}`);
            }
            catch (err) {
                logger_1.Logger.error('Error updating mileage cache:', err);
                throw err;
            }
        });
    }
    /**
     * Get the appropriate mileage value from a cache entry
     * Priority: overwrite_miles > Google_miles > RG_miles
     */
    getCachedMileage(entry) {
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
    getCachedDeadMileage(entry) {
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
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                try {
                    this.db.close();
                    this.isInitialized = false;
                    logger_1.Logger.info('Mileage cache database connection closed');
                }
                catch (err) {
                    logger_1.Logger.error('Error closing mileage cache database:', err);
                    throw err;
                }
            }
        });
    }
}
exports.MileageCache = MileageCache;
// Export singleton instance - lazy loaded
let _mileageCache = null;
function getMileageCache() {
    if (!_mileageCache) {
        _mileageCache = new MileageCache();
    }
    return _mileageCache;
}
exports.getMileageCache = getMileageCache;
// For backward compatibility
exports.mileageCache = {
    get instance() {
        return getMileageCache();
    },
    initialize: () => getMileageCache().initialize(),
    close: () => getMileageCache().close(),
    findCacheEntry: (params) => getMileageCache().findCacheEntry(params),
    createCacheEntry: (params, rgMiles, rgDeadMiles) => getMileageCache().createCacheEntry(params, rgMiles, rgDeadMiles),
    getCachedMileage: (entry) => getMileageCache().getCachedMileage(entry),
    getCachedDeadMileage: (entry) => getMileageCache().getCachedDeadMileage(entry),
};
//# sourceMappingURL=mileageCache.js.map