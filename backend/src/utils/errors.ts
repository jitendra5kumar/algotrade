// Custom error classes for better error handling

export class ValidationError extends Error {
    public statusCode: number;
    public field?: string;

    constructor(message: string, field?: string) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.field = field;
    }
}

export class AuthenticationError extends Error {
    public statusCode: number;

    constructor(message: string = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

export class AuthorizationError extends Error {
    public statusCode: number;

    constructor(message: string = 'Access denied') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
    }
}

export class NotFoundError extends Error {
    public statusCode: number;

    constructor(message: string = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

export class BrokerConnectionError extends Error {
    public statusCode: number;
    public broker?: string;

    constructor(message: string, broker?: string) {
        super(message);
        this.name = 'BrokerConnectionError';
        this.statusCode = 502;
        this.broker = broker;
    }
}

export class StrategyExecutionError extends Error {
    public statusCode: number;
    public strategyId?: string;

    constructor(message: string, strategyId?: string) {
        super(message);
        this.name = 'StrategyExecutionError';
        this.statusCode = 500;
        this.strategyId = strategyId;
    }
}

export class MarketDataError extends Error {
    public statusCode: number;

    constructor(message: string) {
        super(message);
        this.name = 'MarketDataError';
        this.statusCode = 502;
    }
}

export class DatabaseError extends Error {
    public statusCode: number;

    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
        this.statusCode = 500;
    }
}

// Error handler utility
export const handleError = (error: unknown): { message: string; statusCode: number } => {
    if (error instanceof ValidationError || 
        error instanceof AuthenticationError || 
        error instanceof AuthorizationError || 
        error instanceof NotFoundError || 
        error instanceof BrokerConnectionError || 
        error instanceof StrategyExecutionError || 
        error instanceof MarketDataError || 
        error instanceof DatabaseError) {
        return {
            message: error.message,
            statusCode: error.statusCode
        };
    }

    // Handle unknown errors
    if (error instanceof Error) {
        return {
            message: error.message || 'Internal server error',
            statusCode: 500
        };
    }

    return {
        message: 'Unknown error occurred',
        statusCode: 500
    };
};
