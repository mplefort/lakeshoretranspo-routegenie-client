# Mileage Cache Cloud Sync

This document describes the Google Cloud Storage integration for the mileage cache database.

## Overview

The mileage cache now automatically synchronizes with Google Cloud Storage to ensure data consistency across different app instances and provide backup functionality.

## Configuration

### Environment Variables

Make sure the following environment variable is set in your `.env` file:

```env
GOOGLE_CLOUD_STORAGE_KEY=keys/lakeshoretransportwi-storagekey.json
```

This should point to your Google Cloud Storage service account key file.

### Google Cloud Storage Setup

- **Bucket Name**: `lakeshore-mileage-cache-db`
- **Files**:
  - `mileage_cache.db` - The SQLite database file
  - `mileage_cache_metadata.json` - Version and sync metadata

## How It Works

### Initialization (`initialize()`)

1. **Download Phase**: When the app starts, it attempts to download the latest database from Google Cloud Storage
2. **Conflict Resolution**: Always overwrites the local database with the remote version (if available)
3. **Error Handling**: If download fails:
   - Shows a warning about inability to pull database
   - Suggests checking WiFi connection
   - Gives user option to retry or continue with local database only
4. **Fallback**: If cloud sync is unavailable, uses local database

### Closing (`close()`)

1. **Upload Phase**: When the app closes, it uploads the local database to Google Cloud Storage
2. **Version Management**: Automatically increments version number and updates metadata
3. **Error Handling**: If upload fails:
   - Shows warning about inability to push database
   - Warns that changes may be lost
   - Gives user option to retry upload or continue closing without cloud backup

### Version Metadata

The system tracks the following metadata:

```json
{
  "version": 1,
  "lastSync": "2025-07-20T10:30:00.000Z",
  "lastModified": "2025-07-20T10:29:45.123Z",
  "fileSize": 12345
}
```

- **version**: Auto-incrementing version number
- **lastSync**: Timestamp when the file was last synchronized to cloud
- **lastModified**: File system modification timestamp
- **fileSize**: Size of the database file in bytes

## Testing

Use the test script to verify cloud sync functionality:

```bash
npm run test:cloud-sync
```

Or run directly:

```typescript
import { testCloudSync } from './src/scripts/testCloudSync';
testCloudSync();
```

## Error Scenarios

### No Internet Connection
- **Initialize**: Continues with local database, shows warning
- **Close**: Shows warning, option to retry or continue

### Invalid Credentials
- **Both phases**: Logs error, continues with local-only operation

### Bucket Not Found
- **Both phases**: Logs error, continues with local-only operation

### Corrupted Remote Database
- **Initialize**: Downloads anyway (overwrites local), database may need repair

## Best Practices

1. **Always call `initialize()` before using the cache**
2. **Always call `close()` when shutting down the application**
3. **Monitor logs for cloud sync warnings and errors**
4. **Ensure stable internet connection for reliable sync**
5. **Keep the Google Cloud Storage key file secure and accessible**

## Future Enhancements

1. **User Dialog Integration**: Replace console warnings with actual Electron dialogs
2. **Conflict Resolution**: Add smarter merge strategies for conflicting data
3. **Multiple Backups**: Keep historical versions in cloud storage
4. **Compression**: Compress database before upload to reduce bandwidth
5. **Incremental Sync**: Only sync changes instead of full database
6. **Background Sync**: Periodic sync during app runtime
