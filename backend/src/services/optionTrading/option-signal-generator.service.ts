import marketDataService from '../market-data.service';
import trendAnalyzer from '../../strategies/trend-analyzer.service';
import optionTradingExecution from './option-trading-execution.service';
import logger from '../../utils/logger';
import type { IndicatorConfig } from '../../types/indicator.types';
import OptionStrategy from '../../models/OptionStrategy.model';
import User from '../../models/User.model';

interface OptionSignalResult {
	success: boolean;
	signal?: 'BUY' | 'SELL' | 'HOLD';
	entryPrice?: number;
	optionInstrument?: {
		exchangeInstrumentID: number;
		name: string;
		strikePrice: number;
		optionType: 'CE' | 'PE';
	};
	tradeResult?: Record<string, unknown>;
	error?: string;
}

class OptionSignalGeneratorService {
	/**
	 * Generate signal for option strategy
	 * Steps:
	 * 1. Fetch historical data for index using exchangeInstrumentID
	 * 2. Calculate indicators and determine trend
	 * 3. Generate signal (BUY/SELL/HOLD)
	 * 4. If signal is BUY/SELL, execute option trade
	 */
	async generateSignal(strategyId: string): Promise<OptionSignalResult> {
		try {
			// Get strategy
			const strategy = await OptionStrategy.findById(strategyId);
			if (!strategy) {
				return {
					success: false,
					error: 'Strategy not found',
				};
			}

			// Get user
			const user = await User.findById(strategy.userId);
			if (!user || !user.brokerCredentials?.isConnected) {
				return {
					success: false,
					error: 'User not found or broker not connected',
				};
			}

			logger.info(`Generating signal for option strategy: ${strategy.name}`);

			// Step 1: Fetch historical data for index
			// Use index exchangeInstrumentID (from index_instruments)
			const exchangeSegment = 2; // NSECM for indices
			const exchangeInstrumentID = strategy.exchangeInstrumentID;

			// Calculate how much historical data we need
			const maPeriod = this.getMaxIndicatorPeriod(strategy.config.indicators);
			const timeframeMinutes = this.getTimeframeMinutes(strategy.timeframe);
			const daysToFetch = Math.ceil((maPeriod * timeframeMinutes) / (6.25 * 60)) + 5; // Add buffer

			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - daysToFetch);

			logger.info(`Fetching historical data for index: ${strategy.symbol} (ID: ${exchangeInstrumentID})`);

			const historicalData = await marketDataService.getHistoricalData({
				exchangeSegment,
				exchangeInstrumentID,
				startTime: startDate.toISOString(),
				endTime: endDate.toISOString(),
				compressionValue: timeframeMinutes,
			});

			if (!historicalData || historicalData.length < 50) {
				return {
					success: false,
					error: 'Insufficient historical data for analysis',
				};
			}

			logger.info(`Fetched ${historicalData.length} candles for analysis`);

			// Step 2: Calculate indicators and determine trend
			const indicatorConfig: IndicatorConfig = strategy.config.indicators as IndicatorConfig;
			const trendState = await trendAnalyzer.analyze(historicalData, indicatorConfig);

			// Get current price (last candle close or live quote)
			const currentPrice = historicalData[historicalData.length - 1]?.close || 0;

			if (!currentPrice || currentPrice === 0) {
				// Try to get live quote
				const quotes = await marketDataService.getLiveQuotes([
					{ exchangeSegment, exchangeInstrumentID },
				]);
				const quote = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] as Record<string, unknown> : null;
				const livePrice = (quote?.LTP || quote?.ltp || 0) as number;
				if (livePrice > 0) {
					// Use live price
					const signal = trendState.recommendation as 'BUY' | 'SELL' | 'HOLD';

					if (signal === 'BUY' || signal === 'SELL') {
						return await this.executeOptionTrade(
							strategy,
							user,
							signal,
							livePrice,
						);
					}

					return {
						success: true,
						signal: 'HOLD',
						entryPrice: livePrice,
					};
				}
			}

			const signal = trendState.recommendation as 'BUY' | 'SELL' | 'HOLD';

			logger.info(`Signal generated: ${signal} at price ${currentPrice}`);

			// Step 3 & 4: If signal is BUY/SELL, execute option trade
			if (signal === 'BUY' || signal === 'SELL') {
				return await this.executeOptionTrade(
					strategy,
					user,
					signal,
					currentPrice,
				);
			}

