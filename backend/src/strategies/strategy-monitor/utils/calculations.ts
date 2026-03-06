import historicalDataService from "../../../services/historical-data.service";
import logger from "../../../utils/logger";

/**
 * Calculate delay until next timeframe interval
 */
export function getDelay(timeframe: string): number {
	const now = new Date();
	const seconds = now.getSeconds();
	const milliseconds = now.getMilliseconds();
	let minutes = now.getMinutes();
	const timeFrameInMinutes = historicalDataService.getTimeframeMinutes(timeframe);

	// Calculate milliseconds remaining in the current second
	const millisecondsInCurrentSecond = 1000 - milliseconds;

	// Calculate milliseconds remaining in the current minute (excluding current second)
	const millisecondsInCurrentMinute = (59 - seconds) * 1000;

	// Total milliseconds until the next minute
	let totalMilliseconds = millisecondsInCurrentSecond + millisecondsInCurrentMinute;

	if (timeframe !== '1min') {
		minutes = minutes + 1;
		const minutesTillNextInterval = (timeFrameInMinutes - (minutes % timeFrameInMinutes));
		console.log(`Timeframe: ${timeFrameInMinutes} -- Wait for ${minutesTillNextInterval} minutes to next interval`);
		totalMilliseconds += minutesTillNextInterval * 60 * 1000;
	}

	return totalMilliseconds;
}

/**
 * Get maximum indicator period from config
 */
export function getMAPeriod(config: any): number {
	if (!config) {
		logger.error("No configuration found for the strategy");
		throw new Error("No configuration found for the strategy");
	}
	let period = 0;

	// Simple Moving Average
	if (config.sma) {
		const smaPeriod = config.sma.period || 10;
		period = smaPeriod > period ? smaPeriod : period;
	}

	// Exponential Moving Average
	if (config.ema) {
		// Check if single standalone EMA (period) or crossover (fast/slow)
		if (config.ema.period !== undefined) {
			// Single standalone EMA
			const emaPeriod = config.ema.period || 10;
			period = emaPeriod > period ? emaPeriod : period;
		} else if (config.ema.fast !== undefined || config.ema.slow !== undefined) {
			// EMA Crossover - use the larger of fast or slow
			const fastPeriod = config.ema.fast || 0;
			const slowPeriod = config.ema.slow || 0;
			const emaPeriod = Math.max(fastPeriod, slowPeriod) || 10;
			period = emaPeriod > period ? emaPeriod : period;
		}
	}

	// Relative Strength Index
	if (config.rsi) {
		const rsiPeriod = config.rsi.period || 14;
		period = rsiPeriod > period ? rsiPeriod : period;
	}

	// Bollinger Bands - Volatility indicator
	if (config.bollingerBands) {
		const bbPeriod = config.bollingerBands.period || 20;
		period = bbPeriod > period ? bbPeriod : period;
	}

	// Average True Range - Volatility measure
	if (config.atr) {
		const atrPeriod = config.atr.period || 14;
		period = atrPeriod > period ? atrPeriod : period;
	}

	// Stochastic Oscillator
	if (config.stochastic) {
		const stochasticPeriod = config.stochastic.period || 14;
		period = stochasticPeriod > period ? stochasticPeriod : period;
	}

	// Average Directional Index - Trend strength
	if (config.adx) {
		const adxPeriod = config.adx.period || 14;
		period = adxPeriod > period ? adxPeriod : period;
	}

	// Weighted Moving Average
	if (config.wma) {
		const wmaPeriod = config.wma.period || 10;
		period = wmaPeriod > period ? wmaPeriod : period;
	}

	// Williams %R - Momentum
	if (config.williamsR) {
		const williamsRPeriod = config.williamsR.period || 14;
		period = williamsRPeriod > period ? williamsRPeriod : period;
	}

	// Commodity Channel Index
	if (config.cci) {
		const cciPeriod = config.cci.period || 20;
		period = cciPeriod > period ? cciPeriod : period;
	}

	// Money Flow Index
	if (config.mfi) {
		const mfiPeriod = config.mfi.period || 14;
		period = mfiPeriod > period ? mfiPeriod : period;
	}

	// Least Squares Moving Average
	if (config.lsma) {
		const lsmaPeriod = config.lsma.period || 25;
		period = lsmaPeriod > period ? lsmaPeriod : period;
	}

	if (period == 0) {
		period = 10; // Default period
	}

	return period;
}

