import fs from 'fs';
import path from 'path';

class LoggerClass {
  private logFile: string;
  private logStream?: fs.WriteStream;
  private debugMode: boolean;

  constructor() {
    this.logFile = '';
    this.debugMode = false;
  }

  initialize(logFile?: string, debugMode: boolean = false): void {
    this.debugMode = debugMode;
    
    // Close existing stream if reinitializing
    if (this.logStream) {
      this.logStream.end();
      this.logStream = undefined;
    }

    if (logFile) {
      this.logFile = logFile;
      // Ensure log directory exists
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
    } else {
      this.logFile = '';
    }
  }

  private writeToLog(level: string, message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}${error ? ` - ${error}` : ''}\n`;
    
    if (this.logStream) {
      this.logStream.write(logEntry);
    }
  }

  info(message: string, forceConsole: boolean = false): void {
    if (this.debugMode || forceConsole) {
      console.log('ℹ️', message);
    }
    this.writeToLog('INFO', message);
  }

  success(message: string): void {
    console.log('✅', message);
    this.writeToLog('SUCCESS', message);
  }

  warn(message: string): void {
    if (this.debugMode) {
      console.log('⚠️', message);
    }
    this.writeToLog('WARN', message);
  }

  error(message: string, error?: any): void {
    console.log('❌', message);
    this.writeToLog('ERROR', message, error);
  }

  progress(message: string): void {
    console.log('🔄', message);
    this.writeToLog('PROGRESS', message);
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

// Create and export singleton instance
export const Logger = new LoggerClass();
