import marketDataService from './market-data.service';
import { CandleData } from '../indicators/types';
import { setCache, getCache } from '../config/redis';
import logger from '../utils/logger';

interface FetchCandlesParams {
    symbol: string;
    exchangeSegment: string;
    exchangeInstrumentID: number;
    interval: string; // '1min', '5min', '15min', '1hour', '1day'
    maPeriod?: number; // Optional: if provided, will calculate required candles
}

interface HistoricalDataConfig {
    maPeriod: number;
    timeframe: string;
    candlesPerTradingDay: number;
    tradingDaysNeeded: number;
    calendarDaysToFetch: number;
    startTime: string;
    endTime: string;
    daysInWeeks: string;
}

class HistoricalDataService {
    private readonly timeframeMap: { [key: string]: number } = {
        '1min': 1,
        '5min': 5,
        '15min': 15,
        '30min': 30,
        '1hour': 60,
        '1day': 1440
    };

    /**
     * Convert interval to compression value for XTS API
     */
    private getCompressionValue(interval: string): number {
        const map: Record<string, number> = {
            '1min': 60,
            '5min': 300,
            '15min': 900,
            '30min': 1800,
            '1hour': 3600,
            '1day': 86400,
        };
        return map[interval] || 5;
    }

    /**
     * Get timeframe in minutes from interval string
     */
    public getTimeframeMinutes(interval: string): number {
        return this.timeframeMap[interval] || 15;
    }

    /**
     * Convert exchange segment string to number
     */
    private convertExchangeSegment(exchangeSegment: string): number {
        const map: Record<string, number> = {
            'NSECM': 1,   // NSE Cash Market
            'NSEFO': 2,   // NSE Futures & Options
            'NSECD': 3,   // NSE Currency Derivatives
            'BSECM': 11,  // BSE Cash Market
            'BSEFO': 12,  // BSE Futures & Options
            'MCXFO': 51,  // MCX Futures & Options
        };
        return map[exchangeSegment] || 1; // Default to 1 (NSECM)
    }

    /**
     * Calculate historical data required for MA calculation (Dynamic)
     * Formula: Based on MA period and timeframe, with NSE market hours consideration
     */
    private calculateHistoricalDataRequired(
        maPeriod: number,
        timeframeKey: string,
    ): HistoricalDataConfig {
        const timeframeMinutes = this.getTimeframeMinutes(timeframeKey);
        
        // NSE trading hours: 9:15 AM to 3:30 PM = 6.25 hours = 375 minutes
        const tradingMinutesPerDay = 6.25 * 60;
        
        // Kitne candles ek din mein aayenge
        const candlesPerTradingDay = Math.floor(tradingMinutesPerDay / timeframeMinutes);
        
        // Exact trading days needed
        const tradingDaysNeeded = Math.ceil(maPeriod / candlesPerTradingDay);
        
        // Calendar days calculate karo (weekends + holidays account)
        // India mein avg 4.4 trading days per calendar week (holidays se)
        const tradingDaysPerCalendarWeek = 4.4;
        const weeksNeeded = tradingDaysNeeded / tradingDaysPerCalendarWeek;
        const calendarDaysBuffer = Math.ceil(weeksNeeded * 7);
        
        // Extra 10% buffer - market gaps, corporate actions ke liye
        const finalDaysToFetch = Math.ceil(calendarDaysBuffer * 1.1);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - finalDaysToFetch);
        
        const startTime = this.formatDateTime(startDate);
        const endTime = this.formatDateTime(endDate);
        
        const config: HistoricalDataConfig = {
            maPeriod,
            timeframe: timeframeKey,
            candlesPerTradingDay,
            tradingDaysNeeded,
            calendarDaysToFetch: finalDaysToFetch,
            startTime,
            endTime,
            daysInWeeks: (finalDaysToFetch / 7).toFixed(2),
        };
        
        logger.info('Historical data configuration calculated:', config);
        console.log('📊 [Historical Data] Dynamic Data Config:', config);
        
