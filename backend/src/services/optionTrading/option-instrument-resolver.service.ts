import XtsInstrument from '../../models/XtsInstrument.model';
import logger from '../../utils/logger';
import optionSymbolGenerator from './option-symbol-generator.service';

interface OptionInstrument {
	exchangeInstrumentID: number;
	instrumentToken: number;
	name: string;
	description: string;
	strikePrice: number;
	optionType: string | number;
	expiry: string;
	lotSize: number;
	tickSize: number;
	exchangeSegment: number;
}

class OptionInstrumentResolverService {
	/**
	 * Search for option instrument by generated symbol
	 * @param optionSymbol - Generated option symbol (e.g., "NIFTY25NOV2425200CE")
	 * @returns Option instrument if found, null otherwise
	 */
	async findOptionInstrument(optionSymbol: string): Promise<OptionInstrument | null> {
		try {
			logger.info(`Searching for option instrument: ${optionSymbol}`);

			// Search in NSE F&O (exchangeSegment: 1) for options
			// Try exact match first
			let instrument = await XtsInstrument.findOne({
				name: optionSymbol.toUpperCase(),
				exchangeSegment: 1, // NSE F&O
				instrumentType: 2, // Options (1 = Futures, 2 = Options)
			}).lean();

			// If not found, try case-insensitive regex
			if (!instrument) {
				instrument = await XtsInstrument.findOne({
					name: { $regex: `^${optionSymbol}$`, $options: 'i' },
					exchangeSegment: 1, // NSE F&O
					instrumentType: 2, // Options (1 = Futures, 2 = Options)
				}).lean();
			}

			if (instrument) {
				logger.info(`Found option instrument: ${instrument.name} (ID: ${instrument.exchangeInstrumentID})`);
				return {
					exchangeInstrumentID: instrument.exchangeInstrumentID,
					instrumentToken: instrument.instrumentToken,
					name: instrument.name,
					description: instrument.description || instrument.name,
					strikePrice: instrument.strikePrice || 0,
					optionType: instrument.optionType || '',
					expiry: instrument.expiry || instrument.contractExpiration || '',
					lotSize: instrument.lotSize || 50,
					tickSize: instrument.tickSize || 0.05,
					exchangeSegment: instrument.exchangeSegment,
				};
			}

			logger.warn(`Option instrument not found: ${optionSymbol}`);
			return null;
		} catch (error) {
			logger.error(`Error searching for option instrument: ${optionSymbol}`, error);
			throw error;
		}
	}

	/**
	 * Generate option symbol and find the corresponding instrument
	 * @param baseSymbol - Base symbol name (e.g., "NIFTY 50")
	 * @param entryPrice - Entry price from signal (e.g., 25215)
	 * @param expiry - Expiry date (e.g., "2024-11-25")
	 * @param signal - BUY or SELL
	 * @returns Option instrument if found, null otherwise
	 */
	async resolveOptionInstrument(
		baseSymbol: string,
		entryPrice: number,
		expiry: string,
		signal: 'BUY' | 'SELL',
	): Promise<{
		instrument: OptionInstrument | null;
		generatedSymbol: string;
		strikePrice: number;
		optionType: 'CE' | 'PE';
	}> {
		try {
			// Generate option symbol
			const generated = optionSymbolGenerator.generateOptionSymbol({
				baseSymbol,
				entryPrice,
				expiry,
				signal,
			});

			// Search for the instrument
			const instrument = await this.findOptionInstrument(generated.symbol);

			return {
				instrument,
				generatedSymbol: generated.symbol,
				strikePrice: generated.strikePrice,
				optionType: generated.optionType,
			};
		} catch (error) {
			logger.error('Error resolving option instrument:', error);
			throw error;
		}
	}

	/**
	 * Find alternative option instruments if exact match not found
	 * Searches for nearby strike prices
	 */
	async findAlternativeOptions(
		baseSymbol: string,
		targetStrike: number,
		expiry: string,
		optionType: 'CE' | 'PE',
		maxStrikesAway: number = 5,
	): Promise<OptionInstrument[]> {
		try {
			const baseSymbolName = optionSymbolGenerator.extractBaseSymbol(baseSymbol);
			const formattedExpiry = optionSymbolGenerator.formatExpiryForSymbol(expiry);

			if (!baseSymbolName || !formattedExpiry) {
				return [];
			}

			// Search for options with nearby strikes
			const strikeRange = maxStrikesAway * 100; // 5 strikes = 500 points
			const minStrike = targetStrike - strikeRange;
			const maxStrike = targetStrike + strikeRange;

			// Convert option type to filter (CE = 1 or "CE", PE = 2 or "PE")
			// XTS uses: CE = 1, PE = 2 (numbers) or "CE"/"PE" (strings)
			const optionTypeFilter = optionType === 'CE' 
				? { $in: [1, 'CE', 'C', 'Call', 'CALL'] } 
				: { $in: [2, 'PE', 'P', 'Put', 'PUT'] };

			const instruments = await XtsInstrument.find({
				name: { $regex: `^${baseSymbolName}${formattedExpiry}`, $options: 'i' },
				exchangeSegment: 1, // NSE F&O
				instrumentType: 2, // Options
				optionType: optionTypeFilter,
				strikePrice: { $gte: minStrike, $lte: maxStrike },
			})
			.sort({ strikePrice: 1 })
			.limit(20)
			.lean();

			logger.info(`Found ${instruments.length} alternative options near strike ${targetStrike}`);

			return instruments.map((inst) => ({
				exchangeInstrumentID: inst.exchangeInstrumentID,
				instrumentToken: inst.instrumentToken,
				name: inst.name,
				description: inst.description || inst.name,
				strikePrice: inst.strikePrice || 0,
				optionType: inst.optionType || '',
				expiry: inst.expiry || inst.contractExpiration || '',
				lotSize: inst.lotSize || 50,
				tickSize: inst.tickSize || 0.05,
				exchangeSegment: inst.exchangeSegment,
			}));
		} catch (error) {
			logger.error('Error finding alternative options:', error);
			return [];
		}
	}
}

export default new OptionInstrumentResolverService();

