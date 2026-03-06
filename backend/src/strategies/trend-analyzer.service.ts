import IndicatorService from "../indicators";
import type { CandleData } from "../indicators/types";
import type {
	ADXValue,
	BollingerBandValue,
	EMAIndicator,
	IndicatorConfig,
	IndicatorValue,
	MACDValue,
	StochasticValue,
} from "../types/indicator.types";
import type { TrendState } from "../types/strategy.types";
import logger from "../utils/logger";

// Type for indicators object used in helper functions
type IndicatorsForValidation = {
	sma?: IndicatorValue[];
	ema?: EMAIndicator;
	rsi?: IndicatorValue[];
	macd?: MACDValue[];
	bollingerBands?: BollingerBandValue[];
	atr?: IndicatorValue[];
	stochastic?: StochasticValue[];
	adx?: ADXValue[];
	williamsR?: IndicatorValue[];
	cci?: IndicatorValue[];
	psar?: IndicatorValue[];
	vwap?: IndicatorValue[];
	wma?: IndicatorValue[];
	obv?: IndicatorValue[];
	mfi?: IndicatorValue[];
	lsma?: IndicatorValue[];
};

/**
 * TrendAnalyzer - Technical indicators ke through market trend analyze karta hai
 * Bullish, Bearish ya Sideways trend determine karta hai
 */
class TrendAnalyzer {
	/**
	 * Main analyze function - sab indicators calculate karke trend nikalta hai
	 */
	public async analyze(
		data: CandleData[],
		indicatorConfig: IndicatorConfig,
	): Promise<TrendState> {
		try {
			// Minimum 50 candles zaruri hain accurate analysis ke liye
			// if (data.length < 50) {
			// 	throw new Error(
			// 		"Insufficient data for trend analysis. Need at least 50 candles",
			// 	);
			// }

			// Sab indicators calculate karo jo config mein enabled hain
			const indicators = this.calculateAllIndicators(data, indicatorConfig);

			// Trend direction nikalo (Bullish/Bearish/Sideways)
			const direction = this.determineTrend(data, indicators);

			// Direction ke basis par simple recommendation
			const recommendation =
				direction === "UPTREND"
					? "BUY"
					: direction === "DOWNTREND"
						? "SELL"
						: "HOLD";

			logger.debug(
				`Trend analysis complete: Direction=${direction}`,
			);

			return {
				direction,
				indicators,
				recommendation,
			};
		} catch (error: unknown) {
			logger.error("Trend analysis mein error:", error);
			throw error;
		}
	}