        return config;
    }

    /**
     * Generate time range for fetching data
     * If maPeriod is provided, calculate dynamically
     * Otherwise use manual limit
     */
    private getTimeRange(interval: string, maPeriod?: number, limit: number = 100): {
        startTime: string;
        endTime: string;
    } {
        // If maPeriod is provided, calculate dynamically
        if (maPeriod && maPeriod > 0) {
            const config = this.calculateHistoricalDataRequired(maPeriod, interval);
            return {
                startTime: config.startTime,
                endTime: config.endTime
            };
        }

        // Otherwise use manual limit (backward compatibility)
        const now = new Date();
        const endTime = this.formatDateTime(now);
        
        // Calculate start time based on interval and limit
        const compressionValue = this.getTimeframeMinutes(interval);
        const minutesNeeded = compressionValue * limit;
        
        const startDate = new Date(now.getTime() - minutesNeeded * 60 * 1000);
        const startTime = this.formatDateTime(startDate);

        return { startTime, endTime };
    }

    /**
     * Format date for XTS API (YYYY-MM-DD HH:mm:ss)
     */
    private formatDateTime(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Fetch candle data from broker
     * Now supports dynamic MA period calculation
     */
    public async fetchCandles(
        params: FetchCandlesParams,
        withDelay: boolean = false
    ): Promise<CandleData[]> {
        try {
            const { exchangeSegment, exchangeInstrumentID, interval, maPeriod } = params;
            
            // Generate cache key - include maPeriod if provided
            const cacheKey = maPeriod
                ? `ohlc_${exchangeSegment}_${exchangeInstrumentID}_${interval}_ma${maPeriod}`
                : `ohlc_${exchangeSegment}_${exchangeInstrumentID}_${interval}`;
            
            const cached = await getCache(cacheKey);
            
            if (cached) {
                logger.debug(`OHLC data found in cache for ${params.symbol}`);
                return JSON.parse(cached as string) as CandleData[];
            }

            // Fetch from broker with dynamic time range
            // If maPeriod provided, it calculates required days automatically
            const { startTime, endTime } = this.getTimeRange(interval, maPeriod);
            const compressionValue = this.getCompressionValue(interval);
            
            if (withDelay) {
                console.log('Waiting for 3 seconds... before fetching');
                await new Promise(resolve => setTimeout(resolve, 3000));
                console.log(`Fetching now...${startTime} to ${endTime}`);
            }

            console.log(`📥 [Historical Data] Fetching candles:`, {
                symbol: params.symbol,
                interval,
                maPeriod: maPeriod || 'N/A',
                startTime,
                endTime,
                compressionValue
            });

            const response = await marketDataService.getHistoricalData({
                exchangeSegment: this.convertExchangeSegment(exchangeSegment),
                exchangeInstrumentID,
                startTime,
                endTime,
                compressionValue: compressionValue
            });

            // Transform response to CandleData format
            const candles: CandleData[] = [];
            
            if (response && Array.isArray(response)) {
                // Response is already in CandleData format from market data service
                candles.push(...response);
            } else if (response && typeof response === 'object' && response !== null) {
                // Handle different response formats
                const responseObj = response as any;
                
                if (responseObj.result && responseObj.result.dataReponse) {
                    const data = JSON.parse(responseObj.result.dataReponse);
                    
                    if (Array.isArray(data)) {
                        for (const item of data) {
                            candles.push({
                                open: parseFloat(item.Open || item.open || 0),
                                high: parseFloat(item.High || item.high || 0),
                                low: parseFloat(item.Low || item.low || 0),
                                close: parseFloat(item.Close || item.close || 0),
                                volume: parseFloat(item.Volume || item.volume || 0),
                                timestamp: new Date(item.Timestamp || item.timestamp),
                            });
                        }
                    }
                }
            }

            // Cache for 1 minute
            await setCache(cacheKey, JSON.stringify(candles), 60);

            console.log(`✅ [Historical Data] Fetched ${candles.length} candles for ${params.symbol}`);
            logger.info(`Fetched ${candles.length} candles for ${params.symbol} (MA Period: ${maPeriod || 'manual'})`);
            return candles;
            
		} catch (error: unknown) {
			logger.error('Error fetching historical data:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Fetch latest candle only
     */
    public async fetchLatestCandle(params: FetchCandlesParams): Promise<CandleData> {
        // For latest candle, we don't need MA period calculation
        const candlesParams = { ...params, maPeriod: undefined };
        const candles = await this.fetchCandles({ ...candlesParams, interval: params.interval }, false);
        
        if (candles.length === 0) {
            throw new Error('No candle data available');
        }

        return candles[candles.length - 1];
    }

    /**
     * Update candles with new data (for real-time)
     */
    public updateCandles(
        existingCandles: CandleData[],
        newCandle: CandleData,
        maxLength: number = 500 // Increased from 100 to support larger MA periods
    ): CandleData[] {
        const updated = [...existingCandles];
        
        // Check if we should update last candle or add new one
        const lastCandle = updated[updated.length - 1];
        
        if (lastCandle && this.isSameTimeframe(lastCandle.timestamp, newCandle.timestamp)) {
            // Update existing candle
            updated[updated.length - 1] = newCandle;
        } else {
            // Add new candle
            updated.push(newCandle);
        }

        // Keep only last maxLength candles
        if (updated.length > maxLength) {
            return updated.slice(-maxLength);
        }

        return updated;
    }

    /**
     * Check if two timestamps are in same timeframe
     */
    private isSameTimeframe(time1: Date | string, time2: Date | string): boolean {
        const date1 = new Date(time1);
        const date2 = new Date(time2);
        
        // Same minute
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate() &&
            date1.getHours() === date2.getHours() &&
            date1.getMinutes() === date2.getMinutes()
        );
    }

    /**
     * Get historical data config without fetching
     * Useful for debugging or planning
     */
    public getHistoricalDataConfig(
        maPeriod: number,
        interval: string
    ): HistoricalDataConfig {
        return this.calculateHistoricalDataRequired(maPeriod, interval);
    }
}

export default new HistoricalDataService();
