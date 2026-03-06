// Common API response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Authentication types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    token: string;
}

// Strategy types
export interface CreateStrategyRequest {
    name: string;
    symbol: string;
    exchangeSegment: number;
    config: {
        indicators: Record<string, unknown>;
        stopLoss: number;
        takeProfit: number;
        quantity: number;
    };
}

export interface UpdateStrategyRequest extends Partial<CreateStrategyRequest> {
    id: string;
}

// Broker types
export interface BrokerConnectRequest {
    broker: string;
    clientId: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
}

export interface BrokerStatus {
    isConnected: boolean;
    broker?: string;
    clientId?: string;
    connectedAt?: Date;
}

// Market data types
export interface MarketDataRequest {
    exchangeSegment: number;
    exchangeInstrumentID: number;
    startTime?: string;
    endTime?: string;
    timeframe?: string;
}

export interface LiveQuoteRequest {
    instruments: Array<{
        exchangeSegment: number;
        exchangeInstrumentID: number;
    }>;
}
