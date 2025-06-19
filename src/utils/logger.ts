import fs from 'fs';
import path from 'path';

export class Logger {
  private logFile: string;
  private logStream?: fs.WriteStream;

  constructor(logFile?: string) {
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

  info(message: string): void {
    console.log('ℹ️', message);
    this.writeToLog('INFO', message);
  }

  success(message: string): void {
    console.log('✅', message);
    this.writeToLog('SUCCESS', message);
  }

  warn(message: string): void {
    console.log('⚠️', message);
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

  close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}
