import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import config from '../config/environment';

// Extend Winston Logger interface to include custom methods
interface ExtendedLogger extends winston.Logger {
    logRequest: (req: Request) => void;
}

// Request interface for type safety
interface Request {
    method?: string;
    url?: string;
    ip?: string;
    get?: (header: string) => string | undefined;
    user?: {
        id?: string;
    };
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../', config.LOG_FILE_PATH);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
        // Extract metadata (exclude winston internal fields)
        const { [Symbol.for('level')]: _, [Symbol.for('message')]: __, ...meta } = metadata;
        
        // Format metadata if present
        const metaStr = Object.keys(meta).length > 0 
            ? '\n' + JSON.stringify(meta, null, 2)
            : '';
        
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
    })
);

// Create logger instance with daily rotation
const logger = winston.createLogger({
    level: config.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console transport (only in development)
        ...(config.NODE_ENV === 'development' ? [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    logFormat
                ),
            })
        ] : []),
        // Daily rotate file for errors
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d', // Keep 30 days of error logs
            zippedArchive: true,
            format: logFormat,
        }),
        // Daily rotate file for all logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d', // Keep 30 days of combined logs
            zippedArchive: true,
            format: logFormat,
        }),
    ],
    exitOnError: false,
}) as unknown as ExtendedLogger;

// Add request logging helper
logger.logRequest = (req: Request) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get?.('user-agent'),
        userId: req.user?.id || 'anonymous',
    });
};

export default logger;

