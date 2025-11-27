import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// ANSI color codes for console output
const Colors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Red: '\x1b[31m',
  Yellow: '\x1b[33m',
  Green: '\x1b[32m',
  Cyan: '\x1b[36m',
  Magenta: '\x1b[35m',
  BgRed: '\x1b[41m',
  BgYellow: '\x1b[43m',
};

export class Logger {
  private static instances: Map<string, Logger> = new Map();
  private logLevel: LogLevel;
  private logFilePath: string;
  private logStream: fs.WriteStream | null = null;
  private workerId: string;

  private constructor(workerId: string) {
    this.workerId = workerId;
    
    // Get log level from environment variable, default to INFO
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.logLevel = LogLevel[envLogLevel as keyof typeof LogLevel] ?? LogLevel.INFO;

    // Setup log directory and file
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create log file with timestamp and worker ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    this.logFilePath = path.join(logDir, `test-${timestamp}-worker-${workerId}.log`);
    
    // Create write stream for the log file
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
  }

  public static getInstance(workerId?: string): Logger {
    // Use process ID as worker identifier if not provided
    const id = workerId || process.pid.toString();
    
    if (!Logger.instances.has(id)) {
      Logger.instances.set(id, new Logger(id));
    }
    return Logger.instances.get(id)!;
  }

  private getColorForLevel(levelName: string): string {
    switch (levelName) {
      case 'ERROR':
        return `${Colors.BgRed}${Colors.Bright}`;
      case 'WARN':
        return `${Colors.Yellow}${Colors.Bright}`;
      case 'INFO':
        return `${Colors.Green}`;
      case 'DEBUG':
        return `${Colors.Cyan}`;
      case 'TRACE':
        return `${Colors.Magenta}`;
      default:
        return Colors.Reset;
    }
  }

  private formatMessage(level: string, message: string, data?: any, colorize: boolean = false): string {
    const timestamp = new Date().toISOString();
    const color = colorize ? this.getColorForLevel(level) : '';
    const reset = colorize ? Colors.Reset : '';
    
    let logMessage = `${color}[${timestamp}] [Worker-${this.workerId}] [${level}]${reset} ${message}`;
    
    if (data !== undefined) {
      if (typeof data === 'object') {
        logMessage += `\n${JSON.stringify(data, null, 2)}`;
      } else {
        logMessage += ` ${data}`;
      }
    }
    
    return logMessage;
  }

  private writeLog(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level <= this.logLevel) {
      // Write to console with colors
      const coloredMessage = this.formatMessage(levelName, message, data, true);
      console.log(coloredMessage);
      
      // Write to file without colors
      const plainMessage = this.formatMessage(levelName, message, data, false);
      if (this.logStream) {
        this.logStream.write(plainMessage + '\n');
      }
    }
  }

  public error(message: string, data?: any): void {
    this.writeLog(LogLevel.ERROR, 'ERROR', message, data);
  }

  public warn(message: string, data?: any): void {
    this.writeLog(LogLevel.WARN, 'WARN', message, data);
  }

  public info(message: string, data?: any): void {
    this.writeLog(LogLevel.INFO, 'INFO', message, data);
  }

  public debug(message: string, data?: any): void {
    this.writeLog(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  public trace(message: string, data?: any): void {
    this.writeLog(LogLevel.TRACE, 'TRACE', message, data);
  }

  public scenarioStart(scenarioName: string, browser?: string): void {
    const separator = '='.repeat(80);
    const startMarker = '--- START OF SCENARIO ---';
    const browserInfo = browser ? ` [Browser: ${browser.toUpperCase()}]` : '';
    const workerInfo = `[Worker-${this.workerId}]`;
    const scenarioHeader = `Scenario: ${scenarioName}${browserInfo} ${workerInfo}`;
    
    const logContent = `\n${separator}\n${startMarker}\n${scenarioHeader}\n${separator}\n`;
    
    // Write to console with color
    console.log(`${Colors.Bright}${Colors.Cyan}${logContent}${Colors.Reset}`);
    
    // Write to file
    if (this.logStream) {
      this.logStream.write(logContent);
    }
  }

  public scenarioEnd(scenarioName: string, status: string, browser?: string): void {
    const separator = '='.repeat(80);
    const endMarker = '--- END OF SCENARIO ---';
    const browserInfo = browser ? ` [Browser: ${browser.toUpperCase()}]` : '';
    const workerInfo = `[Worker-${this.workerId}]`;
    const scenarioFooter = `Scenario: ${scenarioName}${browserInfo} ${workerInfo} | Status: ${status}`;
    
    const logContent = `${separator}\n${scenarioFooter}\n${endMarker}\n${separator}\n`;
    
    // Write to console with cyan color (same as start)
    console.log(`${Colors.Bright}${Colors.Cyan}${logContent}${Colors.Reset}`);
    
    // Write to file
    if (this.logStream) {
      this.logStream.write(logContent);
    }
  }

  public close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  public getLogFilePath(): string {
    return this.logFilePath;
  }

  public static closeAll(): void {
    Logger.instances.forEach(instance => instance.close());
    Logger.instances.clear();
  }
}

// Helper function to get logger instance for current worker
export function getLogger(workerId?: string): Logger {
  return Logger.getInstance(workerId);
}
