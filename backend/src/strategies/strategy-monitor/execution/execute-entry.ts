import Trade from "../../../models/Trade.model";
import Strategy from "../../../models/Strategy.model";
import User from "../../../models/User.model";
import logger from "../../../utils/logger";
import websocketServer from "../../../websocket/websocket.server";
import { updateStrategy } from "../../strategy-query.service";
import type { MonitorState } from "../types";
import { clearHighLowWatcher } from "../high-low-break/watcher";
import strategyLogService from "../../../services/strategy-log.service";
import dealerApiService from "../../../services/dealer-api.service";
import optionsTradingHelper from "../../../services/options-trading-helper.service";

/**
 * Execute entry (BUY/SELL)
 */
export async function executeEntry(
	monitor: MonitorState,
	signal: "BUY" | "SELL",
	price: number,
	stopLossPrice: number,
	takeProfitPrice: number,
	_monitors: Map<string, MonitorState>,
): Promise<void> {
	const { strategy } = monitor;
	clearHighLowWatcher(monitor);

	try {
		// CRITICAL: Check if position already exists to prevent duplicate trades
		// Fetch fresh strategy data to check current position
		const freshStrategy = await Strategy.findById((strategy as any)._id);
		if (!freshStrategy) {
			logger.error("Strategy not found during entry execution", {
				strategyId: (strategy as any)._id?.toString(),
			});
			throw new Error("Strategy not found");
		}

		const currentPosition = freshStrategy.currentPosition;
		const hasCurrentPosition =
			currentPosition !== null &&
			currentPosition !== undefined &&
			typeof currentPosition === 'object' &&
			currentPosition.entryPrice !== undefined &&
			currentPosition.entryPrice !== null &&
			currentPosition.quantity !== undefined &&
			currentPosition.quantity !== null &&
			currentPosition.side !== undefined &&
			currentPosition.side !== null;

		// Handle position check - allow reversal trades
		if (hasCurrentPosition) {
			if (currentPosition.side === signal) {
				// Same direction - skip (duplicate signal)
				logger.warn(
					`Skipping entry - position already exists in same direction: ${signal} ${strategy.symbol}`,
					{
						strategyId: (strategy as any)._id?.toString(),
						existingPosition: currentPosition.side,
						attemptedSignal: signal,
						entryPrice: currentPosition.entryPrice,
						exchangeSegment: strategy.exchangeSegment,
					},
				);
				return; // Exit silently - this is expected behavior for duplicate signals
			} else {
				// OPPOSITE direction - this is a REVERSAL trade
				// First exit the existing position, then enter new one
				logger.info(
					`🔄 Reversal trade detected: Existing ${currentPosition.side} position, new ${signal} signal for ${strategy.symbol}`,
					{
						strategyId: (strategy as any)._id?.toString(),
						existingPosition: currentPosition.side,
						newSignal: signal,
						exchangeSegment: strategy.exchangeSegment,
						existingEntryPrice: currentPosition.entryPrice,
					},
				);
				
				// Exit existing position first
				try {
					const { executeExit } = await import("./execute-exit");
					await executeExit(monitor, price, "TREND_FLIP", _monitors);
					
					// Refresh strategy after exit to ensure currentPosition is cleared
					const refreshedStrategy = await Strategy.findById((strategy as any)._id);
					if (refreshedStrategy) {
						monitor.strategy = refreshedStrategy;
						logger.info(`✅ Existing position closed, proceeding with ${signal} entry`, {
							strategyId: (strategy as any)._id?.toString(),
							symbol: strategy.symbol
						});
					}
					
					// Continue with new entry below (don't return)
				} catch (exitError) {
					const errorMessage = exitError instanceof Error ? exitError.message : String(exitError);
					logger.error(`❌ Failed to exit existing position for reversal: ${errorMessage}`, {
						strategyId: (strategy as any)._id?.toString(),
						symbol: strategy.symbol,
						existingPosition: currentPosition.side,
						newSignal: signal,
						error: errorMessage
					});
					// Don't proceed with entry if exit failed
					throw exitError;
				}
			}
		}

		let orderId: string | undefined;
		let optionInstrumentId: number | undefined;
		let optionStrikePrice: number | undefined;
		let optionType: 'CE' | 'PE' | undefined;

		// Check if this is an OPTIONS strategy
		const isOptionsStrategy = strategy.type === 'OPTIONS';

		// Place order in broker (LIVE trading only)
		{
			logger.info("Executing LIVE trade entry", {
				strategyId: (strategy as any)._id?.toString(),
				symbol: strategy.symbol,
				exchangeSegment: strategy.exchangeSegment,
				signal,
				price,
				quantity: strategy.config.quantity,
				productType: strategy.config.productType,
				orderType: strategy.config.orderType,
				isOptionsStrategy
			});
			
			try {
				// ALWAYS fetch fresh broker status at trade execution time
				// This ensures we get the latest connection status, especially for multiple accounts
				const { BrokerService } = await import("../../../services/broker.service");
				let freshBrokerStatus;
				try {
					freshBrokerStatus = await BrokerService.getBrokerStatus(strategy.userId.toString());
				} catch (brokerStatusError) {
					logger.warn("Failed to fetch fresh broker status, falling back to cached values", {
						strategyId: (strategy as any)._id?.toString(),
						userId: strategy.userId,
						error: brokerStatusError instanceof Error ? brokerStatusError.message : String(brokerStatusError)
					});
				}
				
				// Fetch user with broker credentials
				const user = await User.findById(strategy.userId).select('+brokerCredentials');
				
				// Priority: 1. Fresh broker status, 2. User credentials, 3. Monitor cached value
				const brokerClientId = freshBrokerStatus?.clientId || 
									  user?.brokerCredentials?.clientId || 
									  monitor?.brokerClientId;
				
				const isBrokerConnected = freshBrokerStatus?.isConnected !== undefined 
					? freshBrokerStatus.isConnected 
					: (user?.brokerCredentials?.isConnected || !!monitor?.brokerClientId);
				
				// Detailed logging for debugging
				logger.info("Checking broker connection for entry", {
					strategyId: (strategy as any)._id?.toString(),
					userId: strategy.userId,
					hasUser: !!user,
					hasBrokerCreds: !!user?.brokerCredentials,
					freshBrokerStatus: {
						isConnected: freshBrokerStatus?.isConnected,
						hasClientId: !!freshBrokerStatus?.clientId,
						clientId: freshBrokerStatus?.clientId ? freshBrokerStatus.clientId.substring(0, 3) + '***' : null
					},
					userBrokerCreds: {
						isConnected: user?.brokerCredentials?.isConnected,
						hasClientId: !!user?.brokerCredentials?.clientId,
						clientId: user?.brokerCredentials?.clientId ? user.brokerCredentials.clientId.substring(0, 3) + '***' : null
					},
					monitorBrokerClientId: monitor?.brokerClientId ? monitor.brokerClientId.substring(0, 3) + '***' : null,
					finalBrokerClientId: brokerClientId ? brokerClientId.substring(0, 3) + '***' : null,
					isBrokerConnected,
					broker: user?.brokerCredentials?.broker
				});
				
				if (!brokerClientId || !isBrokerConnected) {
					logger.error("User broker not connected for live trading", {
						strategyId: (strategy as any)._id?.toString(),
						userId: strategy.userId,
						hasUser: !!user,
						freshBrokerStatus: {
							isConnected: freshBrokerStatus?.isConnected,
							hasClientId: !!freshBrokerStatus?.clientId
						},
						userBrokerCreds: {
							isConnected: user?.brokerCredentials?.isConnected,
							hasClientId: !!user?.brokerCredentials?.clientId
						},
						hasMonitorClientId: !!monitor?.brokerClientId,
						note: "Broker may have disconnected after strategy started. Please reconnect broker account."
					});
					throw new Error("Broker not connected. Please connect your broker account first.");
				}
				
				// Update monitor's brokerClientId if we got a fresh one (for future use)
				if (freshBrokerStatus?.clientId) {
					monitor.brokerClientId = freshBrokerStatus.clientId;
				}
				
				logger.info("Broker connection verified for live trading", {
					strategyId: (strategy as any)._id?.toString(),
					clientId: brokerClientId?.substring(0, 3) + '***',
					source: freshBrokerStatus?.clientId ? 'fresh_status' : 
							user?.brokerCredentials?.clientId ? 'user' : 'monitor'
				});

				// For OPTIONS strategies, resolve the option instrument
				if (isOptionsStrategy) {
					const instrumentDisplayName = (strategy as any).instrumentDisplayName || '';
					const tradeMode = (strategy.config as any).tradeMode || 'atm';
					const gap = (strategy.config as any).gap || 0;
					const expiry = (strategy.config as any).expiry;

					logger.info("Resolving option instrument for entry", {
						strategyId: (strategy as any)._id?.toString(),
						signal,
						price,
						instrumentDisplayName,
						tradeMode,
						gap,
						expiry
					});

					const optionResult = await optionsTradingHelper.resolveOptionInstrumentForEntry(
						price,
						signal,
						instrumentDisplayName,
						tradeMode,
						gap,
						expiry
					);

					if (!optionResult || !optionResult.instrument) {
						throw new Error(`Failed to resolve option instrument for ${signal} signal at price ${price}`);
					}

					optionInstrumentId = optionResult.instrument.exchangeInstrumentID;
					optionStrikePrice = optionResult.strikePrice;
					optionType = optionResult.optionType;

					logger.info("Option instrument resolved", {
						strategyId: (strategy as any)._id?.toString(),
						optionInstrumentId,
						optionStrikePrice,
						optionType,
						displayName: optionResult.instrument.displayName
					});

					// Prepare order parameters for options
					// Options are typically in NSEFO (segment 2), but check instrument's actual segment
					let optionsExchangeSegment = 'NSEFO'; // Default for options
					if (optionResult.instrument.exchangeSegment === 1) {
						optionsExchangeSegment = 'NSECM';
					} else if (optionResult.instrument.exchangeSegment === 2) {
						optionsExchangeSegment = 'NSEFO';
					} else if (optionResult.instrument.exchangeSegment === 11) {
						optionsExchangeSegment = 'BSECM';
					} else if (optionResult.instrument.exchangeSegment === 12) {
						optionsExchangeSegment = 'BSEFO';
					}
					
					if (!optionInstrumentId) {
						throw new Error('Option instrument ID is required for options order');
					}

					const orderParams = {
						exchangeSegment: optionsExchangeSegment,
						exchangeInstrumentID: optionInstrumentId,
						productType: strategy.config.productType || 'MIS',
						orderType: strategy.config.orderType || 'MARKET',
						orderSide: 'BUY' as const, // Always BUY for options entry (BUY CE or BUY PE)
						timeInForce: 'DAY',
						disclosedQuantity: 0,
						orderQuantity: Number(strategy.config.quantity), // Use number like test-trade.js
					limitPrice: strategy.config.orderType === 'LIMIT' ? price : 0,
					orderUniqueIdentifier: `${(strategy as any)._id.toString().slice(-8)}${Date.now().toString().slice(-12)}`, // Max 20 chars: last 8 of strategyId + last 12 of timestamp
					stopPrice: 0,
					clientID: brokerClientId,
				};

				logger.info("Placing live options order via dealer API", {
						strategyId: (strategy as any)._id?.toString(),
						symbol: optionResult.instrument.displayName,
						signal,
						optionType,
						strikePrice: optionStrikePrice,
						orderParams: {
							...orderParams,
							clientID: orderParams.clientID.substring(0, 3) + '***',
						},
					});

					// Place order through dealer API
					logger.info("Placing LIVE options order via dealer API", {
						strategyId: (strategy as any)._id?.toString(),
						exchangeSegment: optionsExchangeSegment,
						exchangeInstrumentID: optionInstrumentId,
						orderSide: 'BUY',
						orderQuantity: strategy.config.quantity
					});
					
					const orderResult = await dealerApiService.placeOrder(orderParams);
					orderId = (orderResult as any)?.AppOrderID?.toString() || (orderResult as any)?.OrderID?.toString();

					if (!orderId) {
						logger.error("Order placed but no order ID returned", {
							strategyId: (strategy as any)._id?.toString(),
							orderResult
						});
					}

					logger.info("✅ LIVE options order placed successfully", {
						strategyId: (strategy as any)._id?.toString(),
						orderId,
						optionInstrumentId,
						optionStrikePrice,
						optionType,
						symbol: optionResult.instrument.displayName,
						exchangeSegment: optionsExchangeSegment,
						orderQuantity: orderParams.orderQuantity,
						orderSide: orderParams.orderSide
					});
				} else {
					// Regular trading (stocks/futures) - use existing logic
					const orderParams = {
						exchangeSegment: strategy.exchangeSegment === 'NSECM' ? 'NSECM' : strategy.exchangeSegment,
						exchangeInstrumentID: strategy.exchangeInstrumentID,
						productType: strategy.config.productType || 'MIS',
						orderType: strategy.config.orderType || 'MARKET',
						orderSide: signal,
						timeInForce: 'DAY',
						disclosedQuantity: 0,
						orderQuantity: Number(strategy.config.quantity), // Use number like test-trade.js
						limitPrice: strategy.config.orderType === 'LIMIT' ? price : 0,
					orderUniqueIdentifier: `${(strategy as any)._id.toString().slice(-8)}${Date.now().toString().slice(-12)}`, // Max 20 chars: last 8 of strategyId + last 12 of timestamp
					stopPrice: 0,
					clientID: brokerClientId,
				};

				logger.info("Placing live order via dealer API", {
						strategyId: (strategy as any)._id?.toString(),
						symbol: strategy.symbol,
						signal,
						orderParams: {
							...orderParams,
							clientID: orderParams.clientID.substring(0, 3) + '***',
						},
					});

					// Place order through dealer API
					logger.info("Placing LIVE order via dealer API", {
						strategyId: (strategy as any)._id?.toString(),
						symbol: strategy.symbol,
						exchangeSegment: strategy.exchangeSegment,
						exchangeInstrumentID: strategy.exchangeInstrumentID,
						orderSide: signal,
						orderQuantity: strategy.config.quantity
					});
					
					const orderResult = await dealerApiService.placeOrder(orderParams);
					orderId = (orderResult as any)?.AppOrderID?.toString() || (orderResult as any)?.OrderID?.toString();

					if (!orderId) {
						logger.error("Order placed but no order ID returned", {
							strategyId: (strategy as any)._id?.toString(),
							orderResult
						});
					}

					logger.info("✅ LIVE order placed successfully", {
						strategyId: (strategy as any)._id?.toString(),
						orderId,
						symbol: strategy.symbol,
						exchangeSegment: strategy.exchangeSegment,
						signal,
						price,
						quantity: strategy.config.quantity,
						productType: strategy.config.productType,
						orderType: strategy.config.orderType
					});
				}
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				const errorStack = error instanceof Error ? error.stack : undefined;
				
				logger.error("❌ Failed to place LIVE order", {
					strategyId: (strategy as any)._id?.toString(),
					symbol: strategy.symbol,
					signal,
					price,
					error: errorMessage,
					stack: errorStack,
					isOptionsStrategy
				});
				
				// Log to strategy logs for user visibility
				await strategyLogService.log(
					strategy.userId.toString(),
					(strategy as any)._id.toString(),
					"error",
					"order",
					`Failed to place live order: ${errorMessage}`,
					{
						signal,
						price,
						error: errorMessage
					}
				);
				
				// Create trade record with ERROR status to show in trade history
				try {
					const entryMode = (strategy.config as any).entryMode;
					const isHLBreakout = entryMode === "highLowBreak" || monitor.highLowWatcher !== undefined;
					const highLowReference = monitor.highLowReference;

					const tradeMetadata: any = {
						error: errorMessage,
						orderRejected: true,
					};
					
					if (isHLBreakout && highLowReference) {
						tradeMetadata.trigger = "HIGH_LOW_BREAKOUT";
						tradeMetadata.referenceHigh = highLowReference.high;
						tradeMetadata.referenceLow = highLowReference.low;
						tradeMetadata.breakoutPrice = price;
						tradeMetadata.referenceTimestamp = highLowReference.timestamp;
					}

					if (isOptionsStrategy && optionInstrumentId && optionStrikePrice && optionType) {
						tradeMetadata.optionType = optionType;
						tradeMetadata.optionStrikePrice = optionStrikePrice;
						tradeMetadata.optionInstrumentID = optionInstrumentId;
						tradeMetadata.originalSignal = signal;
					}

					await Trade.create({
						userId: strategy.userId,
						strategyId: (strategy as any)._id,
						symbol: strategy.symbol,
						exchangeSegment: isOptionsStrategy && optionInstrumentId 
							? (strategy.exchangeSegment === 'NSECM' ? 'NSECM' : strategy.exchangeSegment)
							: strategy.exchangeSegment,
						exchangeInstrumentID: isOptionsStrategy && optionInstrumentId 
							? optionInstrumentId 
							: strategy.exchangeInstrumentID,
						orderType: strategy.config.orderType,
						productType: strategy.config.productType,
						side: isOptionsStrategy ? 'BUY' : signal,
						entryOrderId: undefined, // No order ID since order failed
						entryPrice: price,
						entryTime: new Date(),
						entryQuantity: strategy.config.quantity,
						stopLossPrice,
						takeProfitPrice,
						status: "ERROR",
						notes: `Order rejected: ${errorMessage}`,
						tags: isHLBreakout ? ["HL_BREAKOUT", "REJECTED"] : isOptionsStrategy ? ["OPTIONS", "REJECTED"] : ["REJECTED"],
						metadata: Object.keys(tradeMetadata).length > 0 ? tradeMetadata : undefined,
					});

					logger.info("Created ERROR trade record for rejected order", {
						strategyId: (strategy as any)._id?.toString(),
						symbol: strategy.symbol,
						error: errorMessage
					});
				} catch (tradeError) {
					logger.error("Failed to create ERROR trade record", {
						strategyId: (strategy as any)._id?.toString(),
						error: tradeError instanceof Error ? tradeError.message : String(tradeError)
					});
				}
				
				// Re-throw error to prevent normal trade creation
				throw error;
			}
		}

		// Validate required fields before creating trade
		if (!strategy.config.quantity || strategy.config.quantity <= 0) {
			logger.error("Invalid quantity for trade entry", {
				strategyId: (strategy as any)._id?.toString(),
				quantity: strategy.config.quantity,
			});
			throw new Error("Invalid trade quantity");
		}

		// Check if this is an HL breakout trade
		const entryMode = (strategy.config as any).entryMode;
		const isHLBreakout = entryMode === "highLowBreak" || monitor.highLowWatcher !== undefined;
		const highLowReference = monitor.highLowReference;

		// Create trade record in database
		const tradeMetadata: any = {};
		
		if (isHLBreakout && highLowReference) {
			tradeMetadata.trigger = "HIGH_LOW_BREAKOUT";
			tradeMetadata.referenceHigh = highLowReference.high;
			tradeMetadata.referenceLow = highLowReference.low;
			tradeMetadata.breakoutPrice = price;
			tradeMetadata.referenceTimestamp = highLowReference.timestamp;
		}

		// Add options-specific metadata
		if (isOptionsStrategy && optionInstrumentId && optionStrikePrice && optionType) {
			tradeMetadata.optionType = optionType;
			tradeMetadata.optionStrikePrice = optionStrikePrice;
			tradeMetadata.optionInstrumentID = optionInstrumentId;
			tradeMetadata.originalSignal = signal; // Store original signal (BUY/SELL)
		}

		const trade = await Trade.create({
			userId: strategy.userId,
			strategyId: (strategy as any)._id,
			symbol: strategy.symbol,
			exchangeSegment: isOptionsStrategy && optionInstrumentId 
				? (strategy.exchangeSegment === 'NSECM' ? 'NSECM' : strategy.exchangeSegment)
				: strategy.exchangeSegment,
			exchangeInstrumentID: isOptionsStrategy && optionInstrumentId 
				? optionInstrumentId 
				: strategy.exchangeInstrumentID,
			orderType: strategy.config.orderType,
			productType: strategy.config.productType,
			side: isOptionsStrategy ? 'BUY' : signal, // For options, always BUY (BUY CE or BUY PE)
			entryOrderId: orderId,
			entryPrice: price,
			entryTime: new Date(),
			entryQuantity: strategy.config.quantity,
			stopLossPrice,
			takeProfitPrice,
			status: "OPEN",
			// Add tags and metadata
			tags: isHLBreakout ? ["HL_BREAKOUT"] : isOptionsStrategy ? ["OPTIONS"] : undefined,
			metadata: Object.keys(tradeMetadata).length > 0 ? tradeMetadata : undefined,
		});

		// Update strategy with current position
		const positionData: any = {
			entryPrice: price,
			entryTime: new Date(),
			quantity: strategy.config.quantity,
			side: isOptionsStrategy ? 'BUY' : signal, // For options, always BUY
			currentPrice: price,
			unrealizedPnL: 0,
			stopLossPrice,
			takeProfitPrice,
		};

		// Add options-specific position data
		if (isOptionsStrategy && optionInstrumentId && optionStrikePrice && optionType) {
			positionData.optionType = optionType;
			positionData.optionStrikePrice = optionStrikePrice;
			positionData.optionInstrumentID = optionInstrumentId;
			positionData.originalSignal = signal; // Store original signal for exit logic
		}

		strategy.currentPosition = positionData;

		// Update performance metrics
		strategy.performance.totalTrades += 1;
		try {
			await updateStrategy((strategy as any)._id, {
				currentPosition: strategy.currentPosition,
				performance: strategy.performance
			});
		} catch (error) {
			console.log(error);
			logger.error("Failed to persist strategy after entry execution", {
				strategyId: (strategy as any)._id?.toString(),
				error:
					error instanceof Error
						? { message: error.message, stack: error.stack }
						: error,
			});
			throw error;
		}
		console.log('---');
		logger.info(`✅ Live trade executed successfully: ${signal} ${strategy.symbol} at ₹${price}`, {
			strategyId: (strategy as any)._id?.toString(),
			symbol: strategy.symbol,
			exchangeSegment: strategy.exchangeSegment,
			signal,
			price,
			quantity: strategy.config.quantity,
			orderId,
			isOptionsStrategy,
			stopLossPrice,
			takeProfitPrice
		});

	// Log trade entry
	const entryEmoji = signal === "BUY" ? "📈" : "📉";
	await strategyLogService.log(
		strategy.userId.toString(),
		(strategy as any)._id.toString(),
		"info",
		"order",
		`${entryEmoji} Position opened: ${signal} ${strategy.config.quantity} @ ₹${price} | Target: ₹${takeProfitPrice} | SL: ₹${stopLossPrice} | Segment: ${strategy.exchangeSegment}`,
		{
			signal,
			price,
			quantity: strategy.config.quantity,
			stopLossPrice,
			takeProfitPrice,
			exchangeSegment: strategy.exchangeSegment,
			orderId,
			isOptionsStrategy
		},
	);

		// Notify user via WebSocket
		websocketServer.emitTradeExecution(strategy.userId.toString(), {
			tradeId: trade._id,
			strategyId: (strategy as any)._id,
			signal,
			symbol: strategy.symbol,
			price,
			quantity: strategy.config.quantity,
			stopLoss: stopLossPrice,
			takeProfit: takeProfitPrice,
		});
	} catch (error: unknown) {
		logger.error(`Error executing entry: ${(error as Error).message}`);
		// Error will be handled by caller if needed
		throw error;
	}
}

