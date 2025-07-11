import fs from 'fs';
import path from 'path';
import log from 'electron-log/main';

class LoggerClass {
  private logFile: string;
  private debugMode: boolean;
  private logger: typeof log;

  constructor() {
    this.logFile = '';
    this.debugMode = false;
    this.logger = log;
    
    // Configure electron-log defaults
    this.logger.transports.console.level = 'info';
    this.logger.transports.file.level = 'info';
    this.logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  }

  initialize(logFile?: string, debugMode: boolean = false): void {
    this.debugMode = debugMode;
    
    if (logFile) {
      this.logFile = logFile;
      
      // Ensure log directory exists
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Configure electron-log file transport with custom path
      this.logger.transports.file.resolvePathFn = () => logFile;
    } else {
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
    } else {
      this.logger.transports.console.level = 'warn'; // Only show warnings and errors in console when not in debug mode
    }
  }

  info(message: string, forceConsole: boolean = false): void {
    if (this.debugMode || forceConsole) {
      console.log('ℹ️', message);
    }
    this.logger.info(message);
  }

  success(message: string): void {
    console.log('✅', message);
    this.logger.info(`SUCCESS: ${message}`);
  }

  warn(message: string): void {
    if (this.debugMode) {
      console.log('⚠️', message);
    }
    this.logger.warn(message);
  }

  error(message: string, error?: any): void {
    console.log('❌', message);
    if (error) {
      this.logger.error(`${message} - ${error}`);
    } else {
      this.logger.error(message);
    }
  }

  progress(message: string): void {
    console.log('🔄', message);
    this.logger.info(`PROGRESS: ${message}`);
  }

  getLogFilePath(): string {
    // Get the current log file path from electron-log
    try {
      return this.logger.transports.file.getFile().path;
    } catch (error) {
      // Fallback if getFile() fails
      return this.logFile || 'Default electron-log location';
    }
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  close(): void {
    // electron-log handles cleanup automatically
    // No manual cleanup needed for file streams
  }
}

// Create and export singleton instance
export const Logger = new LoggerClass();