	/**
	 * Sab enabled indicators ko calculate karo
	 */
	private calculateAllIndicators(
		data: CandleData[],
		config: IndicatorConfig,
	): Record<string, unknown> {
		console.log("Calculating indicators...");
		console.log('Config:', config);
		const indicators: Record<string, unknown> = {};

		// Simple Moving Average
		if (config.sma) {
			indicators.sma = IndicatorService.SMA(data, config.sma.period);
		}

		// Exponential Moving Average
		if (config.ema) {
			// Check if single standalone EMA (period) or crossover (fast/slow)
			if (config.ema.period !== undefined) {
				// Single standalone EMA
				indicators.ema = {
					value: IndicatorService.EMA(data, config.ema.period),
				};
			} else if (config.ema.fast !== undefined && config.ema.slow !== undefined) {
				// EMA Crossover (fast and slow)
				indicators.ema = {
					fast: IndicatorService.EMA(data, config.ema.fast),
					slow: IndicatorService.EMA(data, config.ema.slow),
				};
			}
		}

		// Relative Strength Index
		if (config.rsi) {
			indicators.rsi = IndicatorService.RSI(
				data,
				config.rsi.period,
				config.rsi.overbought || 70,
				config.rsi.oversold || 30,
			);
		}

		// MACD - Momentum indicator
		if (config.macd) {
			indicators.macd = IndicatorService.MACD(
				data,
				config.macd.fast || 12,
				config.macd.slow || 26,
				config.macd.signal || 9,
			);
		}

		// Bollinger Bands - Volatility indicator
		if (config.bollingerBands) {
			indicators.bollingerBands = IndicatorService.BollingerBands(
				data,
				config.bollingerBands.period || 20,
				config.bollingerBands.stdDev || 2,
			);
		}

		// Average True Range - Volatility measure
		if (config.atr) {
			indicators.atr = IndicatorService.ATR(data, config.atr.period || 14);
		}

		// Stochastic Oscillator
		if (config.stochastic) {
			indicators.stochastic = IndicatorService.Stochastic(
				data,
				config.stochastic.period || 14,
				config.stochastic.signalPeriod || 3,
			);
		}

		// Average Directional Index - Trend strength
		if (config.adx) {
			indicators.adx = IndicatorService.ADX(data, config.adx.period || 14);
		}

		// Volume Weighted Average Price
		if (config.vwap) {
			indicators.vwap = IndicatorService.VWAP(data);
		}

		// Weighted Moving Average
		if (config.wma) {
			indicators.wma = IndicatorService.WMA(data, config.wma.period);
		}

		// Williams %R - Momentum
		if (config.williamsR) {
			indicators.williamsR = IndicatorService.WilliamsR(
				data,
				config.williamsR.period || 14,
			);
		}

		// Commodity Channel Index
		if (config.cci) {
			indicators.cci = IndicatorService.CCI(data, config.cci.period || 20);
		}

		// Parabolic SAR - Trend reversal points
		if (config.psar) {
			indicators.psar = IndicatorService.PSAR(
				data,
				config.psar.step || 0.02,
				config.psar.max || 0.2,
			);
		}

		// On-Balance Volume
		if (config.obv) {
			indicators.obv = IndicatorService.OBV(data);
		}

		// Money Flow Index
		if (config.mfi) {
			indicators.mfi = IndicatorService.MFI(data, config.mfi.period || 14);
		}

		// Least Squares Moving Average
		if (config.lsma) {
			const lsmaPeriod = config.lsma.period || 25;
			if (lsmaPeriod > 0 && data.length >= lsmaPeriod) {
				indicators.lsma = IndicatorService.LSMA(data, lsmaPeriod).map(
					({ value, timestamp }) => ({
						value,
						timestamp: timestamp
							? new Date(timestamp).toISOString()
							: undefined,
					}),
				);
			}
		}

		return indicators;
	}

