"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFromExecutable = exports.getExecutableDir = void 0;
const path_1 = __importDefault(require("path"));
/**
 * Gets the directory where the executable is located.
 * This ensures paths are relative to the executable location, not the current working directory.
 */
function getExecutableDir() {
    // Check if we're in development mode first
    if (process.env.NODE_ENV !== 'production') {
        try {
            // Try to import Electron app module (only available in main process)
            const { app } = require('electron');
            if (app && app.getAppPath) {
                return app.getAppPath();
            }
        }
        catch (_a) {
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
    if (process.pkg) {
        // In pkg executables, use the directory where the executable is located
        return path_1.default.dirname(process.execPath);
    }
    // Check if we're running in a nexe environment
    if (process.execPath.includes('nexe') || process.argv[0].includes('nexe')) {
        // In packaged executables, resources are available at the root of the virtual filesystem
        return process.cwd();
    }
    // Fallback to current working directory
    return process.cwd();
}
exports.getExecutableDir = getExecutableDir;
/**
 * Resolves a path relative to the executable directory.
 */
function resolveFromExecutable(...pathSegments) {
    return path_1.default.join(getExecutableDir(), ...pathSegments);
}
exports.resolveFromExecutable = resolveFromExecutable;
//# sourceMappingURL=paths.js.map