import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import envConfig from './env.config.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Winston Logger Configuration
 * Multiple transports with different log levels
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const levelColor = {
  error: c.bold + c.red,
  warn: c.bold + c.yellow,
  info: c.bold + c.green,
  http: c.bold + c.magenta,
  verbose: c.bold + c.cyan,
  debug: c.bold + c.blue,
};

const pid = process.pid;

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'MM/DD/YYYY, hh:mm:ss A' }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    const color = levelColor[level] ?? c.white;
    const label = level.toUpperCase().padEnd(7);
    const meta = Object.keys(metadata).length
      ? ` ${c.dim}${JSON.stringify(metadata)}${c.reset}`
      : '';
    const body = stack ? `${message}\n${c.dim}${stack}${c.reset}` : message;

    return (
      `${c.bold}${c.green}[JobLoom]${c.reset} ` +
      `${c.yellow}${pid}${c.reset}  ${c.dim}-${c.reset} ` +
      `${c.white}${timestamp}${c.reset}  ` +
      `${color}${label}${c.reset} ` +
      `${c.white}${body}${c.reset}` +
      meta
    );
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Define transports
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat,
    level: envConfig.logLevel,
  }),
];

// Add file transports only in non-test environments
if (!envConfig.isTest) {
  transports.push(
    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Error log file (errors only)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: envConfig.logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;
