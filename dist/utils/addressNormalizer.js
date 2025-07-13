"use strict";
/**
 * Address normalization utilities to ensure consistent cache lookups
 * Handles variations in address formatting from Route Genie
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCacheKey = exports.normalizeName = exports.normalizeAddress = void 0;
/**
 * Normalizes an address string for consistent database storage and lookup
 * @param address - Raw address string from Route Genie
 * @returns Normalized address string
 */
function normalizeAddress(address) {
    if (!address)
        return '';
    return address
        .trim()
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        // Standardize common abbreviations
        .replace(/\bSt\b/gi, 'St')
        .replace(/\bStreet\b/gi, 'St')
        .replace(/\bAve\b/gi, 'Ave')
        .replace(/\bAvenue\b/gi, 'Ave')
        .replace(/\bRd\b/gi, 'Rd')
        .replace(/\bRoad\b/gi, 'Rd')
        .replace(/\bDr\b/gi, 'Dr')
        .replace(/\bDrive\b/gi, 'Dr')
        .replace(/\bCt\b/gi, 'Ct')
        .replace(/\bCourt\b/gi, 'Ct')
        .replace(/\bPl\b/gi, 'Pl')
        .replace(/\bPlace\b/gi, 'Pl')
        .replace(/\bBlvd\b/gi, 'Blvd')
        .replace(/\bBoulevard\b/gi, 'Blvd')
        .replace(/\bCo Rd\b/gi, 'Co Rd')
        .replace(/\bCounty Road\b/gi, 'Co Rd')
        // Ensure consistent capitalization for state codes
        .replace(/,\s*wi\s*/gi, ', WI ')
        .replace(/,\s*wisconsin\s*/gi, ', WI ')
        // Remove trailing comma and spaces
        .replace(/,\s*$/, '')
        // Final cleanup
        .trim();
}
exports.normalizeAddress = normalizeAddress;
/**
 * Normalizes a passenger name for consistent database storage and lookup
 * @param name - Raw name string
 * @returns Normalized name string
 */
function normalizeName(name) {
    if (!name)
        return '';
    return name
        .trim()
        .toUpperCase()
        // Remove extra spaces
        .replace(/\s+/g, ' ');
}
exports.normalizeName = normalizeName;
/**
 * Creates a cache lookup key from passenger and address information
 * @param firstName - Passenger first name
 * @param lastName - Passenger last name
 * @param puAddress - Pick up address
 * @param doAddress - Drop off address
 * @returns Normalized cache key for consistent lookups
 */
function createCacheKey(firstName, lastName, puAddress, doAddress) {
    const normalizedFirst = normalizeName(firstName);
    const normalizedLast = normalizeName(lastName);
    const normalizedPU = normalizeAddress(puAddress);
    const normalizedDO = normalizeAddress(doAddress);
    return `${normalizedLast}|${normalizedFirst}|${normalizedPU}|${normalizedDO}`;
}
exports.createCacheKey = createCacheKey;
//# sourceMappingURL=addressNormalizer.js.map