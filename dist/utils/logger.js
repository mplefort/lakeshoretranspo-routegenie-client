"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor(logFile) {
        if (logFile) {
            this.logFile = logFile;
            // Ensure log directory exists
            const logDir = path_1.default.dirname(logFile);
            if (!fs_1.default.existsSync(logDir)) {
                fs_1.default.mkdirSync(logDir, { recursive: true });
            }
            this.logStream = fs_1.default.createWriteStream(logFile, { flags: 'a' });
        }
        else {
            this.logFile = '';
        }
    }
    writeToLog(level, message, error) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level}: ${message}${error ? ` - ${error}` : ''}\n`;
        if (this.logStream) {
            this.logStream.write(logEntry);
        }
    }
    info(message) {
        console.log('ℹ️', message);
        this.writeToLog('INFO', message);
    }
    success(message) {
        console.log('✅', message);
        this.writeToLog('SUCCESS', message);
    }
    warn(message) {
        console.log('⚠️', message);
        this.writeToLog('WARN', message);
    }
    error(message, error) {
        console.log('❌', message);
        this.writeToLog('ERROR', message, error);
    }
    progress(message) {
        console.log('🔄', message);
        this.writeToLog('PROGRESS', message);
    }
    close() {
        if (this.logStream) {
            this.logStream.end();
        }
    }
}
exports.Logger = Logger;
