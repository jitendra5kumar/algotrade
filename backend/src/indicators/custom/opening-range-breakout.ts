import { CandleData } from '../types';

export interface ORBResult {
    orbHigh: number;
    orbLow: number;
    breakoutType: 'LONG' | 'SHORT' | 'NONE';
    inRange: boolean;
    timestamp?: Date | string;
}

export interface ORBConfig {
    openingRangeMinutes?: number; // Default: 15 minutes
    breakoutThreshold?: number; // Percentage above/below ORB
}

export class OpeningRangeBreakout {
    /**
     * Calculate Opening Range Breakout
     * Identifies breakouts from the first N minutes of trading
     */
    public static calculate(
        data: CandleData[],
        config: ORBConfig = {}
    ): ORBResult[] {
        const {
            openingRangeMinutes = 15,
            breakoutThreshold = 0
        } = config;

        if (data.length < openingRangeMinutes) {
            throw new Error('Insufficient data for ORB calculation');
        }

        const results: ORBResult[] = [];
        
        // Get opening range candles (first N candles)
        const orbCandles = data.slice(0, openingRangeMinutes);
        const orbHigh = Math.max(...orbCandles.map(d => d.high));
        const orbLow = Math.min(...orbCandles.map(d => d.low));
        
        const thresholdHigh = orbHigh * (1 + breakoutThreshold / 100);
        const thresholdLow = orbLow * (1 - breakoutThreshold / 100);
        
        // Check each candle for breakout
        for (let i = openingRangeMinutes; i < data.length; i++) {
            const candle = data[i];
            let breakoutType: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
            let inRange = true;
            
            if (candle.close > thresholdHigh) {
                breakoutType = 'LONG';
                inRange = false;
            } else if (candle.close < thresholdLow) {
                breakoutType = 'SHORT';
                inRange = false;
            } else {
                inRange = candle.close >= orbLow && candle.close <= orbHigh;
            }
            
            results.push({
                orbHigh,
                orbLow,
                breakoutType,
                inRange,
                timestamp: candle.timestamp
            });
        }
        
        return results;
    }

    /**
     * Get today's opening range
     * Useful for intraday trading
     */
    public static getTodayORB(data: CandleData[], minutes: number = 15): {
        high: number;
        low: number;
        range: number;
    } {
        const orbCandles = data.slice(0, Math.min(minutes, data.length));
        const high = Math.max(...orbCandles.map(d => d.high));
        const low = Math.min(...orbCandles.map(d => d.low));
        
        return {
            high,
            low,
            range: high - low
        };
    }
}
