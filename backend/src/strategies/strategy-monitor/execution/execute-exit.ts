import Trade from "../../../models/Trade.model";
import User from "../../../models/User.model";
import logger from "../../../utils/logger";
import websocketServer from "../../../websocket/websocket.server";
import { updateStrategy } from "../../strategy-query.service";
import type { MonitorState } from "../types";
import strategyLogService from "../../../services/strategy-log.service";
import dealerApiService from "../../../services/dealer-api.service";
import optionsTradingHelper from "../../../services/options-trading-helper.service";

/**
 * Execute exit (close position)
 */
export async function executeExit(
	monitor: MonitorState,
	exitPrice: number,
	exitReason:
		| "TAKE_PROFIT"
		| "STOP_LOSS"
		| "MANUAL"
		| "TIME_EXIT"
		| "TREND_FLIP",
	_monitors: Map<string, MonitorState>,
): Promise<void> {
	console.log('exit with reason - ', exitReason);
	const { strategy } = monitor;
	const position = strategy.currentPosition;

	if (!position) {
		logger.warn("Attempted exit with no open position");
		return;
	}

	try {
		let orderId: string | undefined;

		// Check if this is an OPTIONS strategy
		const isOptionsStrategy = strategy.type === 'OPTIONS';
		const positionOptionType = (position as any).optionType as 'CE' | 'PE' | undefined;
		const positionOptionStrike = (position as any).optionStrikePrice as number | undefined;
		const positionOptionInstrumentID = (position as any).optionInstrumentID as number | undefined;

		// Place exit order (LIVE trading only)
		{
			logger.info("Executing LIVE trade exit", {
				strategyId: (strategy as any)._id?.toString(),
				symbol: strategy.symbol,
				exitReason,
				exitPrice
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
				logger.info("Checking broker connection for exit", {
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
					logger.error("User broker not connected for live trading exit", {
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
				
				logger.info("Broker connection verified for live exit", {
					strategyId: (strategy as any)._id?.toString(),
					clientId: brokerClientId?.substring(0, 3) + '***',
					source: freshBrokerStatus?.clientId ? 'fresh_status' : 
							user?.brokerCredentials?.clientId ? 'user' : 'monitor'
				});

				if (isOptionsStrategy && positionOptionType && positionOptionStrike && positionOptionInstrumentID) {
					// Options exit: SELL the same option (CE or PE) that was bought
					const instrumentDisplayName = (strategy as any).instrumentDisplayName || '';
					
					logger.info("Resolving option instrument for exit", {
						strategyId: (strategy as any)._id?.toString(),
						positionOptionType,
						positionOptionStrike,
						positionOptionInstrumentID,
						instrumentDisplayName
					});

					// Resolve the option instrument for exit (same strike and type)
					const exitInstrument = await optionsTradingHelper.resolveOptionInstrumentForExit(
						positionOptionType,
						positionOptionStrike,
						instrumentDisplayName
					);

					if (!exitInstrument) {
						throw new Error(`Failed to resolve option instrument for exit: ${positionOptionType} ${positionOptionStrike}`);
					}

					// For options exit, always SELL (opposite of entry BUY)
					// Options are typically in NSEFO (segment 2), but check instrument's actual segment
					let optionsExchangeSegment = 'NSEFO'; // Default for options
					if (exitInstrument.exchangeSegment === 1) {
						optionsExchangeSegment = 'NSECM';
					} else if (exitInstrument.exchangeSegment === 2) {
						optionsExchangeSegment = 'NSEFO';
					} else if (exitInstrument.exchangeSegment === 11) {
						optionsExchangeSegment = 'BSECM';
					} else if (exitInstrument.exchangeSegment === 12) {
						optionsExchangeSegment = 'BSEFO';
					}
					
					const orderParams = {
						exchangeSegment: optionsExchangeSegment,
						exchangeInstrumentID: exitInstrument.exchangeInstrumentID,
						productType: strategy.config.productType || 'MIS',
						orderType: strategy.config.orderType || 'MARKET',
						orderSide: 'SELL' as const, // Always SELL for options exit
						timeInForce: 'DAY',
						disclosedQuantity: 0,
						orderQuantity: Number(position.quantity), // Use number like test-trade.js
						limitPrice: strategy.config.orderType === 'LIMIT' ? exitPrice : 0,
					orderUniqueIdentifier: `${(strategy as any)._id.toString().slice(-8)}${Date.now().toString().slice(-12)}`, // Max 20 chars: last 8 of strategyId + last 12 of timestamp
					stopPrice: 0,
					clientID: brokerClientId,
				};

					logger.info("Placing live options exit order via dealer API", {
						strategyId: (strategy as any)._id?.toString(),
						symbol: exitInstrument.displayName,
						optionType: positionOptionType,
						strikePrice: positionOptionStrike,
						orderParams: {
							...orderParams,
							clientID: orderParams.clientID.substring(0, 3) + '***',
						},
					});

					// Place exit order through dealer API
					logger.info("Placing LIVE options exit order via dealer API", {
						strategyId: (strategy as any)._id?.toString(),
						exchangeSegment: optionsExchangeSegment,
						exchangeInstrumentID: exitInstrument.exchangeInstrumentID,
						orderSide: 'SELL',
						orderQuantity: position.quantity
					});
					
					const orderResult = await dealerApiService.placeOrder(orderParams);
					orderId = (orderResult as any)?.AppOrderID?.toString() || (orderResult as any)?.OrderID?.toString();

					if (!orderId) {
						logger.error("Exit order placed but no order ID returned", {
							strategyId: (strategy as any)._id?.toString(),
							orderResult
						});
					}

					logger.info("✅ LIVE options exit order placed successfully", {
						strategyId: (strategy as any)._id?.toString(),
						orderId,
						optionType: positionOptionType,
						strikePrice: positionOptionStrike,
						symbol: exitInstrument.displayName
					});
				} else {
					// Regular trading (stocks/futures) - use existing square off logic
					// Determine exit side (opposite of entry)
					const exitSide = position.side === 'BUY' ? 'SELL' : 'BUY';

					// Determine squareoffMode based on product type
					// DayWise = Square off today's positions (for MIS/intraday)
					// NetWise = Square off net position (for NRML/CNC)
					const productType = strategy.config.productType || 'MIS';
					const squareoffMode = productType === 'MIS' ? 'DayWise' : 'NetWise';

					// Use square off for exit
					const squareOffParams = {
						exchangeSegment: strategy.exchangeSegment === 'NSECM' ? 'NSECM' : strategy.exchangeSegment,
						exchangeInstrumentID: strategy.exchangeInstrumentID,
						productType: productType,
					squareoffMode: squareoffMode, // DayWise for MIS, NetWise for NRML/CNC
					squareOffQtyValue: position.quantity,
					clientID: brokerClientId,
					positionSquareOffQuantityType: 'ExactQty',
				};

					logger.info("Placing live exit order via dealer API (square off)", {
						strategyId: (strategy as any)._id?.toString(),
						symbol: strategy.symbol,
						exitSide,
						squareOffParams: {
							...squareOffParams,
							clientID: squareOffParams.clientID.substring(0, 3) + '***',
						},
					});

					// Square off position through dealer API
					logger.info("Placing LIVE exit order via dealer API (square off)", {
						strategyId: (strategy as any)._id?.toString(),
						symbol: strategy.symbol,
						exchangeSegment: strategy.exchangeSegment,
						exchangeInstrumentID: strategy.exchangeInstrumentID,
						squareoffMode: exitSide,
						squareOffQtyValue: position.quantity
					});
					
					const squareOffResult = await dealerApiService.squareOff(squareOffParams);
					orderId = (squareOffResult as any)?.AppOrderID?.toString() || (squareOffResult as any)?.OrderID?.toString();

					if (!orderId) {
						logger.error("Square off order placed but no order ID returned", {
							strategyId: (strategy as any)._id?.toString(),
							squareOffResult
						});
					}

					logger.info("✅ LIVE exit order placed successfully (square off)", {
						strategyId: (strategy as any)._id?.toString(),
						orderId,
						symbol: strategy.symbol,
						exitSide,
						exitPrice
					});
				}
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				const errorStack = error instanceof Error ? error.stack : undefined;
				
				logger.error("❌ Failed to place LIVE exit order", {
					strategyId: (strategy as any)._id?.toString(),
					symbol: strategy.symbol,
					exitReason,
					exitPrice,
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
					`Failed to place live exit order: ${errorMessage}`,
					{
						exitReason,
						exitPrice,
						error: errorMessage
					}
				);
				
				// Re-throw error to prevent trade update if order placement fails
				throw error;
			}
		}

		// Find latest open trade and update it
		const trade = await Trade.findOne({
			strategyId: (strategy as any)._id,
			status: "OPEN",
		}).sort({ createdAt: -1 });

		if (trade) {
			trade.exitOrderId = orderId;
			trade.exitPrice = exitPrice;
			trade.exitTime = new Date();
			trade.exitQuantity = position.quantity;
			trade.exitReason = exitReason;
			trade.status = "CLOSED";
			// P&L calculated automatically by database pre-save hook
			await trade.save();

			// Update strategy performance metrics
			if (trade.netProfit > 0) {
				strategy.performance.winningTrades += 1;
				strategy.performance.totalProfit += trade.netProfit;
			} else {
				strategy.performance.losingTrades += 1;
				strategy.performance.totalLoss += Math.abs(trade.netProfit);
				// Note: Daily loss tracker update is handled in event handler
			}

			// Recalculate performance metrics
			strategy.performance.netProfit =
				strategy.performance.totalProfit - strategy.performance.totalLoss;
			strategy.performance.winRate =
				(strategy.performance.winningTrades /
					strategy.performance.totalTrades) *
				100;
			strategy.performance.avgWinAmount =
				strategy.performance.totalProfit /
				Math.max(strategy.performance.winningTrades, 1);
			strategy.performance.avgLossAmount =
				strategy.performance.totalLoss /
				Math.max(strategy.performance.losingTrades, 1);
			strategy.performance.profitFactor =
				strategy.performance.totalProfit /
				Math.max(strategy.performance.totalLoss, 1);
			strategy.performance.lastUpdated = new Date();

			logger.info(
				`Trade closed: ${exitReason} - P&L: ₹${trade.netProfit.toFixed(2)}`,
			);

		// Log trade exit
		const exitReasonStr = String(exitReason);
		const exitReasonText = exitReasonStr === 'STOP_LOSS' ? 'Stop Loss' :
		                       exitReasonStr === 'TAKE_PROFIT' ? 'Target' :
		                       exitReasonStr === 'TREND_FLIP' ? 'Trend Reversal' :
		                       exitReasonStr === 'TRAILING_STOP' ? 'Trailing Stop' :
		                       exitReasonStr === 'TIME_BASED' ? 'Time Exit' :
		                       exitReasonStr === 'TIME_EXIT' ? 'Time Exit' : 'Manual';
		const profitEmoji = trade.netProfit >= 0 ? "💰" : "📉";
		const profitText = trade.netProfit >= 0 ? "Profit" : "Loss";
		
		await strategyLogService.log(
			strategy.userId.toString(),
			(strategy as any)._id.toString(),
			trade.netProfit >= 0 ? "info" : "warn",
			"order",
			`${profitEmoji} Position closed (${exitReasonText}) - ${profitText}: ₹${Math.abs(trade.netProfit).toFixed(2)} (${trade.profitPercentage >= 0 ? '+' : ''}${trade.profitPercentage.toFixed(2)}%)`,
			{
				exitReason,
				exitPrice,
				entryPrice: trade.entryPrice,
				netProfit: trade.netProfit,
				profitPercentage: trade.profitPercentage,
			},
		);

			// Notify user via WebSocket
			websocketServer.emitTradeExecution(strategy.userId.toString(), {
				tradeId: trade._id,
				strategyId: (strategy as any)._id,
				exitReason,
				symbol: strategy.symbol,
				exitPrice,
				netProfit: trade.netProfit,
				profitPercentage: trade.profitPercentage,
			});
		}

		// Clear current position
		strategy.currentPosition = undefined;
		try {
			console.log('strategy', strategy);
			await updateStrategy((strategy as any)._id, {
				performance: strategy.performance,
				currentPosition: undefined
			});
		} catch (error) {
			logger.error("Failed to persist strategy after exit execution", {
				strategyId: (strategy as any)._id?.toString(),
				error:
					error instanceof Error
						? { message: error.message, stack: error.stack }
						: error,
			});
		}
	} catch (error: unknown) {
		logger.error(`Error executing exit: ${(error as Error).message}`);
		// Error will be handled by caller if needed
		throw error;
	}
}

