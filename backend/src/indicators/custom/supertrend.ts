import { CandleData } from '../types';

export interface SuperTrendResult {
    supertrend: number;
    direction: 'LONG' | 'SHORT';
    timestamp?: Date | string;
}

export interface SuperTrendConfig {
    period?: number;
    multiplier?: number;
}

export class SuperTrend {
    /**
     * Calculate SuperTrend indicator
     * Based on ATR and price action
     */
    public static calculate(
        data: CandleData[],
        period: number = 10,
        multiplier: number = 3
    ): SuperTrendResult[] {
        if (data.length < period) {
            throw new Error('Insufficient data for SuperTrend calculation');
        }

        const results: SuperTrendResult[] = [];
        const atr = this.calculateATR(data, period);
        
        let direction: 'LONG' | 'SHORT' = 'LONG';
        let supertrend = 0;
        
        for (let i = period; i < data.length; i++) {
            const hl2 = (data[i].high + data[i].low) / 2;
            const upperBand = hl2 + (multiplier * atr[i - period]);
            const lowerBand = hl2 - (multiplier * atr[i - period]);
            
            // Calculate SuperTrend
            if (data[i].close > supertrend) {
                direction = 'LONG';
                supertrend = lowerBand;
            } else if (data[i].close < supertrend) {
                direction = 'SHORT';
                supertrend = upperBand;
            }
            
            results.push({
                supertrend,
                direction,
                timestamp: data[i].timestamp
            });
        }
        
        return results;
    }

    private static calculateATR(data: CandleData[], period: number): number[] {
        const atr: number[] = [];
        
        for (let i = 1; i < data.length; i++) {
            const tr = Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - data[i - 1].close),
                Math.abs(data[i].low - data[i - 1].close)
            );
            
            if (i === 1) {
                atr.push(tr);
            } else {
                atr.push((atr[i - 2] * (period - 1) + tr) / period);
            }
        }
        
        return atr;
    }
}
