import XtsInstrument from '../models/XtsInstrument.model';
import logger from '../utils/logger';

class ExpirySelectorService {
	/**
	 * Get available expiries for a given symbol name
	 * @param symbolName - Full symbol name (e.g., "NIFTY 50")
	 * @returns Array of unique expiry dates
	 */
	async getExpiriesForSymbol(symbolName: string): Promise<string[]> {
		try {
			// Decode URL-encoded symbols (e.g., "NIFTY+BANK" -> "NIFTY BANK")
			// and normalize the symbol name (trim and normalize whitespace)
			const decodedSymbol = decodeURIComponent(symbolName.replace(/\+/g, ' '))
				.trim()
				.replace(/\s+/g, ' '); // Normalize multiple spaces to single space
			
			// Extract base name from symbol (e.g., "NIFTY 50" -> "NIFTY")
			const baseName = this.extractBaseName(decodedSymbol);
			
			if (!baseName) {
				logger.warn(`Could not extract base name from symbol: ${decodedSymbol}`);
				return [];
			}

			logger.info(`Searching expiries for symbol: "${decodedSymbol}" (base: ${baseName})`);

			// Search for option index contracts in NSE F&O (exchangeSegment: 1)
			// Option index contracts have underlyingIndexName matching the index symbol (case-insensitive)
			// and series = "OPTIDX"
			// index_instruments has "NIFTY 50" (all caps) but xts_instruments has "Nifty 50" (title case)
			// Example: If user selected "NIFTY 50" from index_instruments, 
			// search for underlyingIndexName matching "NIFTY 50" or "Nifty 50" with series="OPTIDX"
			// Escape special regex characters and use case-insensitive matching
			// Match underlyingIndexName case-insensitively (e.g., "NIFTY 50" matches "Nifty 50")
			const escapedSymbol = decodedSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			
			const instruments = await XtsInstrument.find({
				$and: [
					{ underlyingIndexName: { $regex: `^${escapedSymbol}$`, $options: 'i' } },
					{ underlyingIndexName: { $exists: true, $ne: '' } }
				],
				series: 'OPTIDX',
				expiry: { $exists: true, $ne: '' }
			})
			.select('expiry name underlyingIndexName series')
			.lean();

			logger.info(`Found ${instruments.length} instruments matching "${decodedSymbol}" with series="OPTIDX"`);
			if (instruments.length > 0) {
				logger.info(`Sample underlyingIndexName values: ${instruments.slice(0, 3).map(i => i.underlyingIndexName).join(', ')}`);
			}

			// Extract unique expiry dates
			const expiries = new Set<string>();
			
			for (const instrument of instruments) {
				if (instrument.expiry && instrument.expiry.trim()) {
					// Normalize expiry format (handle different date formats)
					const normalizedExpiry = this.normalizeExpiryDate(instrument.expiry);
					if (normalizedExpiry) {
						expiries.add(normalizedExpiry);
					}
				}
			}

			// Convert to array and sort by date
			const expiryArray = Array.from(expiries).sort((a, b) => {
				const dateA = new Date(a);
				const dateB = new Date(b);
				return dateA.getTime() - dateB.getTime();
			});

			logger.info(`Found ${expiryArray.length} unique expiries for ${baseName}`);

			return expiryArray;
		} catch (error) {
			logger.error(`Error fetching expiries for symbol ${symbolName}:`, error);
			return [];
		}
	}

	/**
	 * Extract base name from symbol
	 * Examples:
	 * - "NIFTY 50" -> "NIFTY"
	 * - "NIFTY BANK" -> "NIFTY"
	 * - "BANKNIFTY" -> "BANKNIFTY"
	 * - "FINNIFTY" -> "FINNIFTY"
	 */
	private extractBaseName(symbolName: string): string {
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
	 * Normalize expiry date to YYYY-MM-DD format
	 */
	private normalizeExpiryDate(expiry: string): string | null {
		if (!expiry) return null;

		try {
			// Try to parse the date
			const date = new Date(expiry);
			
			// Check if date is valid
			if (isNaN(date.getTime())) {
				// Try parsing common formats
				// Format: "DD-MMM-YYYY" or "DDMMMYYYY"
				const cleaned = expiry.trim().replace(/\s+/g, '');
				
				// Try DDMMMYYYY format (e.g., "25DEC2024")
				const match = cleaned.match(/^(\d{2})([A-Z]{3})(\d{4})$/i);
				if (match) {
					const [, day, month, year] = match;
					const monthMap: Record<string, string> = {
						'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
						'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
						'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
					};
					const monthNum = monthMap[month.toUpperCase()];
					if (monthNum) {
						return `${year}-${monthNum}-${day.padStart(2, '0')}`;
					}
				}

				// Try DD-MMM-YYYY format
				const match2 = cleaned.match(/^(\d{2})-([A-Z]{3})-(\d{4})$/i);
				if (match2) {
					const [, day, month, year] = match2;
					const monthMap: Record<string, string> = {
						'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
						'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
						'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
					};
					const monthNum = monthMap[month.toUpperCase()];
					if (monthNum) {
						return `${year}-${monthNum}-${day.padStart(2, '0')}`;
					}
				}

				return null;
			}

			// Format as YYYY-MM-DD
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			
			return `${year}-${month}-${day}`;
		} catch (error) {
			logger.warn(`Could not normalize expiry date: ${expiry}`, error);
			return null;
		}
	}
}

export default new ExpirySelectorService();

