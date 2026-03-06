import marketDataService from './market-data.service';
import User from '../models/User.model';
import Strategy, { IStrategy } from '../models/Strategy.model';
import indicatorService from '../indicators';
import { CandleData } from '../indicators/types';
import logger from '../utils/logger';
import XtsInstrument from '../models/XtsInstrument.model';
import dealerApiService from './dealer-api.service';

interface StrategyCheckResult {
    shouldExecute: boolean;
    action: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
    currentPrice: number;
    stopLossHit: boolean;
    takeProfitHit: boolean;
    breakoutHit: boolean;
}

class StrategyExecutionService {
    /**
     * Get exchange segment number from string
     */
    private getExchangeSegmentNumber(exchangeSegment: string): number {
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
     * Check if strategy should execute based on market data
     */
    public async checkStrategyExecution(strategyId: string, userId: string): Promise<StrategyCheckResult> {
        try {
            // Get strategy from database
            const strategy = await Strategy.findById(strategyId);
            if (!strategy) {
                throw new Error('Strategy not found');
            }

            // Get user's market data token
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Resolve instrument
            const exchangeSegmentNum = this.getExchangeSegmentNumber(strategy.exchangeSegment);
            const exchangeInstrumentID = await this.resolveExchangeInstrumentID(strategy.symbol, exchangeSegmentNum, strategy.exchangeInstrumentID);

            // Prefer live LTP for current price to reduce latency
            const quotes = await marketDataService.getLiveQuotes([
                { exchangeSegment: exchangeSegmentNum, exchangeInstrumentID }
            ]);
            const quote = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] as any : null;

            // Get historical data for indicator calculations
            const historicalData = await marketDataService.getHistoricalData({
                exchangeSegment: exchangeSegmentNum,
                exchangeInstrumentID,
                startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                endTime: new Date().toISOString(),
                compressionValue: this.getCompressionValue(strategy.timeframe || '15min')
            });

            if (!historicalData || historicalData.length < 50) {
                throw new Error('Insufficient historical data for analysis');
            }

            const currentPrice = quote?.LTP || quote?.ltp || historicalData[historicalData.length - 1].close;
            const currentCandle = historicalData[historicalData.length - 1];
            const previousCandle = historicalData[historicalData.length - 2];

            // Intraday trading window enforcement (pre-check)
            const cfg: any = strategy.config as any;
            if (cfg.intradayEnabled && cfg.tradingWindowEnabled) {
                const inWindow = this.isWithinTradingWindow(
                    cfg.tradingStartTime || '09:15',
                    cfg.tradingEndTime || '15:30'
                );
                if (!inWindow) {
                    return {
                        shouldExecute: false,
                        action: 'HOLD',
                        reason: 'Outside trading window',
                        currentPrice: 0,
                        stopLossHit: false,
                        takeProfitHit: false,
                        breakoutHit: false
                    };
                }
            }

            // Calculate indicators based on strategy configuration
            const indicators = this.calculateIndicators(historicalData, strategy.config.indicators);

            logger.info(`Checking strategy execution for ${strategy.symbol}`, {
                strategyId,
                userId,
                currentPrice,
                indicators: Object.keys(indicators),
                strategyConfig: strategy.config
            });

            // Check stop loss
            const stopLossHit = this.checkStopLoss(strategy, currentPrice);
            if (stopLossHit) {
                return {
                    shouldExecute: true,
                    action: 'SELL',
                    reason: 'Stop Loss Hit',
                    currentPrice,
                    stopLossHit: true,
                    takeProfitHit: false,
                    breakoutHit: false
                };
            }

            // Check take profit
            const takeProfitHit = this.checkTakeProfit(strategy, currentPrice);
            if (takeProfitHit) {
                return {
                    shouldExecute: true,
                    action: 'SELL',
                    reason: 'Take Profit Hit',
                    currentPrice,
                    stopLossHit: false,
                    takeProfitHit: true,
                    breakoutHit: false
                };
            }

            // Check indicator-based entry conditions with consensus and entry mode
            const consensus = this.evaluateConsensus(strategy as any, indicators, currentCandle, previousCandle);
            if (consensus.hasSignal) {
                if ((strategy.config as any).entryMode === 'highLowBreak') {
                    // High-Low Break mode is handled by the strategy monitor service
                    // This API endpoint returns status only - actual watcher is managed by monitor loop
                    return {
                        shouldExecute: false,
                        action: 'HOLD',
                        reason: 'High/Low Break mode - Watcher managed by monitor service',
                        currentPrice,
                        stopLossHit: false,
                        takeProfitHit: false,
                        breakoutHit: false
                    };
                }

                return {
                    shouldExecute: true,
                    action: consensus.action,
                    reason: consensus.reason,
                    currentPrice,
                    stopLossHit: false,
                    takeProfitHit: false,
                    breakoutHit: false
                };
            }

            return {
                shouldExecute: false,
                action: 'HOLD',
                reason: 'No conditions met',
                currentPrice,
                stopLossHit: false,
                takeProfitHit: false,
                breakoutHit: false
            };

		} catch (error: unknown) {
            logger.error('Error checking strategy execution:', error);
            throw error;
        }
    }

