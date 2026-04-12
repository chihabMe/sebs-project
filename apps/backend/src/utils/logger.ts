import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger implementation
class Logger {
  private logToFile(message: string, level: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}\n`;
    
    // In production, you might want to use a proper logging library like winston
    if (process.env.NODE_ENV !== 'test') {
      fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage);
    }
  }

  info(message: string, meta?: any) {
    const logEntry = meta ? `${message} ${JSON.stringify(meta)}` : message;
    console.info(`INFO: ${logEntry}`);
    this.logToFile(logEntry, 'INFO');
  }

  warn(message: string, meta?: any) {
    const logEntry = meta ? `${message} ${JSON.stringify(meta)}` : message;
    console.warn(`WARN: ${logEntry}`);
    this.logToFile(logEntry, 'WARN');
  }

  error(message: string, meta?: any) {
    const logEntry = meta ? `${message} ${JSON.stringify(meta)}` : message;
    console.error(`ERROR: ${logEntry}`);
    this.logToFile(logEntry, 'ERROR');
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = meta ? `${message} ${JSON.stringify(meta)}` : message;
      console.debug(`DEBUG: ${logEntry}`);
      this.logToFile(logEntry, 'DEBUG');
    }
  }
}

export const logger = new Logger();