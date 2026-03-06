import XtsInstrument from '../models/XtsInstrument.model';
import logger from '../utils/logger';

interface OptionInstrumentResult {
	instrument: any;
	strikePrice: number;
	optionType: 'CE' | 'PE';
}

/**
 * Options Trading Helper Service
 * Handles option instrument resolution and strike price calculation
 */
class OptionsTradingHelperService {
	/**
	 * Round off price to nearest 100
	 */
	roundToNearestHundred(price: number): number {
		return Math.round(price / 100) * 100;
	}

	/**
	 * Extract base symbol and expiry from instrumentDisplayName
	 * Example: "NIFTY 25NOV2025 PE 28200" -> "NIFTY 25NOV2025"
	 */
	extractBaseSymbol(displayName: string): string {
		// Pattern: "NIFTY 25NOV2025 PE 28200" or "NIFTY 25NOV2025 CE 26000"
		// Extract everything before the last space-separated part (which is the strike)
		const parts = displayName.trim().split(/\s+/);
		
		// Remove the last two parts (option type and strike price)
		// e.g., ["NIFTY", "25NOV2025", "PE", "28200"] -> ["NIFTY", "25NOV2025"]
		if (parts.length >= 4) {
			return parts.slice(0, -2).join(' ');
		}
		
		// Fallback: try to extract date pattern
		const dateMatch = displayName.match(/(\w+\s+\d{1,2}[A-Z]{3}\d{4})/i);
		if (dateMatch) {
			return dateMatch[1];
		}
		
		// Last resort: return first two words
		return parts.slice(0, 2).join(' ');
	}

	/**
	 * Calculate strike price based on tradeMode
	 * @param roundedPrice - Price rounded to nearest 100
	 * @param tradeMode - 'atm', 'itm', or 'otm'
	 * @param gap - Gap value for ITM/OTM
	 * @param optionType - 'CE' or 'PE'
	 */
	calculateStrikePrice(
		roundedPrice: number,
		tradeMode: 'atm' | 'itm' | 'otm',
		gap: number,
		optionType: 'CE' | 'PE'
	): number {
		if (tradeMode === 'atm') {
			return roundedPrice;
		}

		if (optionType === 'CE') {
			// For CE:
			// ITM = roundedPrice - gap (lower strike, more in-the-money)
			// OTM = roundedPrice + gap (higher strike, more out-of-the-money)
			return tradeMode === 'itm' ? roundedPrice - gap : roundedPrice + gap;
		} else {
			// For PE:
			// ITM = roundedPrice + gap (higher strike, more in-the-money)
			// OTM = roundedPrice - gap (lower strike, more out-of-the-money)
			return tradeMode === 'itm' ? roundedPrice + gap : roundedPrice - gap;
		}
	}

	/**
	 * Determine option type based on entry signal
	 * BUY signal -> CE (Call)
	 * SELL signal -> PE (Put)
	 */
	getOptionTypeForEntry(signal: 'BUY' | 'SELL'): 'CE' | 'PE' {
		return signal === 'BUY' ? 'CE' : 'PE';
	}

	/**
	 * Determine option type for exit based on entry option type
	 * If entry was CE, exit is also CE (just sell it)
	 * If entry was PE, exit is also PE (just sell it)
	 */
	getOptionTypeForExit(entryOptionType: 'CE' | 'PE'): 'CE' | 'PE' {
		return entryOptionType; // Same option type for exit
	}

	/**
	 * Build option symbol string
	 * Example: "NIFTY 25NOV2025 CE 26000"
	 */
	buildOptionSymbol(baseSymbol: string, optionType: 'CE' | 'PE', strikePrice: number): string {
		return `${baseSymbol} ${optionType} ${strikePrice}`;
	}

