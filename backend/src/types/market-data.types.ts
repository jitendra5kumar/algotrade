// Market data types
export interface CandleData {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    oi?: number;
}

export interface MarketDataToken {
    token: string;
    expiry: Date;
    lastRefresh: Date;
    isActive: boolean;
}

export interface HistoricalDataRequest {
    exchangeSegment: number;
    exchangeInstrumentID: number;
    startTime: string;
    endTime: string;
    compressionValue: number;
}

export interface LiveQuote {
    exchangeInstrumentID: number;
    lastTradedPrice: number;
    lastTradedQuantity: number;
    averageTradedPrice: number;
    volumeTradedToday: number;
    totalBuyQuantity: number;
    totalSellQuantity: number;
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: string;
}

export interface Instrument {
    exchangeSegment: number;
    exchangeInstrumentID: number;
    instrumentType: number;
    name: string;
    description: string;
    series: string;
    nameWithSeries: string;
    instrumentID: string;
    priceBand: {
        low: number;
        high: number;
        tickSize: number;
    };
    lotSize: number;
    tickSize: number;
    isin: string;
    displayName: string;
    expiry: string;
    strikePrice: number;
    optionType: string;
}
