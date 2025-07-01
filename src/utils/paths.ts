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
  
  // In development with ts-node, use the project root
  if (process.env.NODE_ENV !== 'production') {
    // For development, find the project root by looking for package.json
    let currentDir = __dirname;
    while (currentDir !== path.dirname(currentDir)) {
      try {
        require.resolve(path.join(currentDir, 'package.json'));
        return currentDir;
      } catch {
        currentDir = path.dirname(currentDir);
      }
    }
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
