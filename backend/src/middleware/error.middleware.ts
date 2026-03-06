import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { handleError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, BrokerConnectionError, StrategyExecutionError, MarketDataError, DatabaseError } from '../utils/errors';

/**
 * Global error handling middleware
 */
export const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const { message, statusCode } = handleError(error);

    // Log error details
    logger.error('Error occurred:', {
        message,
        statusCode,
        path: req.path,
        method: req.method,
        userId: req.user?.userId,
        stack: error instanceof Error ? error.stack : undefined
    });

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error instanceof Error ? error.stack : undefined
        })
    });
};

/**
 * Async error wrapper for controllers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Standardized controller response helper
 */
export const sendResponse = (
    res: Response,
    statusCode: number,
    data?: unknown,
    message?: string
): void => {
    res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        ...(data && typeof data === 'object' ? { data } : {}),
        ...(message && { message })
    });
};

/**
 * Validation error handler
 */
export const handleValidationError = (error: unknown, res: Response): void => {
    if (error instanceof ValidationError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 400, null, 'Validation failed');
    }
};

/**
 * Authentication error handler
 */
export const handleAuthError = (error: unknown, res: Response): void => {
    if (error instanceof AuthenticationError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 401, null, 'Authentication failed');
    }
};

/**
 * Authorization error handler
 */
export const handleAuthorizationError = (error: unknown, res: Response): void => {
    if (error instanceof AuthorizationError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 403, null, 'Access denied');
    }
};

/**
 * Not found error handler
 */
export const handleNotFoundError = (error: unknown, res: Response): void => {
    if (error instanceof NotFoundError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 404, null, 'Resource not found');
    }
};

/**
 * Broker connection error handler
 */
export const handleBrokerError = (error: unknown, res: Response): void => {
    if (error instanceof BrokerConnectionError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 502, null, 'Broker connection failed');
    }
};

/**
 * Strategy execution error handler
 */
export const handleStrategyError = (error: unknown, res: Response): void => {
    if (error instanceof StrategyExecutionError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 500, null, 'Strategy execution failed');
    }
};

/**
 * Market data error handler
 */
export const handleMarketDataError = (error: unknown, res: Response): void => {
    if (error instanceof MarketDataError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 502, null, 'Market data service failed');
    }
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error: unknown, res: Response): void => {
    if (error instanceof DatabaseError) {
        sendResponse(res, error.statusCode, null, error.message);
    } else {
        sendResponse(res, 500, null, 'Database operation failed');
    }
};