	/**
	 * Trend direction nikalo - Bullish / Bearish / Sideways
	 * 
	 * Logic:
	 * - Ek indicator use karo → Direct usi ka signal nikalo
	 * - 2+ indicators use karo → Sabka consensus nikalo
	 *   - Sab BUY → UPTREND
	 *   - Sab SELL → DOWNTREND
	 *   - Mixed → SIDEWAYS
	 */
	private determineTrend(
		data: CandleData[],
		indicators: {
			sma?: IndicatorValue[];
			ema?: EMAIndicator;
			rsi?: IndicatorValue[];
			macd?: MACDValue[];
			bollingerBands?: BollingerBandValue[];
			atr?: IndicatorValue[];
			stochastic?: StochasticValue[];
			adx?: ADXValue[];
			williamsR?: IndicatorValue[];
			cci?: IndicatorValue[];
			psar?: IndicatorValue[];
			vwap?: IndicatorValue[];
			wma?: IndicatorValue[];
			obv?: IndicatorValue[];
			mfi?: IndicatorValue[];
			lsma?: IndicatorValue[];
		},
	): TrendState["direction"] {
		const latestPrice = data[data.length - 1].close;
		console.log('Determine trend')
		console.log('indicators',indicators.lsma)
		// ==================== SIGNALS ARRAY ====================
		// Har indicator ka signal store karo (BUY ya SELL)
		const signals: ("BUY" | "SELL" | null)[] = [];

		// ==================== EMA TREND ====================
		if (this.hasValidEMA(indicators)) {
			const emaData = indicators.ema!;
			
			// Check if single standalone EMA
			if (emaData.value && emaData.value.length > 0) {
				// Single standalone EMA: Price vs EMA
				const latestEMA = emaData.value[emaData.value.length - 1].value;
				if (latestPrice > latestEMA) {
					signals.push("BUY");
				} else if (latestPrice < latestEMA) {
					signals.push("SELL");
				} else {
					signals.push(null);
				}
			}
			// Check if EMA crossover (fast and slow)
			else if (emaData.fast && emaData.slow && 
			         emaData.fast.length > 0 && emaData.slow.length > 0) {
				// EMA Crossover: Fast EMA vs Slow EMA
				const latestFast = emaData.fast[emaData.fast.length - 1].value;
				const latestSlow = emaData.slow[emaData.slow.length - 1].value;
				
				// Previous values for crossover detection
				const prevFast = emaData.fast.length > 1 
					? emaData.fast[emaData.fast.length - 2].value 
					: latestFast;
				const prevSlow = emaData.slow.length > 1 
					? emaData.slow[emaData.slow.length - 2].value 
					: latestSlow;
				
				// Bullish crossover: Fast crosses above Slow
				if (prevFast <= prevSlow && latestFast > latestSlow) {
					signals.push("BUY");
				}
				// Bearish crossover: Fast crosses below Slow
				else if (prevFast >= prevSlow && latestFast < latestSlow) {
					signals.push("SELL");
				}
				// Already crossed - maintain trend
				else if (latestFast > latestSlow) {
					signals.push("BUY");
				} else if (latestFast < latestSlow) {
					signals.push("SELL");
				} else {
					signals.push(null);
				}
			} else {
				signals.push(null);
			}
		}

		// ==================== SMA CHECK ====================
		if (this.hasValidSMA(indicators)) {
			const latestSMA = indicators.sma![indicators.sma!.length - 1].value;
			if (latestPrice > latestSMA) {
				signals.push("BUY");
			} else {
				signals.push("SELL");
			}
		}

		// ==================== RSI MOMENTUM ====================
		if (this.hasValidRSI(indicators)) {
			const latestRSI = indicators.rsi![indicators.rsi!.length - 1].value;
			if (latestRSI > 50 && latestRSI < 70) {
				signals.push("BUY");
			} else if (latestRSI < 50 && latestRSI > 30) {
				signals.push("SELL");
			} else {
				signals.push(null); // Overbought/Oversold - neutral
			}
		}

		// ==================== MACD HISTOGRAM ====================
		if (this.hasValidMACD(indicators)) {
			const latestMACD = indicators.macd![indicators.macd!.length - 1];
			if (latestMACD.histogram > 0) {
				signals.push("BUY");
			} else {
				signals.push("SELL");
			}
		}

		// ==================== BOLLINGER BANDS ====================
		if (this.hasValidBollingerBands(indicators)) {
			const latestBB =
				indicators.bollingerBands![
					indicators.bollingerBands!.length - 1
				];
			if (latestPrice > latestBB.upper) {
				signals.push("BUY");
			} else if (latestPrice < latestBB.lower) {
				signals.push("SELL");
			} else {
				signals.push(null);
			}
		}

		// ==================== STOCHASTIC OSCILLATOR ====================
		if (this.hasValidStochastic(indicators)) {
			const latest = indicators.stochastic![
				indicators.stochastic!.length - 1
			];
			if (latest.k > latest.d && latest.k < 80) {
				signals.push("BUY");
			} else if (latest.k < latest.d && latest.k > 20) {
				signals.push("SELL");
			} else {
				signals.push(null); // Neutral zone
			}
		}

		// ==================== ADX (TREND STRENGTH) ====================
		if (this.hasValidADX(indicators)) {
			const latest = indicators.adx![indicators.adx!.length - 1];
			if (latest.adx > 25) {
				// Trend strong hai, tab hi signal do
				if (latest.pdi > latest.mdi) {
					signals.push("BUY");
				} else if (latest.mdi > latest.pdi) {
					signals.push("SELL");
				} else {
					signals.push(null);
				}
			} else {
				signals.push(null); // Weak trend - no signal
			}
		}

		// ==================== WILLIAMS %R ====================
		if (this.hasValidWilliamsR(indicators)) {
			const latest =
				indicators.williamsR![indicators.williamsR!.length - 1].value;
			if (latest < -80) {
				// Oversold = BUY opportunity
				signals.push("BUY");
			} else if (latest > -20) {
				// Overbought = SELL opportunity
				signals.push("SELL");
			} else {
				signals.push(null); // Neutral
			}
		}

		// ==================== CCI (COMMODITY CHANNEL INDEX) ====================
		if (this.hasValidCCI(indicators)) {
			const latest = indicators.cci![indicators.cci!.length - 1].value;
			if (latest > 0 && latest < 100) {
				signals.push("BUY");
			} else if (latest < 0 && latest > -100) {
				signals.push("SELL");
			} else {
				signals.push(null); // Extreme - neutral
			}
		}

		// ==================== MFI (MONEY FLOW INDEX) ====================
		if (this.hasValidMFI(indicators)) {
			const latest = indicators.mfi![indicators.mfi!.length - 1].value;
			if (latest > 50 && latest < 80) {
				signals.push("BUY");
			} else if (latest < 50 && latest > 20) {
				signals.push("SELL");
			} else {
				signals.push(null); // Extreme - neutral
			}
		}

		// ==================== ATR (Average True Range) ====================
		if (this.hasValidATR(indicators) && data.length > 1) {
			const atrSeries = indicators.atr!;

			const latestATR = atrSeries[atrSeries.length - 1].value;
			const previousATR =
				atrSeries.length > 1
					? atrSeries[atrSeries.length - 2].value
					: latestATR;
			const previousClose = data[data.length - 2].close;

			if (latestATR >= previousATR) {
				if (latestPrice > previousClose) {
					signals.push("BUY");
				} else if (latestPrice < previousClose) {
					signals.push("SELL");
				} else {
					signals.push(null);
				}
			} else {
				signals.push(null);
			}
		}

		// ==================== VWAP (Volume Weighted Average Price) ====================
		if (this.hasValidVWAP(indicators)) {
			const vwapSeries = indicators.vwap!;
			const latestVWAP = vwapSeries[vwapSeries.length - 1].value;

			if (latestPrice > latestVWAP) {
				signals.push("BUY");
			} else if (latestPrice < latestVWAP) {
				signals.push("SELL");
			} else {
				signals.push(null);
			}
		}

		// ==================== WMA (Weighted Moving Average) ====================
		if (this.hasValidWMA(indicators)) {
			const wmaSeries = indicators.wma!;
			const latestWMA = wmaSeries[wmaSeries.length - 1].value;

			if (latestPrice > latestWMA) {
				signals.push("BUY");
			} else if (latestPrice < latestWMA) {
				signals.push("SELL");
			} else {
				signals.push(null);
			}
		}

		// ==================== OBV (On-Balance Volume) ====================
		if (this.hasValidOBV(indicators)) {
			const obvSeries = indicators.obv!;
			const latestOBV = obvSeries[obvSeries.length - 1].value;
			const previousOBV =
				obvSeries.length > 1
					? obvSeries[obvSeries.length - 2].value
					: latestOBV;

			if (latestOBV > previousOBV) {
				signals.push("BUY");
			} else if (latestOBV < previousOBV) {
				signals.push("SELL");
			} else {
				signals.push(null);
			}
		}

		// ==================== PSAR (Parabolic SAR) ====================
		if (this.hasValidPSAR(indicators)) {
			const psarSeries = indicators.psar!;
			const latestPSAR = psarSeries[psarSeries.length - 1].value;

			if (latestPrice > latestPSAR) {
				signals.push("BUY");
			} else if (latestPrice < latestPSAR) {
				signals.push("SELL");
			} else {
				signals.push(null);
			}
		}

		// ==================== LSMA (Least Squares Moving Average) ====================
		if (this.hasValidLSMA(indicators)) {
			const lsmaSeries = indicators.lsma!;
			console.log('rounded from :', lsmaSeries[lsmaSeries.length - 1].value)
			const latestLSMA = Math.round(lsmaSeries[lsmaSeries.length - 1].value * 100)/100;
			console.log('------------LSMA -EVALUATION------------')
			if (latestPrice > latestLSMA) {
				console.log(`BUY SIGNAL - LSMA - ${latestPrice}(latest price) > ${latestLSMA}(LSMA)`);
				signals.push("BUY");
			} else if (latestPrice < latestLSMA) {
				console.log(`BUY SIGNAL - LSMA - ${latestPrice}(latest price) < ${latestLSMA}(LSMA)`);
				signals.push("SELL");
			} else {
				console.log("NO SIGNAL - LSMA", latestPrice, latestLSMA);
				signals.push(null);
			}
		}

		// ==================== CONSENSUS LOGIC ====================
		// Null signals nikalo (neutral ko ignore karo)
		const validSignals = signals.filter((s) => s !== null);

		// Agar koi indicator bhi enabled nahi tha
		if (validSignals.length === 0) {
			return "SIDEWAYS";
		}

		// Agar ek indicator use karo - direct iska signal do
		if (validSignals.length === 1) {
			return validSignals[0] === "BUY" ? "UPTREND" : "DOWNTREND";
		}

		// ==================== 2+ INDICATORS - CONSENSUS ====================
		const buyCount = validSignals.filter((s) => s === "BUY").length;
		const sellCount = validSignals.filter((s) => s === "SELL").length;
		console.log('------------CONSENSUS -EVALUATION------------', buyCount, sellCount, validSignals)
		// Sab BUY hain
		if (buyCount === validSignals.length) {
			return "UPTREND";
		}
		// Sab SELL hain
		else if (sellCount === validSignals.length) {
			return "DOWNTREND";
		}
		// Mixed signals
		else {
			return "SIDEWAYS";
		}
	}

