import path from 'path';

/**
 * Gets the directory where the executable is located.
 * This ensures paths are relative to the executable location, not the current working directory.
 */
export function getExecutableDir(): string {
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
  
  // In development with Electron, try to use app.getAppPath() if available
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
  
  // Fallback to current working directory
  return process.cwd();
}

/**
 * Resolves a path relative to the executable directory.
 */
export function resolveFromExecutable(...pathSegments: string[]): string {
  return path.join(getExecutableDir(), ...pathSegments);
}