	/**
	 * Find option instrument in xts_instruments by displayName
	 */
	async findOptionInstrument(displayName: string): Promise<any | null> {
		try {
			const instrument = await XtsInstrument.findOne({
				displayName: { $regex: `^${this.escapeRegex(displayName)}$`, $options: 'i' }
			}).lean();

			if (!instrument) {
				logger.warn('Option instrument not found by exact displayName, trying partial match', {
					displayName
				});

				// Try partial match
				const partialMatch = await XtsInstrument.findOne({
					displayName: { $regex: this.escapeRegex(displayName), $options: 'i' }
				}).lean();

				return partialMatch;
			}

			return instrument;
		} catch (error) {
			logger.error('Error finding option instrument:', error);
			return null;
		}
	}

	/**
	 * Escape special regex characters
	 */
	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/**
	 * Resolve option instrument for entry
	 * @param entryPrice - Entry signal price
	 * @param signal - BUY or SELL
	 * @param instrumentDisplayName - Display name from strategy (e.g., "NIFTY 25NOV2025 PE 28200")
	 * @param tradeMode - 'atm', 'itm', or 'otm'
	 * @param gap - Gap value for ITM/OTM
	 * @param expiry - Expiry date from strategy config
	 */
	async resolveOptionInstrumentForEntry(
		entryPrice: number,
		signal: 'BUY' | 'SELL',
		instrumentDisplayName: string,
		tradeMode: 'atm' | 'itm' | 'otm',
		gap: number,
		_expiry?: string
	): Promise<OptionInstrumentResult | null> {
		try {
			// Step 1: Round off price to nearest 100
			const roundedPrice = this.roundToNearestHundred(entryPrice);

			// Step 2: Determine option type
			const optionType = this.getOptionTypeForEntry(signal);

			// Step 3: Extract base symbol from instrumentDisplayName
			const baseSymbol = this.extractBaseSymbol(instrumentDisplayName);

			// Step 4: Calculate strike price based on tradeMode
			const strikePrice = this.calculateStrikePrice(roundedPrice, tradeMode, gap, optionType);

			// Step 5: Build option symbol
			const optionSymbol = this.buildOptionSymbol(baseSymbol, optionType, strikePrice);

			logger.info('Resolving option instrument for entry', {
				entryPrice,
				roundedPrice,
				signal,
				optionType,
				baseSymbol,
				tradeMode,
				gap,
				strikePrice,
				optionSymbol,
				instrumentDisplayName
			});

			// Step 6: Find instrument in xts_instruments
			const instrument = await this.findOptionInstrument(optionSymbol);

			if (!instrument) {
				logger.error('Option instrument not found', {
					optionSymbol,
					baseSymbol,
					optionType,
					strikePrice
				});
				return null;
			}

			return {
				instrument,
				strikePrice,
				optionType
			};
		} catch (error) {
			logger.error('Error resolving option instrument for entry:', error);
			return null;
		}
	}

	/**
	 * Resolve option instrument for exit
	 * Uses the same strike and option type from entry
	 */
	async resolveOptionInstrumentForExit(
		entryOptionType: 'CE' | 'PE',
		entryStrikePrice: number,
		instrumentDisplayName: string
	): Promise<any | null> {
		try {
			// Extract base symbol
			const baseSymbol = this.extractBaseSymbol(instrumentDisplayName);

			// Build option symbol with same strike and option type
			const optionSymbol = this.buildOptionSymbol(baseSymbol, entryOptionType, entryStrikePrice);

			logger.info('Resolving option instrument for exit', {
				entryOptionType,
				entryStrikePrice,
				baseSymbol,
				optionSymbol
			});

			// Find instrument
			const instrument = await this.findOptionInstrument(optionSymbol);

			if (!instrument) {
				logger.error('Option instrument not found for exit', {
					optionSymbol
				});
				return null;
			}

			return instrument;
		} catch (error) {
			logger.error('Error resolving option instrument for exit:', error);
			return null;
		}
	}
}

export default new OptionsTradingHelperService();

