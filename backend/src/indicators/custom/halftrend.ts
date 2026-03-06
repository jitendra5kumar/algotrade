import { CandleData } from '../types';

export interface HalfTrendResult {
    trend: number;
    direction: 'UP' | 'DOWN';
    arrow: 1 | -1 | 0; // 1=buy signal, -1=sell signal, 0=no signal
    timestamp?: Date | string;
}

export class HalfTrend {
    /**
     * Calculate HalfTrend indicator
     */
    public static calculate(
        data: CandleData[],
        amplitude: number = 2,
        channelDeviation: number = 2
    ): HalfTrendResult[] {
        if (data.length < 10) {
            throw new Error('Insufficient data for HalfTrend calculation');
        }

        const results: HalfTrendResult[] = [];
        let trend = 0;
        let direction: 'UP' | 'DOWN' = 'UP';
        let prevDirection: 'UP' | 'DOWN' = 'UP';
        
        for (let i = amplitude; i < data.length; i++) {
            const atr = this.calculateATR(data.slice(Math.max(0, i - 10), i + 1));
            const dev = channelDeviation * atr;
            
            const highPrice = Math.max(...data.slice(i - amplitude, i + 1).map(d => d.high));
            const lowPrice = Math.min(...data.slice(i - amplitude, i + 1).map(d => d.low));
            
            const highma = highPrice - dev;
            const lowma = lowPrice + dev;
            
            if (data[i].close > highma) {
                direction = 'UP';
                trend = Math.max(lowma, trend);
            } else if (data[i].close < lowma) {
                direction = 'DOWN';
                trend = Math.min(highma, trend);
            }
            
            const arrow = direction !== prevDirection ? (direction === 'UP' ? 1 : -1) : 0;
            
            results.push({
                trend,
                direction,
                arrow,
                timestamp: data[i].timestamp
            });
            
            prevDirection = direction;
        }
        
        return results;
    }

    private static calculateATR(data: CandleData[]): number {
        let atr = 0;
        for (let i = 1; i < data.length; i++) {
            const tr = Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - data[i - 1].close),
                Math.abs(data[i].low - data[i - 1].close)
            );
            atr = (atr * (i - 1) + tr) / i;
        }
        return atr;
    }
}
