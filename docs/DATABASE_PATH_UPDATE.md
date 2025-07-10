# Database Path Update - Summary

## Problem
The mileage cache database was previously stored relative to the executable location (`./data/mileage_cache.db`), which caused issues when building and packaging the application. The database would either:
1. Not be accessible in the packaged app
2. Be replaced with each app update

## Solution
Updated the database path to use the user's application data directory instead of a relative path to the executable. This provides several benefits:

### Benefits
1. **Persistence across updates**: Database survives app updates since it's stored in user data, not app directory
2. **Cross-platform support**: Automatically uses the appropriate user data directory for each OS:
   - Windows: `%APPDATA%\lakeshore-invoicer\data\mileage_cache.db`
   - macOS: `~/Library/Application Support/lakeshore-invoicer/data/mileage_cache.db`
   - Linux: `~/.config/lakeshore-invoicer/data/mileage_cache.db`
3. **User-specific data**: Each user gets their own database
4. **No packaging issues**: Database is created at runtime, not included in the app bundle

### Technical Changes Made

#### 1. Updated imports in `mileageCache.ts`
- Added `fs` and `os` imports for file system operations
- Removed dependency on `resolveFromExecutable` utility
- Removed unused `createCacheKey` import

#### 2. Added `getUserDataPath()` helper function
- Tries to use Electron's `app.getPath('userData')` when available
- Falls back to OS-specific user data directories when Electron is not available
- Handles all major operating systems (Windows, macOS, Linux)

#### 3. Updated MileageCache constructor
- Now uses `getUserDataPath()` to determine database location
- Creates path: `{userData}/lakeshore-invoicer/data/mileage_cache.db`

#### 4. Enhanced logging
- Added log message when data directory is created
- Shows the full database path in connection messages

### Example Database Locations
- **Development**: `C:\Users\{username}\AppData\Roaming\lakeshore-invoicer\data\mileage_cache.db`
- **Production**: Same location, ensuring consistency between dev and prod environments

### Testing
Created a test script (`testDatabasePath.ts`) to verify the database path resolution works correctly.

## Impact
- ✅ Database persists across app updates
- ✅ Works in packaged/built applications
- ✅ Cross-platform compatible
- ✅ User-specific data storage
- ✅ No manual database setup required
- ✅ Automatic directory creation
