"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const main_1 = __importDefault(require("electron-log/main"));
class LoggerClass {
    constructor() {
        this.logFile = '';
        this.debugMode = false;
        this.logger = main_1.default;
        // Configure electron-log defaults
        this.logger.transports.console.level = 'info';
        this.logger.transports.file.level = 'info';
        this.logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    }
    initialize(logFile, debugMode = false) {
        this.debugMode = debugMode;
        if (logFile) {
            this.logFile = logFile;
            // Ensure log directory exists
            const logDir = path_1.default.dirname(logFile);
            if (!fs_1.default.existsSync(logDir)) {
                fs_1.default.mkdirSync(logDir, { recursive: true });
            }
            // Configure electron-log file transport with custom path
            this.logger.transports.file.resolvePathFn = () => logFile;
        }
        else {
            // Use electron-log's default file location - don't set resolvePathFn at all
            // Default locations:
            // Linux: ~/.config/{app name}/logs/main.log
            // macOS: ~/Library/Logs/{app name}/main.log  
            // Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\main.log
            // Don't set resolvePathFn to use the default location
            this.logFile = '';
        }
        // Always ensure file logging is enabled
        this.logger.transports.file.level = 'info';
        // Configure console logging based on debug mode
        if (debugMode) {
            this.logger.transports.console.level = 'silly';
        }
        else {
            this.logger.transports.console.level = 'warn'; // Only show warnings and errors in console when not in debug mode
        }
    }
    info(message, forceConsole = false) {
        if (this.debugMode || forceConsole) {
            console.log('ℹ️', message);
        }
        this.logger.info(message);
    }
    success(message) {
        console.log('✅', message);
        this.logger.info(`SUCCESS: ${message}`);
    }
    warn(message) {
        if (this.debugMode) {
            console.log('⚠️', message);
        }
        this.logger.warn(message);
    }
    error(message, error) {
        console.log('❌', message);
        if (error) {
            this.logger.error(`${message} - ${error}`);
        }
        else {
            this.logger.error(message);
        }
    }
    progress(message) {
        console.log('🔄', message);
        this.logger.info(`PROGRESS: ${message}`);
    }
    getLogFilePath() {
        // Get the current log file path from electron-log
        try {
            return this.logger.transports.file.getFile().path;
        }
        catch (error) {
            // Fallback if getFile() fails
            return this.logFile || 'Default electron-log location';
        }
    }
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    close() {
        // electron-log handles cleanup automatically
        // No manual cleanup needed for file streams
    }
}
// Create and export singleton instance
exports.Logger = new LoggerClass();
//# sourceMappingURL=logger.js.map