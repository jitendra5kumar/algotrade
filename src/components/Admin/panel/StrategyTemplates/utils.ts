export function getDefaultParams(indicator: string): Record<string, any> {
	const defaults: Record<string, any> = {
		sma: { period: 20 },
		ema: { fast: 12, slow: 26 },
		rsi: { period: 14, overbought: 70, oversold: 30 },
		macd: { fast: 12, slow: 26, signal: 9 },
		bollingerBands: { period: 20, stdDev: 2 },
		atr: { period: 14 },
		stochastic: { period: 14, signalPeriod: 3 },
		adx: { period: 14 },
		williamsR: { period: 14 },
		cci: { period: 20 },
		psar: { step: 0.02, max: 0.2 },
		vwap: true,
		wma: { period: 20 },
		obv: true,
		mfi: { period: 14 },
		supertrend: { period: 10, multiplier: 3 },
		lsma: { period: 10 },
		halftrend: { amplitude: 2, channelDeviation: 2 },
		orb: { openingRangeMinutes: 15, breakoutThreshold: 0.01 },
	};
	return defaults[indicator] || {};
}