	// ==================== HELPER FUNCTIONS ====================
	// Ye functions indicators ki validity check karte hain

	private hasValidEMA(indicators: IndicatorsForValidation): boolean {
		if (!indicators.ema) {
			return false;
		}

		const emaData = indicators.ema;
		
		// Check for single standalone EMA
		if (emaData.value && Array.isArray(emaData.value) && emaData.value.length > 0) {
			return true;
		}
		
		// Check for EMA crossover (fast and slow)
		const hasFast = Array.isArray(emaData.fast) && emaData.fast.length > 0;
		const hasSlow = Array.isArray(emaData.slow) && emaData.slow.length > 0;
		
		return hasFast || hasSlow;
	}

	private hasValidSMA(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.sma &&
			Array.isArray(indicators.sma) &&
			indicators.sma.length > 0
		);
	}

	private hasValidRSI(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.rsi &&
			Array.isArray(indicators.rsi) &&
			indicators.rsi.length > 0
		);
	}

	private hasValidMACD(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.macd &&
			Array.isArray(indicators.macd) &&
			indicators.macd.length > 0
		);
	}

	private hasValidBollingerBands(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.bollingerBands &&
			Array.isArray(indicators.bollingerBands) &&
			indicators.bollingerBands.length > 0
		);
	}

	private hasValidStochastic(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.stochastic &&
			Array.isArray(indicators.stochastic) &&
			indicators.stochastic.length > 0
		);
	}

	private hasValidADX(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.adx &&
			Array.isArray(indicators.adx) &&
			indicators.adx.length > 0
		);
	}

	private hasValidWilliamsR(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.williamsR &&
			Array.isArray(indicators.williamsR) &&
			indicators.williamsR.length > 0
		);
	}

	private hasValidCCI(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.cci &&
			Array.isArray(indicators.cci) &&
			indicators.cci.length > 0
		);
	}

	private hasValidMFI(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.mfi &&
			Array.isArray(indicators.mfi) &&
			indicators.mfi.length > 0
		);
	}

	private hasValidLSMA(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.lsma &&
			Array.isArray(indicators.lsma) &&
			indicators.lsma.length > 0
		);
	}

	private hasValidATR(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.atr &&
			Array.isArray(indicators.atr) &&
			indicators.atr.length > 0
		);
	}

	private hasValidVWAP(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.vwap &&
			Array.isArray(indicators.vwap) &&
			indicators.vwap.length > 0
		);
	}

	private hasValidWMA(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.wma &&
			Array.isArray(indicators.wma) &&
			indicators.wma.length > 0
		);
	}

	private hasValidOBV(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.obv &&
			Array.isArray(indicators.obv) &&
			indicators.obv.length > 0
		);
	}

	private hasValidPSAR(indicators: IndicatorsForValidation): boolean {
		return !!(
			indicators.psar &&
			Array.isArray(indicators.psar) &&
			indicators.psar.length > 0
		);
	}

}

export default new TrendAnalyzer();
