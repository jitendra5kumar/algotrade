import websocketMarketDataService from "../../../services/websocket-market-data.service";
import Strategy from "../../../models/Strategy.model";
import logger from "../../../utils/logger";
import type { MonitorState } from "../types";
import { getCandleTimestamp, getExchangeSegmentNumber, extractLtpFromQuote } from "../utils/helpers";
import { getMillisecondsUntilMarketClose } from "../../../utils/helpers";
import { resolveBrokerClientId } from "./broker-client";
import strategyLogService from "../../../services/strategy-log.service";

/**
 * Clear high/low watcher
 */
export function clearHighLowWatcher(monitor: MonitorState): void {
	const watcher = monitor.highLowWatcher;
	if (!watcher) return;

	// Reset processing flag if it exists
	if ((watcher as any).isProcessingBreak) {
		(watcher as any).isProcessingBreak = false;
	}

	// Clear timeout if exists
	if ((watcher as any).timeoutId) {
		try {
			clearTimeout((watcher as any).timeoutId);
		} catch (error) {
			logger.warn("Failed to clear watcher timeout", {
				strategyId: (monitor.strategy as any)._id?.toString(),
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// Unsubscribe from websocket
	if (watcher.subscriptionId) {
		try {
			websocketMarketDataService.unsubscribe(watcher.subscriptionId);
			logger.debug("High/low watcher unsubscribed", {
				strategyId: (monitor.strategy as any)._id?.toString(),
				subscriptionId: watcher.subscriptionId,
			});
		} catch (error) {
			logger.warn("Failed to unsubscribe high/low watcher", {
				strategyId: (monitor.strategy as any)._id?.toString(),
				subscriptionId: watcher.subscriptionId,
				error:
					error instanceof Error
						? { message: error.message, stack: error.stack }
						: error,
			});
		}
	}

	monitor.highLowWatcher = undefined;
	logger.info("High/low watcher cleared", {
		strategyId: (monitor.strategy as any)._id?.toString(),
	});
}

/**
 * Start websocket watcher to monitor high/low breakouts
 */
export async function startHighLowBreakWatcher(
	monitor: MonitorState,
	signal: "BUY" | "SELL",
	referenceCandle: any,
	_monitors: Map<string, MonitorState>,
	emitter?: any,
): Promise<void> {
	const { strategy } = monitor;
	const strategyId = (strategy as any)._id?.toString();
	
	logger.info("Starting High/Low Break watcher", {
		strategyId,
		symbol: strategy.symbol,
		signal,
		referenceCandle: {
			high: referenceCandle.high,
			low: referenceCandle.low,
			close: referenceCandle.close,
			timestamp: referenceCandle.timestamp,
		},
	});

	const brokerClientId = await resolveBrokerClientId(monitor);
	if (!brokerClientId) {
		logger.warn("Cannot start high/low watcher without broker client ID", {
			strategyId,
			userId: monitor.strategy.userId?.toString?.(),
		});
		return;
	}

	const referenceTimestamp = getCandleTimestamp(referenceCandle);
	const high = referenceCandle.high;
	const low = referenceCandle.low;

	if (!Number.isFinite(high) || !Number.isFinite(low)) {
		logger.warn("Cannot start high/low watcher due to invalid reference candle values", {
			strategyId,
			symbol: strategy.symbol,
			high,
			low,
			referenceCandle,
		});
		return;
	}

	const exchangeInstrumentID = strategy.exchangeInstrumentID;
	const exchangeSegmentNumber = getExchangeSegmentNumber(
		strategy.exchangeSegment,
	);
	if (!exchangeInstrumentID || exchangeInstrumentID <= 0) {
		logger.warn("Missing exchangeInstrumentID for high/low watcher", {
			strategyId,
			symbol: strategy.symbol,
			exchangeSegment: strategy.exchangeSegment,
		});
		return;
	}

	// Clear any existing watcher before starting new one
	clearHighLowWatcher(monitor);
	
	logger.info("Watcher cleared, starting new high/low watcher subscription", {
		strategyId,
		symbol: strategy.symbol,
		exchangeInstrumentID,
		exchangeSegmentNumber,
	});
	try {
		if (!websocketMarketDataService.isActive()) {
			await websocketMarketDataService.start(brokerClientId);
		}
	} catch (error) {
		logger.error("Failed to start market data websocket", {
			strategyId: (strategy as any)._id?.toString(),
			error:
				error instanceof Error
					? { message: error.message, stack: error.stack }
					: error,
		});
		return;
	}

	const instruments = [
		{
			exchangeSegment: exchangeSegmentNumber,
			exchangeInstrumentID
		},
	];
	
	logger.info("Subscribing to websocket market data", {
		strategyId,
		symbol: strategy.symbol,
		instruments,
		brokerClientId,
	});
	
	let subscriptionId: string;
	try {
		subscriptionId = websocketMarketDataService.subscribeWithCallback(
			strategy.userId.toString(),
			instruments,
			async (message) => {
				try {
					const data = (message.data as Record<string, unknown>) ??
						(message as Record<string, unknown>);

					// Parse JSON only if it's a string, otherwise use as-is
					let messageObject: Record<string, unknown>;
					if (typeof data === 'string') {
						try {
							messageObject = JSON.parse(data);
						} catch (parseError) {
							logger.warn("Failed to parse websocket message as JSON", {
								strategyId: (strategy as any)._id?.toString(),
								error: parseError instanceof Error ? parseError.message : String(parseError),
							});
							return;
						}
					} else {
						messageObject = data as Record<string, unknown>;
					}

					// IMPORTANT: Verify this quote is for the correct instrument
					const instrumentIdentifier = messageObject.InstrumentIdentifier as Record<string, unknown> | undefined;
					const quoteInstrumentID = 
						messageObject.ExchangeInstrumentID || 
						messageObject.exchangeInstrumentID ||
						instrumentIdentifier?.ExchangeInstrumentID;
					
					// Compare as numbers to handle type mismatches (string vs number)
					if (quoteInstrumentID && Number(quoteInstrumentID) !== Number(exchangeInstrumentID)) {
						// This quote is for a different instrument, ignore it
						return;
					}

					// Accept quotes with valid LTP data
					// MessageCode 1512 = Touchline quotes (preferred), but accept any quote with valid price data
					// Only reject if MessageCode indicates an error or invalid message type
					const messageCode = messageObject.MessageCode;
					if (messageCode !== undefined && messageCode !== null) {
						// Reject error codes (typically negative or very high numbers)
						if (typeof messageCode === 'number' && (messageCode < 0 || messageCode > 9999)) {
							logger.debug('Rejecting quote with invalid MessageCode', {
								strategyId: (strategy as any)._id?.toString(),
								messageCode,
							});
							return;
						}
						// Log non-touchline quotes for monitoring but still process them
						if (messageCode !== 1512) {
							logger.debug('Processing non-touchline quote', {
								strategyId: (strategy as any)._id?.toString(),
								messageCode,
							});
						}
					}

					const ltp = extractLtpFromQuote(message);

					if (ltp === null || !Number.isFinite(ltp)) {
						logger.debug("Invalid LTP in websocket message, skipping", {
							strategyId,
							messageKeys: Object.keys(messageObject),
						});
						return;
					}

					const buyBreak = signal === "BUY" && ltp >= high;
					const sellBreak = signal === "SELL" && ltp <= low;

					logger.debug("High/Low watcher price check", {
						strategyId,
						symbol: strategy.symbol,
						ltp,
						referenceHigh: high,
						referenceLow: low,
						signal,
						buyBreak,
						sellBreak,
					});

					if (buyBreak || sellBreak) {
						// CRITICAL: Prevent race condition - check if already processing break
						if (monitor.highLowWatcher?.isProcessingBreak) {
							logger.debug("Break already being processed, ignoring duplicate quote", {
								strategyId: (strategy as any)._id?.toString(),
								ltp,
							});
							return;
						}

						// Set processing flag immediately to prevent duplicate processing
						if (monitor.highLowWatcher) {
							monitor.highLowWatcher.isProcessingBreak = true;
						}

						try {
							// Fetch fresh strategy data to check current position
							const freshStrategy = await Strategy.findById((strategy as any)._id);
							if (!freshStrategy) {
								logger.warn("Strategy not found when high/low break occurred", {
									strategyId: (strategy as any)._id?.toString(),
								});
								clearHighLowWatcher(monitor);
								return;
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

							// Additional validation: Check if position side matches the signal
							// If we already have a position in the same direction, don't enter again
							const positionSideMatches = hasCurrentPosition && 
								currentPosition.side === signal;

							if (positionSideMatches) {
								logger.info(
									`High/Low break detected but position already exists in same direction - skipping entry`,
									{
										strategyId: (strategy as any)._id?.toString(),
										action: signal,
										currentPosition: currentPosition.side,
										ltp,
									},
								);
								// Reset processing flag and don't clear watcher - it might trigger again for opposite direction
								if (monitor.highLowWatcher) {
									monitor.highLowWatcher.isProcessingBreak = false;
								}
								return;
							}

							// CRITICAL: Clear watcher BEFORE emitting signal to prevent duplicate emissions
							// This ensures that even if multiple quotes come in, we only process the break once
							clearHighLowWatcher(monitor);
							
							logger.info(
								`High/Low break confirmed for ${strategy.symbol} @${ltp}`,
								{
									strategyId: (strategy as any)._id?.toString(),
									action: signal,
									referenceTimestamp,
									ltp,
									high,
									low,
									hasPosition: hasCurrentPosition,
									breakType: buyBreak ? 'BUY_BREAK' : 'SELL_BREAK',
								},
							);

							// Log high-low break detected (simplified - watcher already logged setup)
							await strategyLogService.log(
								strategy.userId.toString(),
								(strategy as any)._id.toString(),
								"info",
								"signal",
								`Break confirmed: ${signal} at ₹${ltp} (${signal === "BUY" ? `High ₹${high}` : `Low ₹${low}`} broken)`,
								{
									signal,
									breakPrice: ltp,
									high,
									low,
									hasPosition: hasCurrentPosition,
									trigger: "HIGH_LOW_BREAK",
								},
							);

							if (!hasCurrentPosition) {
								// No position - emit signal for new entry
								// Watcher is already cleared above, so no duplicate processing possible
								if (emitter) {
									logger.info(
										`Emitting signal_generated for high-low break entry: ${signal} at ₹${ltp}`,
										{
											strategyId: (strategy as any)._id?.toString(),
											signal,
											price: ltp,
											referenceTimestamp,
										}
									);
									emitter.emit("signal_generated", {
										strategyId: (strategy as any)._id.toString(),
										signal,
										price: ltp,
										trendState: monitor.trendState,
										trigger: "HIGH_LOW_BREAK",
									});
								} else {
									logger.error(
										`CRITICAL: No emitter available to emit signal_generated for high-low break`,
										{
											strategyId: (strategy as any)._id?.toString(),
											signal,
											price: ltp,
										}
									);
								}
							} else {
								// Position exists but in opposite direction - emit trend flip event
								if (emitter) {
									emitter.emit("trend_flip_with_high_low", {
										strategyId: (strategy as any)._id.toString(),
										signal,
										price: ltp,
										trendState: monitor.trendState,
										trigger: "HIGH_LOW_BREAK",
									});
								}
							}
						} catch (error) {
							// Reset processing flag on error
							if (monitor.highLowWatcher) {
								monitor.highLowWatcher.isProcessingBreak = false;
							}
							throw error;
						}
					}
				} catch (error) {
					logger.error("High/low watcher callback error", {
						strategyId: (strategy as any)._id?.toString(),
						error:
							error instanceof Error
								? { message: error.message, stack: error.stack }
								: error,
					});
				}
			},
		);
	} catch (error) {
		logger.error("Failed to subscribe to market data for high/low watcher", {
			strategyId: (strategy as any)._id?.toString(),
			error:
				error instanceof Error
					? { message: error.message, stack: error.stack }
					: error,
		});
		return;
	}

	monitor.highLowWatcher = {
		subscriptionId,
		action: signal,
		referenceTimestamp,
		high,
		low,
	};

	// Calculate timeout based on market close time
	const millisecondsUntilClose = getMillisecondsUntilMarketClose(strategy.exchangeSegment);
	const timeoutDuration = millisecondsUntilClose || (60 * 60 * 1000); // Default to 60 minutes if market closed
	const timeoutMinutes = Math.round(timeoutDuration / (60 * 1000));

	logger.info("High/Low break watcher started", {
		strategyId: (strategy as any)._id?.toString(),
		action: signal,
		exchangeInstrumentID,
		high,
		low,
		referenceTimestamp,
		timeoutMinutes,
		timeoutType: millisecondsUntilClose ? "market_close" : "fixed_60min",
	});

	// Store timeout ID for potential cleanup
	const timeoutId = setTimeout(() => {
		if (
			monitor.highLowWatcher &&
			monitor.highLowWatcher.subscriptionId === subscriptionId
		) {
			logger.info("High/Low watcher timed out - auto cleanup", {
				strategyId: (strategy as any)._id?.toString(),
				action: signal,
				referenceTimestamp,
				timeoutMinutes,
			});
			clearHighLowWatcher(monitor);
		}
	}, timeoutDuration);

	// Store timeout ID in watcher for potential manual cleanup
	(monitor.highLowWatcher as any).timeoutId = timeoutId;
}

