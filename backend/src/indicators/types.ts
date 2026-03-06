/**
 * Common types for technical indicators
 */

export interface CandleData {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: Date | string;
}

export interface IndicatorResult {
    value: number;
    timestamp?: Date | string;
}

export interface MAResult extends IndicatorResult {
    type: 'SMA' | 'EMA' | 'WMA' | 'HMA' | 'VWMA';
}

export interface MACDResult {
    MACD: number;
    signal: number;
    histogram: number;
    timestamp?: Date | string;
}

export interface RSIResult extends IndicatorResult {
    value: number;
    overbought: boolean;
    oversold: boolean;
}

export interface BollingerBandsResult {
    upper: number;
    middle: number;
    lower: number;
    timestamp?: Date | string;
}

export interface StochasticResult {
    k: number;
    d: number;
    timestamp?: Date | string;
}

export interface ATRResult extends IndicatorResult {
    atr: number;
}

export interface ADXResult {
    adx: number;
    pdi: number;
    mdi: number;
    timestamp?: Date | string;
}

export type PriceSource = 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';

/**
 * Extract price values based on source
 */
export function extractPrices(data: CandleData[], source: PriceSource = 'close'): number[] {
    switch (source) {
        case 'open':
            return data.map(d => d.open);
        case 'high':
            return data.map(d => d.high);
        case 'low':
            return data.map(d => d.low);
        case 'close':
            return data.map(d => d.close);
        case 'hl2':
            return data.map(d => (d.high + d.low) / 2);
        case 'hlc3':
            return data.map(d => (d.high + d.low + d.close) / 3);
        case 'ohlc4':
            return data.map(d => (d.open + d.high + d.low + d.close) / 4);
        default:
            return data.map(d => d.close);
    }
}

/**
 * Validate candle data
 */
export function validateCandleData(data: CandleData[]): boolean {
    if (!Array.isArray(data) || data.length === 0) {
        return false;
    }

    return data.every(candle => 
        typeof candle.open === 'number' &&
        typeof candle.high === 'number' &&
        typeof candle.low === 'number' &&
        typeof candle.close === 'number' &&
        typeof candle.volume === 'number' &&
        !isNaN(candle.open) &&
        !isNaN(candle.high) &&
        !isNaN(candle.low) &&
        !isNaN(candle.close) &&
        !isNaN(candle.volume)
    );
}