			return {
				success: true,
				signal: 'HOLD',
				entryPrice: currentPrice,
			};
		} catch (error) {
			logger.error('Error generating option signal:', error);
			return {
				success: false,
				error: (error as Error).message || 'Unknown error',
			};
		}
	}

	/**
	 * Execute option trade after signal generation
	 */
	private async executeOptionTrade(
		strategy: any,
		user: any,
		signal: 'BUY' | 'SELL',
		entryPrice: number,
	): Promise<OptionSignalResult> {
		try {
			// Check if expiry is set
			if (!strategy.expiry) {
				return {
					success: false,
					error: 'Expiry not set for option strategy',
				};
			}

			// Calculate stop loss and take profit prices
			const slPoints = strategy.config.stopLossPoints || 0;
			const tpPoints = strategy.config.targetPoints || 0;

			let stopLossPrice = 0;
			let takeProfitPrice = 0;

			// For options, stop loss and take profit are in points
			// These will be applied to the option price, not the underlying
			if (slPoints > 0) {
				stopLossPrice = signal === 'BUY' ? entryPrice - slPoints : entryPrice + slPoints;
			}
			if (tpPoints > 0) {
				takeProfitPrice = signal === 'BUY' ? entryPrice + tpPoints : entryPrice - tpPoints;
			}

			// Execute option trade
			const tradeResult = await optionTradingExecution.executeOptionTrade({
				strategyId: strategy._id.toString(),
				userId: strategy.userId.toString(),
				baseSymbol: strategy.symbol,
				baseExchangeInstrumentID: strategy.exchangeInstrumentID,
				entryPrice,
				expiry: strategy.expiry,
				signal,
				quantity: strategy.config.quantity,
				productType: strategy.config.productType,
				orderType: strategy.config.orderType,
				clientID: user.brokerCredentials.clientId,
				stopLossPrice,
				takeProfitPrice,
			});

			if (tradeResult.success && tradeResult.optionInstrument) {
				return {
					success: true,
					signal,
					entryPrice,
					optionInstrument: tradeResult.optionInstrument,
					tradeResult: tradeResult.tradeRecord,
				};
			}

			return {
				success: false,
				signal,
				entryPrice,
				error: tradeResult.error || 'Failed to execute option trade',
			};
		} catch (error) {
			logger.error('Error executing option trade:', error);
			return {
				success: false,
				error: (error as Error).message || 'Unknown error',
			};
		}
	}

	/**
	 * Get maximum indicator period from config
	 */
	private getMaxIndicatorPeriod(indicators: any): number {
		let maxPeriod = 20; // Default

		if (indicators.sma?.period) maxPeriod = Math.max(maxPeriod, indicators.sma.period);
		if (indicators.ema?.period) maxPeriod = Math.max(maxPeriod, indicators.ema.period);
		if (indicators.ema?.slow) maxPeriod = Math.max(maxPeriod, indicators.ema.slow);
		if (indicators.rsi?.period) maxPeriod = Math.max(maxPeriod, indicators.rsi.period);
		if (indicators.macd?.slow) maxPeriod = Math.max(maxPeriod, indicators.macd.slow);
		if (indicators.bollingerBands?.period) maxPeriod = Math.max(maxPeriod, indicators.bollingerBands.period);
		if (indicators.atr?.period) maxPeriod = Math.max(maxPeriod, indicators.atr.period);
		if (indicators.stochastic?.period) maxPeriod = Math.max(maxPeriod, indicators.stochastic.period);
		if (indicators.adx?.period) maxPeriod = Math.max(maxPeriod, indicators.adx.period);
		if (indicators.williamsR?.period) maxPeriod = Math.max(maxPeriod, indicators.williamsR.period);
		if (indicators.cci?.period) maxPeriod = Math.max(maxPeriod, indicators.cci.period);
		if (indicators.wma?.period) maxPeriod = Math.max(maxPeriod, indicators.wma.period);
		if (indicators.lsma?.period) maxPeriod = Math.max(maxPeriod, indicators.lsma.period);

		return maxPeriod;
	}

	/**
	 * Convert timeframe string to minutes
	 */
	private getTimeframeMinutes(timeframe: string): number {
		const timeframeMap: Record<string, number> = {
			'1min': 1,
			'2min': 2,
			'3min': 3,
			'5min': 5,
			'10min': 10,
			'15min': 15,
			'30min': 30,
			'60min': 60,
			'1hour': 60,
			'1day': 1440,
		};

		return timeframeMap[timeframe] || 15;
	}
}

export default new OptionSignalGeneratorService();

