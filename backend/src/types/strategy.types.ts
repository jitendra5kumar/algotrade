export interface TrendState {
    direction: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
    indicators: Record<string, unknown>;
    recommendation?: 'BUY' | 'HOLD' | 'SELL';
    [key: string]: unknown;
}

export interface StrategyExecutionResult {
    action: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
    currentPrice: number;
    confidence: number;
    timestamp: Date;
}

export interface StrategyMonitor {
    strategy: {
        _id: string;
        userId: string;
        name: string;
        symbol: string;
        exchangeSegment: number;
        config: {
            indicators: Record<string, unknown>;
            stopLoss: number;
            takeProfit: number;
            quantity: number;
        };
    };
    historicalData: Array<{
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>;
    trendState: TrendState;
    lastCheckTime: number;
    interval: NodeJS.Timeout | null;
    // Note: Only LIVE trading supported (paper trading removed)
}

export interface WebSocketEventData {
    strategyId: string;
    signal?: 'BUY' | 'SELL' | 'HOLD';
    price?: number;
    reason?: string;
    confidence?: number;
    oldTrend?: TrendState;
    newTrend?: TrendState;
    currentPrice?: number;
    loss?: number;
    profit?: number;
    error?: string;
}
