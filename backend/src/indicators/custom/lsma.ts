import { CandleData } from '../types';

export interface LSMAResult {
    value: number;
    timestamp?: Date | string;
}

export class LSMA {
    /**
     * Calculate Least Squares Moving Average (TradingView compatible)
     * Uses centered linear regression
     */
    public static calculate(
        data: CandleData[],
        period: number = 25
    ): LSMAResult[] {
        if (data.length < period) {
            throw new Error('Insufficient data for LSMA calculation');
        }
        
        const results: LSMAResult[] = [];
        
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const prices = slice.map(d => d.close);
            const lsma = this.linearRegression(prices);
            
            results.push({
                value: lsma,
                timestamp: data[i].timestamp
            });
        }
        
        return results;
    }
    
    private static linearRegression(values: number[]): number {
        const n = values.length;
        const mid = (n - 1) / 2; // Center point
        
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            const x = i - mid; // Centered indexing: -mid to +mid
            sumX += x;
            sumY += values[i];
            sumXY += x * values[i];
            sumX2 += x * x;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Return value at the last point (x = mid)
        return slope * mid + intercept;
    }
}