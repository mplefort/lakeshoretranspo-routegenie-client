import path from 'path';
import os from 'os';

/**
 * Get the user data directory path for storing persistent data
 */
export function getUserDataPath(): string {
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

/**
 * Gets the directory where the executable is located.
 * This ensures paths are relative to the executable location, not the current working directory.
 */
export function getExecutableDir(): string {
  // Check if we're in development mode first
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Try to import Electron app module (only available in main process)
      const { app } = require('electron');
      if (app && app.getAppPath) {
        return app.getAppPath();
      }
    } catch {
      // Electron not available or we're in renderer process, fallback to other methods
    }
    
    // For development with webpack, use the current working directory
    // since webpack bundles everything into .webpack directory
    return process.cwd();
  }
  
  // Check if we're running in a packaged Electron app
  if (process.resourcesPath && !process.resourcesPath.includes('node_modules')) {
    // In packaged Electron apps, extraResource files are in the resources directory
    return process.resourcesPath;
  }
  
  // Check if we're running in a pkg environment
  if ((process as any).pkg) {
    // In pkg executables, use the directory where the executable is located
    return path.dirname(process.execPath);
  }
  
  // Check if we're running in a nexe environment
  if (process.execPath.includes('nexe') || process.argv[0].includes('nexe')) {
    // In packaged executables, resources are available at the root of the virtual filesystem
    return process.cwd();
  }
  
  // Fallback to current working directory
  return process.cwd();
}

/**
 * Resolves a path relative to the executable directory.
 */
export function resolveFromExecutable(...pathSegments: string[]): string {
  return path.join(getExecutableDir(), ...pathSegments);
}
