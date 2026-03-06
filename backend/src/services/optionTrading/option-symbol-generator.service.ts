import logger from '../../utils/logger';

interface OptionSymbolParams {
	baseSymbol: string; // e.g., "NIFTY"
	entryPrice: number; // e.g., 25215
	expiry: string; // e.g., "2024-11-25" or "25NOV2024"
	signal: 'BUY' | 'SELL'; // BUY = CE, SELL = PE
}

interface GeneratedOptionSymbol {
	symbol: string; // e.g., "NIFTY25NOV25200CE"
	strikePrice: number; // Rounded strike price (e.g., 25200)
	optionType: 'CE' | 'PE';
	baseSymbol: string;
	expiry: string;
}

class OptionSymbolGeneratorService {
	/**
	 * Round off entry price to nearest strike price
	 * Rules:
	 * - If price < 25250: round down to nearest 100 (e.g., 25215 -> 25200)
	 * - If price >= 25250: round up to nearest 100 (e.g., 25250 -> 25300, 25251 -> 25300)
	 */
	roundToStrikePrice(entryPrice: number): number {
		if (entryPrice < 25250) {
			// Round down to nearest 100
			return Math.floor(entryPrice / 100) * 100;
		} else {
			// Round up to nearest 100
			return Math.ceil(entryPrice / 100) * 100;
		}
	}

	/**
	 * Extract base symbol from full symbol name
	 * Examples:
	 * - "NIFTY 50" -> "NIFTY"
	 * - "NIFTY BANK" -> "NIFTY"
	 * - "BANKNIFTY" -> "BANKNIFTY"
	 */
	extractBaseSymbol(symbolName: string): string {
		if (!symbolName) return '';

		const upperSymbol = symbolName.toUpperCase().trim();

		// Handle common patterns
		if (upperSymbol.startsWith('NIFTY')) {
			// "NIFTY 50", "NIFTY BANK", "NIFTY IT" -> "NIFTY"
			return 'NIFTY';
		}

		// For other symbols, return as is (e.g., "BANKNIFTY", "FINNIFTY")
		return upperSymbol;
	}

	/**
	 * Format expiry date to option symbol format
	 * Input: "2024-11-25" or "25NOV2024"
	 * Output: "25NOV24" (DDMMMYY format)
	 */
	formatExpiryForSymbol(expiry: string): string {
		if (!expiry) return '';

		try {
			let date: Date;

			// Check if already in DDMMMYYYY format (e.g., "25NOV2024")
			const ddmmyyyyMatch = expiry.match(/^(\d{2})([A-Z]{3})(\d{4})$/i);
			if (ddmmyyyyMatch) {
				const [, day, month, year] = ddmmyyyyMatch;
				const monthMap: Record<string, number> = {
					'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3,
					'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7,
					'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
				};
				const monthNum = monthMap[month.toUpperCase()];
				if (monthNum !== undefined) {
					date = new Date(parseInt(year), monthNum, parseInt(day));
				} else {
					date = new Date(expiry);
				}
			} else {
				// Try parsing as ISO date or other formats
				date = new Date(expiry);
			}

			if (isNaN(date.getTime())) {
				logger.warn(`Invalid expiry date format: ${expiry}`);
				return '';
			}

			// Format as DDMMMYY
			const day = String(date.getDate()).padStart(2, '0');
			const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
			const month = monthNames[date.getMonth()];
			const year = String(date.getFullYear()).slice(-2); // Last 2 digits

			return `${day}${month}${year}`;
		} catch (error) {
			logger.error(`Error formatting expiry date: ${expiry}`, error);
			return '';
		}
	}

	/**
	 * Generate option symbol
	 * Format: BASESYMBOL + EXPIRY + STRIKE + OPTIONTYPE
	 * Example: NIFTY25NOV25200CE
	 */
	generateOptionSymbol(params: OptionSymbolParams): GeneratedOptionSymbol {
		try {
			// Extract base symbol
			const baseSymbol = this.extractBaseSymbol(params.baseSymbol);
			if (!baseSymbol) {
				throw new Error(`Could not extract base symbol from: ${params.baseSymbol}`);
			}

			// Round off strike price
			const strikePrice = this.roundToStrikePrice(params.entryPrice);
			logger.info(`Rounded entry price ${params.entryPrice} to strike price ${strikePrice}`);

			// Format expiry
			const formattedExpiry = this.formatExpiryForSymbol(params.expiry);
			if (!formattedExpiry) {
				throw new Error(`Invalid expiry format: ${params.expiry}`);
			}

			// Determine option type (BUY = CE, SELL = PE)
			const optionType = params.signal === 'BUY' ? 'CE' : 'PE';

			// Generate symbol: BASESYMBOL + EXPIRY + STRIKE + OPTIONTYPE
			// Example: NIFTY + 25NOV24 + 25200 + CE = NIFTY25NOV2425200CE
			const symbol = `${baseSymbol}${formattedExpiry}${strikePrice}${optionType}`;

			logger.info(`Generated option symbol: ${symbol}`, {
				baseSymbol,
				formattedExpiry,
				strikePrice,
				optionType,
				originalPrice: params.entryPrice,
			});

			return {
				symbol,
				strikePrice,
				optionType,
				baseSymbol,
				expiry: formattedExpiry,
			};
		} catch (error) {
			logger.error('Error generating option symbol:', error);
			throw error;
		}
	}
}

export default new OptionSymbolGeneratorService();