    /**
     * Execute strategy action (place order)
     */
    public async executeStrategyAction(strategyId: string, userId: string, action: 'BUY' | 'SELL', quantity: number): Promise<Record<string, unknown>> {
        try {
            const strategy = await Strategy.findById(strategyId);
            if (!strategy) {
                throw new Error('Strategy not found');
            }

            const user = await User.findById(userId);
            if (!user || !user.brokerCredentials?.isConnected) {
                throw new Error('User not connected to broker');
            }

            // Get current price via live quotes
            const exchangeSegmentNum = this.getExchangeSegmentNumber(strategy.exchangeSegment);
            const exchangeInstrumentID = await this.resolveExchangeInstrumentID(strategy.symbol, exchangeSegmentNum, strategy.exchangeInstrumentID);
            const quotes = await marketDataService.getLiveQuotes([
                { exchangeSegment: exchangeSegmentNum, exchangeInstrumentID }
            ]);
            const q = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] as any : null;
            const currentPrice = q?.LTP || q?.ltp || 0;

            // Prepare order parameters (derived exchange segment code)
            const segmentCode =
                exchangeSegmentNum === 1 ? 'NSECM' :
                exchangeSegmentNum === 2 ? 'NSEFO' :
                exchangeSegmentNum === 3 ? 'NSECD' :
                exchangeSegmentNum === 11 ? 'BSECM' :
                exchangeSegmentNum === 12 ? 'BSEFO' :
                'NSECM';

            const orderParams = {
                exchangeSegment: segmentCode,
                exchangeInstrumentID,
                productType: strategy.config.productType || 'MIS',
                orderType: strategy.config.orderType || 'MARKET',
                orderSide: action,
                orderQuantity: quantity,
                limitPrice: 0,
                stopPrice: 0,
                clientID: user.brokerCredentials.clientId
            };

            logger.info(`Executing strategy action: ${action}`, {
                strategyId,
                userId,
                symbol: strategy.symbol,
                quantity,
                currentPrice,
                orderParams
            });

            // Place order through dealer API
            const orderResult = await dealerApiService.placeOrder({
                exchangeSegment: segmentCode,
                exchangeInstrumentID,
                productType: strategy.config.productType || 'MIS',
                orderType: strategy.config.orderType || 'MARKET',
                orderSide: action,
                timeInForce: 'DAY',
                disclosedQuantity: 0,
                orderQuantity: quantity.toString(),
                limitPrice: strategy.config.orderType === 'LIMIT' ? currentPrice : 0,
                orderUniqueIdentifier: `${strategyId.toString().slice(-8)}${Date.now().toString().slice(-12)}`, // Max 20 chars: last 8 of strategyId + last 12 of timestamp
                stopPrice: 0,
                clientID: user.brokerCredentials.clientId || ''
            });

            // Calculate stop loss and take profit prices (in points, not percentage)
            // Only set if enabled (points > 0)
            const cfg = strategy.config as any;
            const slPoints = cfg.stopLossPoints || 0;
            const tpPoints = cfg.targetPoints || 0;
            
            let stopLossPrice = 0;
            let takeProfitPrice = 0;
            
            // Only calculate prices if stoploss/target are enabled (points > 0)
            if (action === 'BUY') {
                // For BUY: stop loss below entry, take profit above entry
                stopLossPrice = slPoints > 0 ? currentPrice - slPoints : 0;
                takeProfitPrice = tpPoints > 0 ? currentPrice + tpPoints : 0;
            } else {
                // For SELL: stop loss above entry, take profit below entry
                stopLossPrice = slPoints > 0 ? currentPrice + slPoints : 0;
                takeProfitPrice = tpPoints > 0 ? currentPrice - tpPoints : 0;
            }

            // Update strategy with new position
            strategy.currentPosition = {
                side: action,
                quantity,
                entryPrice: currentPrice,
                entryTime: new Date(),
                currentPrice: currentPrice,
                unrealizedPnL: 0,
                stopLossPrice,
                takeProfitPrice
            };

            await strategy.save();

            logger.info(`Strategy action executed successfully: ${action}`, {
                strategyId,
                userId,
                orderResult
            });

            return orderResult;

		} catch (error: unknown) {
            logger.error('Error executing strategy action:', error);
            throw error;
        }
    }

    /**
     * Check stop loss condition
     * Only checks if stoploss is enabled (stopLossPoints > 0)
     */
    private checkStopLoss(strategy: IStrategy, currentPrice: number): boolean {
        if (!strategy.currentPosition) {
            return false;
        }

        const cfg = strategy.config as any;
        const slPoints = cfg.stopLossPoints;
        
        // Only check stoploss if it's enabled (points > 0)
        if (!slPoints || slPoints <= 0) {
            return false;
        }

        const entryPrice = strategy.currentPosition.entryPrice;
        const stopLossPrice = strategy.currentPosition.side === 'BUY' 
            ? entryPrice - slPoints 
            : entryPrice + slPoints;

        if (strategy.currentPosition.side === 'BUY' && currentPrice <= stopLossPrice) {
            return true;
        }

        if (strategy.currentPosition.side === 'SELL' && currentPrice >= stopLossPrice) {
            return true;
        }

        return false;
    }

    /**
     * Check take profit condition
     * Only checks if target is enabled (targetPoints > 0)
     */
    private checkTakeProfit(strategy: IStrategy, currentPrice: number): boolean {
        if (!strategy.currentPosition) {
            return false;
        }

        const cfg = strategy.config as any;
        const tpPoints = cfg.targetPoints;
        
        // Only check take profit if it's enabled (points > 0)
        if (!tpPoints || tpPoints <= 0) {
            return false;
        }

        const entryPrice = strategy.currentPosition.entryPrice;
        const takeProfitPrice = strategy.currentPosition.side === 'BUY' 
            ? entryPrice + tpPoints 
            : entryPrice - tpPoints;

        if (strategy.currentPosition.side === 'BUY' && currentPrice >= takeProfitPrice) {
            return true;
        }

        if (strategy.currentPosition.side === 'SELL' && currentPrice <= takeProfitPrice) {
            return true;
        }

        return false;
    }

    /**
     * Calculate indicators based on strategy configuration
     */
    private calculateIndicators(historicalData: any[], indicatorConfig: any): Record<string, any> {
        const indicators: Record<string, any> = {};

        try {
            // Convert historical data to the format expected by indicators
            const candleData: CandleData[] = historicalData.map(candle => ({
                timestamp: candle.timestamp,
                open: Number(candle.open),
                high: Number(candle.high),
                low: Number(candle.low),
                close: Number(candle.close),
                volume: Number(candle.volume) || 0
            }));

            // Calculate SMA
            if (indicatorConfig.sma?.period) {
                indicators.sma = indicatorService.SMA(candleData, indicatorConfig.sma.period);
            }

            // Calculate EMA
            if (indicatorConfig.ema?.period) {
                indicators.ema = indicatorService.EMA(candleData, indicatorConfig.ema.period);
            }

            // Calculate RSI
            if (indicatorConfig.rsi?.period) {
                indicators.rsi = indicatorService.RSI(
                    candleData, 
                    indicatorConfig.rsi.period,
                    indicatorConfig.rsi.overbought || 70,
                    indicatorConfig.rsi.oversold || 30
                );
            }

            // Calculate MACD
            if (indicatorConfig.macd) {
                indicators.macd = indicatorService.MACD(
                    candleData,
                    indicatorConfig.macd.fast || 12,
                    indicatorConfig.macd.slow || 26,
                    indicatorConfig.macd.signal || 9
                );
            }

            // Calculate Bollinger Bands
            if (indicatorConfig.bollingerBands?.period) {
                indicators.bollingerBands = indicatorService.BollingerBands(
                    candleData,
                    indicatorConfig.bollingerBands.period,
                    indicatorConfig.bollingerBands.stdDev || 2
                );
            }

            // Calculate ATR
            if (indicatorConfig.atr?.period) {
                indicators.atr = indicatorService.ATR(candleData, indicatorConfig.atr.period);
            }

            return indicators;
        } catch (error) {
            logger.error('Error calculating indicators:', error);
            return {};
        }
    }

    /**
     * Check indicator-based entry conditions
     */
    private evaluateConsensus(
        strategy: any,
        indicators: Record<string, any>,
        currentCandle: any,
        _previousCandle: any
    ): { hasSignal: boolean; action: 'BUY' | 'SELL'; reason: string } {
        const votes: Array<'BUY' | 'SELL'> = [];
        const reasons: string[] = [];

        // RSI vote
        if (indicators.rsi && Array.isArray(indicators.rsi) && indicators.rsi.length > 0) {
            const currentRSI = indicators.rsi[indicators.rsi.length - 1];
            if (currentRSI.oversold) { votes.push('BUY'); reasons.push('RSI Oversold'); }
            if (currentRSI.overbought) { votes.push('SELL'); reasons.push('RSI Overbought'); }
        }

        // MACD vote
        if (indicators.macd && Array.isArray(indicators.macd) && indicators.macd.length > 1) {
            const cur = indicators.macd[indicators.macd.length - 1];
            const prev = indicators.macd[indicators.macd.length - 2];
            if (prev.MACD <= prev.signal && cur.MACD > cur.signal) { votes.push('BUY'); reasons.push('MACD Bullish'); }
            if (prev.MACD >= prev.signal && cur.MACD < cur.signal) { votes.push('SELL'); reasons.push('MACD Bearish'); }
        }

        // SMA/EMA vote
        if (indicators.sma && indicators.ema && Array.isArray(indicators.sma) && Array.isArray(indicators.ema) && indicators.sma.length > 0 && indicators.ema.length > 0) {
            const sma = indicators.sma[indicators.sma.length - 1];
            const ema = indicators.ema[indicators.ema.length - 1];
            const price = Number(currentCandle.close);
            if (price > sma.value && price > ema.value) { votes.push('BUY'); reasons.push('Price>MA'); }
            if (price < sma.value && price < ema.value) { votes.push('SELL'); reasons.push('Price<MA'); }
        }

        // BB vote
        if (indicators.bollingerBands && Array.isArray(indicators.bollingerBands) && indicators.bollingerBands.length > 0) {
            const bb = indicators.bollingerBands[indicators.bollingerBands.length - 1];
            if (Number(currentCandle.low) <= bb.lower) { votes.push('BUY'); reasons.push('BB Lower'); }
            if (Number(currentCandle.high) >= bb.upper) { votes.push('SELL'); reasons.push('BB Upper'); }
        }

        // ATR breakout vote
        if (indicators.atr && Array.isArray(indicators.atr) && indicators.atr.length > 0) {
            const atr = indicators.atr[indicators.atr.length - 1];
            const range = Number(currentCandle.high) - Number(currentCandle.low);
            if (range > atr.value * 1.5) {
                if (Number(currentCandle.close) > Number(currentCandle.open)) { votes.push('BUY'); reasons.push('ATR Bull Breakout'); }
                else { votes.push('SELL'); reasons.push('ATR Bear Breakout'); }
            }
        }

        if (votes.length === 0) return { hasSignal: false, action: 'BUY', reason: 'No signals' };

        const buyVotes = votes.filter(v => v === 'BUY').length;
        const sellVotes = votes.filter(v => v === 'SELL').length;
        const mode = (strategy.config?.consensus === 'majority') ? 'majority' : 'all';

        if (mode === 'all') {
            if (buyVotes === votes.length) return { hasSignal: true, action: 'BUY', reason: reasons.join(', ') };
            if (sellVotes === votes.length) return { hasSignal: true, action: 'SELL', reason: reasons.join(', ') };
            return { hasSignal: false, action: 'BUY', reason: 'No ALL consensus' };
        } else {
            if (buyVotes > sellVotes) return { hasSignal: true, action: 'BUY', reason: reasons.join(', ') };
            if (sellVotes > buyVotes) return { hasSignal: true, action: 'SELL', reason: reasons.join(', ') };
            return { hasSignal: false, action: 'BUY', reason: 'Tie votes' };
        }
    }

    // Removed duplicate watcher implementation - High-Low Break watcher is handled by strategy-monitor service
    // This ensures single source of truth and prevents duplicate subscriptions


    private isWithinTradingWindow(startHHmm: string, endHHmm: string): boolean {
        const now = new Date();
        const [sh, sm] = startHHmm.split(':').map(Number);
        const [eh, em] = endHHmm.split(':').map(Number);
        const start = new Date(now);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(now);
        end.setHours(eh, em, 0, 0);
        return now >= start && now <= end;
    }


    /**
     * Resolve exchange instrument ID via DB lookup (fallback to provided value)
     */
    private async resolveExchangeInstrumentID(symbol: string, exchangeSegment: number, fallback?: number): Promise<number> {
        if (fallback && fallback > 0) return fallback;
        try {
            const doc = await XtsInstrument.findOne({ name: symbol, exchangeSegment }).select('exchangeInstrumentID').lean();
            if (doc && (doc as any).exchangeInstrumentID) return (doc as any).exchangeInstrumentID;
        } catch (e) {
            logger.warn('Failed to resolve exchangeInstrumentID from DB, using fallback', { symbol, exchangeSegment });
        }
        return fallback || 0;
    }

    /**
     * Convert interval to compression value for XTS API
     */
    private getCompressionValue(interval: string): number {
        const map: Record<string, number> = {
            '1min': 1,
            '5min': 5,
            '15min': 15,
            '30min': 30,
            '60min': 60,
            '1hour': 60,
            '1day': 1440
        };
        return map[interval] || 15;
    }
}

export default new StrategyExecutionService();
