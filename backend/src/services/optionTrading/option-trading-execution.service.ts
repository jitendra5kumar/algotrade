import dealerApiService from '../dealer-api.service';
import marketDataService from '../market-data.service';
import optionInstrumentResolver from './option-instrument-resolver.service';
import logger from '../../utils/logger';
import OptionTrade from '../../models/OptionTrade.model';
import OptionStrategy from '../../models/OptionStrategy.model';

interface OptionTradeParams {
	strategyId: string;
	userId: string;
	baseSymbol: string; // e.g., "NIFTY 50"
	baseExchangeInstrumentID: number; // Index exchangeInstrumentID
	entryPrice: number; // Signal entry price (e.g., 25215)
	expiry: string; // Expiry date
	signal: 'BUY' | 'SELL';
	quantity: number;
	productType: 'MIS' | 'NRML' | 'CNC';
	orderType: 'MARKET' | 'LIMIT';
	clientID: string;
	stopLossPrice?: number;
	takeProfitPrice?: number;
}

interface OptionTradeResult {
	success: boolean;
	optionInstrument: {
		exchangeInstrumentID: number;
		instrumentToken: number;
		name: string;
		strikePrice: number;
		optionType: 'CE' | 'PE';
	} | null;
	generatedSymbol: string;
	orderResult?: Record<string, unknown>;
	tradeRecord?: Record<string, unknown>;
	error?: string;
}

class OptionTradingExecutionService {
	/**
	 * Execute option trade
	 * Steps:
	 * 1. Generate option symbol from base symbol, entry price, expiry, and signal
	 * 2. Round off entry price to strike price
	 * 3. Search for option instrument in XTS database
	 * 4. Get current price of option
	 * 5. Place order
	 * 6. Create trade record
	 */
	async executeOptionTrade(params: OptionTradeParams): Promise<OptionTradeResult> {
		try {
			logger.info('Executing option trade:', {
				strategyId: params.strategyId,
				baseSymbol: params.baseSymbol,
				entryPrice: params.entryPrice,
				expiry: params.expiry,
				signal: params.signal,
			});

			// Step 1 & 2: Generate option symbol and round off strike price
			const resolved = await optionInstrumentResolver.resolveOptionInstrument(
				params.baseSymbol,
				params.entryPrice,
				params.expiry,
				params.signal,
			);

			if (!resolved.instrument) {
				logger.warn(`Option instrument not found for symbol: ${resolved.generatedSymbol}`);
				
				// Try to find alternative options
				const alternatives = await optionInstrumentResolver.findAlternativeOptions(
					params.baseSymbol,
					resolved.strikePrice,
					params.expiry,
					resolved.optionType,
					5, // Search within 5 strikes
				);

				if (alternatives.length === 0) {
					return {
						success: false,
						optionInstrument: null,
						generatedSymbol: resolved.generatedSymbol,
						error: `Option instrument not found: ${resolved.generatedSymbol}. No alternatives found.`,
					};
				}

				// Use the closest strike price option
				const closest = alternatives.reduce((prev, curr) => {
					const prevDiff = Math.abs(prev.strikePrice - resolved.strikePrice);
					const currDiff = Math.abs(curr.strikePrice - resolved.strikePrice);
					return currDiff < prevDiff ? curr : prev;
				});

				logger.info(`Using alternative option: ${closest.name} (strike: ${closest.strikePrice})`);
				resolved.instrument = closest;
			}

			// Step 3: Get current price of option
			const quotes = await marketDataService.getLiveQuotes([
				{
					exchangeSegment: 1, // NSE F&O
					exchangeInstrumentID: resolved.instrument.exchangeInstrumentID,
				},
			]);

			const quote = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] as Record<string, unknown> : null;
			const currentPrice = (quote?.LTP || quote?.ltp || quote?.LastTradedPrice || 0) as number;

			if (!currentPrice || currentPrice === 0) {
				return {
					success: false,
					optionInstrument: {
						exchangeInstrumentID: resolved.instrument.exchangeInstrumentID,
						instrumentToken: resolved.instrument.instrumentToken,
						name: resolved.instrument.name,
						strikePrice: resolved.strikePrice,
						optionType: resolved.optionType,
					},
					generatedSymbol: resolved.generatedSymbol,
					error: 'Could not fetch current price for option',
				};
			}

			logger.info(`Option current price: ${currentPrice} for ${resolved.instrument.name}`);

			// Step 4: Place order
			const orderParams = {
				exchangeSegment: 'NSEFO', // NSE F&O
				exchangeInstrumentID: resolved.instrument.exchangeInstrumentID,
				productType: params.productType,
				orderType: params.orderType,
				orderSide: params.signal,
				timeInForce: 'DAY',
				disclosedQuantity: 0,
				orderQuantity: params.quantity.toString(),
				limitPrice: params.orderType === 'LIMIT' ? currentPrice : 0,
				orderUniqueIdentifier: Date.now().toString(),
				stopPrice: 0,
				clientID: params.clientID,
			};

			logger.info('Placing option order:', orderParams);

			// Place order through dealer API
			const orderResult = await dealerApiService.placeOrder(orderParams);

			// Step 5: Create trade record
			const tradeRecord = await OptionTrade.create({
				userId: params.userId,
				strategyId: params.strategyId,
				symbol: resolved.instrument.name,
				baseSymbol: params.baseSymbol,
				exchangeSegment: 'NSEFO',
				exchangeInstrumentID: resolved.instrument.exchangeInstrumentID,
				strikePrice: resolved.strikePrice,
				optionType: resolved.optionType,
				expiry: params.expiry,
				orderType: params.orderType,
				productType: params.productType,
				side: params.signal,
				entryOrderId: (orderResult as Record<string, unknown>)?.AppOrderID as string || '',
				entryPrice: currentPrice,
				entryTime: new Date(),
				entryQuantity: params.quantity,
				stopLossPrice: params.stopLossPrice || 0,
				takeProfitPrice: params.takeProfitPrice || 0,
				status: 'OPEN',
			});

			// Update option strategy with current position
			await OptionStrategy.findByIdAndUpdate(params.strategyId, {
				$set: {
					currentPosition: {
						entryPrice: currentPrice,
						entryTime: new Date(),
						quantity: params.quantity,
						side: params.signal,
						currentPrice: currentPrice,
						unrealizedPnL: 0,
						stopLossPrice: params.stopLossPrice || 0,
						takeProfitPrice: params.takeProfitPrice || 0,
					},
					'config.strikePrice': resolved.strikePrice,
					'config.optionType': resolved.optionType,
				},
			});

			logger.info(`Option trade executed successfully: ${resolved.instrument.name}`);

			return {
				success: true,
				optionInstrument: {
					exchangeInstrumentID: resolved.instrument.exchangeInstrumentID,
					instrumentToken: resolved.instrument.instrumentToken,
					name: resolved.instrument.name,
					strikePrice: resolved.strikePrice,
					optionType: resolved.optionType,
				},
				generatedSymbol: resolved.generatedSymbol,
				orderResult,
				tradeRecord: tradeRecord.toObject() as unknown as Record<string, unknown>,
			};
		} catch (error) {
			logger.error('Error executing option trade:', error);
			return {
				success: false,
				optionInstrument: null,
				generatedSymbol: '',
				error: (error as Error).message || 'Unknown error',
			};
		}
	}

	/**
	 * Exit option position
	 */
	async exitOptionPosition(
		strategyId: string,
		userId: string,
		reason: string,
	): Promise<Record<string, unknown>> {
		try {
			const strategy = await OptionStrategy.findById(strategyId);
			if (!strategy || !strategy.currentPosition) {
				throw new Error('Strategy or position not found');
			}

			const position = strategy.currentPosition;
			const user = await (await import('../../models/User.model')).default.findById(userId);
			if (!user || !user.brokerCredentials?.clientId) {
				throw new Error('User or broker credentials not found');
			}

			// Get current price
			const quotes = await marketDataService.getLiveQuotes([
				{
					exchangeSegment: 1, // NSE F&O
					exchangeInstrumentID: strategy.exchangeInstrumentID,
				},
			]);

			const quote = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] as Record<string, unknown> : null;
			const exitPrice = (quote?.LTP || quote?.ltp || quote?.LastTradedPrice || 0) as number;

			// Place exit order (opposite side)
			const exitSide: 'BUY' | 'SELL' = position.side === 'BUY' ? 'SELL' : 'BUY';
			const orderParams = {
				exchangeSegment: 'NSEFO',
				exchangeInstrumentID: strategy.exchangeInstrumentID,
				productType: strategy.config.productType,
				orderType: 'MARKET',
				orderSide: exitSide,
				timeInForce: 'DAY',
				disclosedQuantity: 0,
				orderQuantity: position.quantity.toString(),
				limitPrice: 0,
				orderUniqueIdentifier: Date.now().toString(),
				stopPrice: 0,
				clientID: user.brokerCredentials.clientId,
			};

			const orderResult = await dealerApiService.placeOrder(orderParams);

			// Update trade record
			const openTrade = await OptionTrade.findOne({
				strategyId,
				userId,
				status: 'OPEN',
			}).sort({ entryTime: -1 });

			if (openTrade) {
				const pnl = exitSide === 'SELL'
					? (exitPrice - position.entryPrice) * position.quantity
					: (position.entryPrice - exitPrice) * position.quantity;

				openTrade.exitOrderId = (orderResult as Record<string, unknown>)?.AppOrderID as string || '';
				openTrade.exitPrice = exitPrice;
				openTrade.exitTime = new Date();
				openTrade.exitQuantity = position.quantity;
				openTrade.exitReason = reason as any;
				openTrade.grossProfit = pnl;
				openTrade.status = 'CLOSED';
				await openTrade.save();
			}

			// Clear position from strategy
			await OptionStrategy.findByIdAndUpdate(strategyId, {
				$unset: { currentPosition: 1 },
			});

			return {
				success: true,
				exitPrice,
				orderResult,
			};
		} catch (error) {
			logger.error('Error exiting option position:', error);
			throw error;
		}
	}
}

export default new OptionTradingExecutionService();

