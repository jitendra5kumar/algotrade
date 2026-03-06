import websocketServer from "../../../websocket/websocket.server";
import logger from "../../../utils/logger";
import { updateStrategy } from "../../strategy-query.service";
import type { MonitorState } from "../types";
import { executeEntry } from "../execution/execute-entry";
import { executeExit } from "../execution/execute-exit";
import Trade from "../../../models/Trade.model";
import strategyLogService from "../../../services/strategy-log.service";

/**
 * Handle signal generation event
 */
export async function handleSignal(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
): Promise<void> {
	try {
		const strategyId = data.strategyId as string;
		if (!strategyId) {
			logger.warn("handleSignal called without strategyId", { data });
			return;
		}

		const monitor = monitors.get(strategyId);
		if (!monitor) {
			logger.warn("Monitor not found for strategy", { strategyId });
			return;
		}

		const { strategy } = monitor;
		const signal = data.signal as "BUY" | "SELL" | undefined;
		const price = data.price as number | undefined;

		if (!signal || !price || !Number.isFinite(price)) {
			logger.warn("Invalid signal data", {
				strategyId,
				signal,
				price,
			});
			return;
		}

		console.log(`handling signal @ ${price}`);

	logger.info(
		`Signal generated for ${strategy.name}: ${signal} at ₹${price}`,
	);

	// Log signal generation (skip if from high-low break - already logged in watcher)
	const trigger = (data.trigger as string) || "CANDLE_CLOSE";
	if (trigger !== "HIGH_LOW_BREAK") {
		const signalEmoji = signal === "BUY" ? "🔔" : "🔔";
		await strategyLogService.log(
			strategy.userId.toString(),
			(strategy as any)._id.toString(),
			"info",
			"signal",
			`${signalEmoji} ${signal} signal generated at ₹${price} - Preparing to enter`,
			{
				signal,
				price,
				trigger,
			},
		);
	}

		// Check if market is closed (after 3:30 PM) - save to pending trades instead of executing
		const { shouldPlaceTrade, getNextMarketOpenTime } = await import("../../../utils/helpers");
		if (!shouldPlaceTrade(strategy.exchangeSegment)) {
			logger.info(
				`Market closing soon, saving signal as pending trade for ${strategy.name}: ${signal} at ₹${price}`,
			);

			// Import pending trade service
			const pendingTradeService = (await import("../../../services/pending-trade.service")).default;

			// Get reference candle if available (for high-low break)
			const referenceCandle = monitor.highLowWatcher && 
				monitor.highLowWatcher.high !== null && 
				monitor.highLowWatcher.low !== null && 
				monitor.highLowWatcher.referenceTimestamp !== null ? {
				high: monitor.highLowWatcher.high,
				low: monitor.highLowWatcher.low,
				timestamp: new Date(monitor.highLowWatcher.referenceTimestamp),
			} : undefined;

			// Save as pending trade with scheduled execution time
			await pendingTradeService.createPendingTrade({
				userId: strategy.userId.toString(),
				strategyId: (strategy as any)._id.toString(),
				symbol: strategy.symbol,
				exchangeSegment: strategy.exchangeSegment,
				exchangeInstrumentID: strategy.exchangeInstrumentID,
				orderType: strategy.config.orderType || 'MARKET',
				productType: strategy.config.productType || 'MIS',
				side: signal as 'BUY' | 'SELL',
				quantity: strategy.config.quantity || strategy.config.maxPositionSize,
				signalPrice: price as number,
				referenceCandle,
				scheduledExecutionTime: getNextMarketOpenTime(), // Execute at next market open
			});

		// Log pending trade creation
		await strategyLogService.log(
			strategy.userId.toString(),
			(strategy as any)._id.toString(),
			"info",
			"signal",
			`⏰ Market closing - ${signal} signal saved for next trading day opening at 9:15 AM`,
			{
				signal,
				price,
				trigger: "PENDING_TRADE",
				pendingExecution: true,
			},
		);

			return; // Don't execute immediately
		}

		// Calculate stop loss and take profit prices (in points, not percentage)
		const slPoints = (strategy.config as any).stopLossPoints || 0;
		const tpPoints = (strategy.config as any).targetPoints || 0;

		let stopLossPrice = 0;
		let takeProfitPrice = 0;

		// Calculate stop loss price in points
		if (slPoints > 0) {
			if (signal === "BUY") {
				stopLossPrice = (price as number) - slPoints;
			} else {
				stopLossPrice = (price as number) + slPoints;
			}
		}

		// Calculate take profit price in points
		if (tpPoints > 0) {
			if (signal === "BUY") {
				takeProfitPrice = (price as number) + tpPoints;
			} else {
				takeProfitPrice = (price as number) - tpPoints;
			}
		}
		console.log('Execute strategy - Trade entry');
		
		// Notify user before execution
		websocketServer.emitStrategySignal(data.strategyId as string, {
			signal,
			price,
			stopLoss: stopLossPrice,
			takeProfit: takeProfitPrice,
			timestamp: Date.now(),
		});

		// Execute the entry trade with comprehensive logging
		try {
			logger.info(`🚀 Executing ${signal} trade for ${strategy.name} at ₹${price}`, {
				strategyId: (strategy as any)._id.toString(),
				signal,
				price,
				exchangeSegment: strategy.exchangeSegment,
				symbol: strategy.symbol,
				stopLossPrice,
				takeProfitPrice,
				hasPosition: !!strategy.currentPosition,
				positionSide: strategy.currentPosition?.side
			});
			
			await executeEntry(
				monitor,
				signal as "BUY" | "SELL",
				price as number,
				stopLossPrice,
				takeProfitPrice,
				monitors,
			);
			
			logger.info(`✅ Trade executed successfully for ${strategy.name}`, {
				strategyId: (strategy as any)._id.toString(),
				signal,
				price,
				exchangeSegment: strategy.exchangeSegment,
				symbol: strategy.symbol
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;
			
			logger.error(`❌ CRITICAL: Failed to execute trade for ${strategy.name}`, {
				strategyId: (strategy as any)._id.toString(),
				signal,
				price,
				exchangeSegment: strategy.exchangeSegment,
				symbol: strategy.symbol,
				error: errorMessage,
				stack: errorStack
			});
			
			// Log to strategy logs so user can see the error
			await strategyLogService.log(
				strategy.userId.toString(),
				(strategy as any)._id.toString(),
				"error",
				"order",
				`❌ Trade execution failed: ${errorMessage}`,
				{
					signal,
					price,
					error: errorMessage,
					exchangeSegment: strategy.exchangeSegment,
					symbol: strategy.symbol
				}
			);
			
			// Re-throw to ensure it's not silently ignored
			throw error;
		}
	} catch (error: unknown) {
		logger.error(`Error handling signal: ${(error as Error).message}`);
	}
}

/**
 * Handle stop loss event
 */
export async function handleStopLoss(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
	dailyLossTracker?: Map<string, number>,
): Promise<void> {
	const { strategyId, currentPrice, loss } = data;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	logger.warn(
		`Stop Loss hit for ${monitor.strategy.symbol}: Loss ${(loss as number).toFixed(2)}%`,
	);
	console.log("Strategy execution - Exit by Stop Loss hit for " + monitor.strategy.symbol);
	
	// Log stop loss hit
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"warn",
		"risk",
		`🛑 Position closed - Stop Loss triggered (Loss: ${(loss as number).toFixed(2)}%)`,
		{
			currentPrice,
			loss: (loss as number).toFixed(2),
			exitReason: "STOP_LOSS",
		},
	);

	try {
		await executeExit(monitor, currentPrice as number, "STOP_LOSS", monitors);
		
		// Update daily loss tracker if trade resulted in loss
		if (dailyLossTracker) {
			const trade = await Trade.findOne({
				strategyId: (monitor.strategy as any)._id,
				status: "CLOSED",
			}).sort({ createdAt: -1 });
			
			if (trade && trade.netProfit < 0) {
				const userId = monitor.strategy.userId.toString();
				const currentDailyLoss = dailyLossTracker.get(userId) || 0;
				dailyLossTracker.set(userId, currentDailyLoss + Math.abs(trade.netProfit));
			}
		}
	} catch (error) {
		logger.error(`Error in executeExit from handleStopLoss: ${(error as Error).message}`);
	}

	websocketServer.emitNotification(monitor.strategy.userId.toString(), {
		type: "warning",
		title: "Stop Loss Triggered",
		message: `${monitor.strategy.name}: Position closed at ₹${currentPrice} (Loss: ${(loss as number).toFixed(2)}%)`,
	});
}

/**
 * Handle take profit event
 */
export async function handleTakeProfit(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
): Promise<void> {
	const { strategyId, currentPrice, profit } = data;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	logger.info(
		`Take Profit hit for ${monitor.strategy.symbol}: Profit ${(profit as number).toFixed(2)}%`,
	);
	console.log("Strategy execution - Exit by Take Profit hit for " + monitor.strategy.symbol);
	
	// Log take profit hit
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"info",
		"risk",
		`✅ Target achieved - Position closed with profit (${(profit as number).toFixed(2)}%)`,
		{
			currentPrice,
			profit: (profit as number).toFixed(2),
			exitReason: "TAKE_PROFIT",
		},
	);

	try {
		await executeExit(monitor, currentPrice as number, "TAKE_PROFIT", monitors);
	} catch (error) {
		logger.error(`Error in executeExit from handleTakeProfit: ${(error as Error).message}`);
	}

	websocketServer.emitNotification(monitor.strategy.userId.toString(), {
		type: "success",
		title: "Take Profit Achieved",
		message: `${monitor.strategy.name}: Position closed at ₹${currentPrice} (Profit: ${(profit as number).toFixed(2)}%)`,
	});
}

/**
 * Handle trailing stop event
 */
export async function handleTrailingStop(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
): Promise<void> {
	const { strategyId, currentPrice, trailingStop } = data as any;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	logger.warn(
		`Trailing Stop hit for ${monitor.strategy.symbol}: Exit at ₹${currentPrice} (TSL: ₹${trailingStop})`,
	);
	console.log("Strategy execution - Exit by Trailing Stop hit for " + monitor.strategy.symbol);
	
	// Log trailing stop hit
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"warn",
		"risk",
		`📊 Trailing Stop hit - Position closed at ₹${currentPrice} (locked in profit)`,
		{
			currentPrice,
			trailingStop,
			exitReason: "TRAILING_STOP",
		},
	);

	await executeExit(monitor, currentPrice as number, "STOP_LOSS", monitors);

	websocketServer.emitNotification(monitor.strategy.userId.toString(), {
		type: "warning",
		title: "Trailing Stop Triggered",
		message: `${monitor.strategy.name}: Position closed at ₹${currentPrice} (Trailing Stop)`,
	});
}

/**
 * Handle trend flip exit event
 */
export async function handleTrendFlip(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
): Promise<void> {
	const { strategyId, currentPrice, newDirection } = data as any;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	logger.warn(
		`Trend flip exit for ${monitor.strategy.symbol}: Exit at ₹${currentPrice} (Direction: ${newDirection})`,
	);
	
	// Log trend flip exit
	const trendText = newDirection === "UPTREND" ? "Bullish" : newDirection === "DOWNTREND" ? "Bearish" : "Neutral";
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"warn",
		"trend",
		`🔄 Position closed - Market trend reversed (now ${trendText})`,
		{
			currentPrice,
			newDirection,
			exitReason: "TREND_FLIP",
		},
	);

	try {
		await executeExit(monitor, currentPrice as number, "TREND_FLIP", monitors);
		
		// Refresh strategy from database after exit to ensure currentPosition is cleared
		const { getStrategy } = await import("../../strategy-query.service");
		const freshStrategy = await getStrategy(strategyId);
		if (freshStrategy) {
			monitor.strategy = freshStrategy;
		}
	} catch (error) {
		logger.error(`Error in executeExit from handleTrendFlip: ${(error as Error).message}`);
		return; // Don't proceed with re-entry if exit failed
	}

	websocketServer.emitNotification(monitor.strategy.userId.toString(), {
		type: "warning",
		title: "Trend Reversal Exit",
		message: `${monitor.strategy.name}: Trend reversed to ${newDirection}. Position closed at ₹${currentPrice}.`,
	});

	// Attempt immediate re-entry in the new trend direction if configured
	if (newDirection !== "UPTREND" && newDirection !== "DOWNTREND") {
		return;
	}

	const reentrySignal = newDirection === "UPTREND" ? "BUY" : "SELL";
	const slPoints = (monitor.strategy.config as any).stopLossPoints || 0;
	const tpPoints = (monitor.strategy.config as any).targetPoints || 0;

	let stopLossPrice = 0;
	let takeProfitPrice = 0;

	if (slPoints > 0) {
		stopLossPrice =
			reentrySignal === "BUY"
				? (currentPrice as number) - slPoints
				: (currentPrice as number) + slPoints;
	}

	if (tpPoints > 0) {
		takeProfitPrice =
			reentrySignal === "BUY"
				? (currentPrice as number) + tpPoints
				: (currentPrice as number) - tpPoints;
	}

	logger.info(
		`Executing trend flip re-entry for ${monitor.strategy.symbol}: ${reentrySignal} at ₹${currentPrice}`,
	);

	try {
		await executeEntry(
			monitor,
			reentrySignal,
			currentPrice as number,
			stopLossPrice,
			takeProfitPrice,
			monitors,
		);
	} catch (error) {
		logger.error(`Error in executeEntry from handleTrendFlip: ${(error as Error).message}`);
	}
}

/**
 * Handle trend flip with high-low break event
 */
export async function handleTrendFlipWithHighLow(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
): Promise<void> {
	const { strategyId, price, signal, trendState } = data as any;
	const currentPrice = price;
	const newDirection = trendState.direction;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	logger.warn(
		`Trend flip exit with high low for ${monitor.strategy.symbol}: Exit at ₹${currentPrice} (Direction: ${newDirection})`,
	);
	
	// Log trend flip exit with high-low break
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"warn",
		"trend",
		`Trend flip exit (High-Low Break): Position closed at ₹${currentPrice} (New direction: ${newDirection})`,
		{
			currentPrice,
			newDirection,
			exitReason: "TREND_FLIP_WITH_HIGH_LOW",
		},
	);

	try {
		await executeExit(monitor, currentPrice as number, "TREND_FLIP", monitors);
		
		// Refresh strategy from database after exit to ensure currentPosition is cleared
		const { getStrategy } = await import("../../strategy-query.service");
		const freshStrategy = await getStrategy(strategyId);
		if (freshStrategy) {
			monitor.strategy = freshStrategy;
		}
	} catch (error) {
		logger.error(`Error in executeExit from handleTrendFlipWithHighLow: ${(error as Error).message}`);
		return;
	}

	websocketServer.emitNotification(monitor.strategy.userId.toString(), {
		type: "warning",
		title: "Trend Reversal Exit",
		message: `${monitor.strategy.name}: Trend reversed to ${newDirection}. Position closed at ₹${currentPrice}.`,
	});

	// Attempt immediate re-entry in the new trend direction if configured
	if (newDirection !== "UPTREND" && newDirection !== "DOWNTREND") {
		return;
	}

	// High/Low Break entry mode leverages websocket watcher before executing
	if ((monitor.strategy.config as any).entryMode === "highLowBreak") {
		console.log('Checking for high low break entry...');
		const candles = monitor.historicalData;
		const latestCandle = candles[candles.length - 1];
		const { handleHighLowBreakEntry } = await import("../high-low-break/handle-high-low");
		// Note: emitter not needed here as handleHighLowBreakEntry will emit events via watcher callback
		await handleHighLowBreakEntry(monitor, latestCandle, signal, monitors);
		return;
	}
	
	// For non-high-low-break modes, execute entry directly
	const reentrySignal = newDirection === "UPTREND" ? "BUY" : "SELL";
	const slPoints = (monitor.strategy.config as any).stopLossPoints || 0;
	const tpPoints = (monitor.strategy.config as any).targetPoints || 0;

	let stopLossPrice = 0;
	let takeProfitPrice = 0;

	if (slPoints > 0) {
		stopLossPrice =
			reentrySignal === "BUY"
				? (currentPrice as number) - slPoints
				: (currentPrice as number) + slPoints;
	}

	if (tpPoints > 0) {
		takeProfitPrice =
			reentrySignal === "BUY"
				? (currentPrice as number) + tpPoints
				: (currentPrice as number) - tpPoints;
	}

	logger.info(
		`Executing trend flip re-entry for ${monitor.strategy.symbol}: ${reentrySignal} at ₹${currentPrice}`,
	);

	try {
		const { executeEntry } = await import("../execution/execute-entry");
		await executeEntry(
			monitor,
			reentrySignal,
			currentPrice as number,
			stopLossPrice,
			takeProfitPrice,
			monitors,
		);
	} catch (error) {
		logger.error(`Error in executeEntry from handleTrendFlipWithHighLow: ${(error as Error).message}`);
	}
}

/**
 * Handle time-based exit event (EOD square-off)
 */
export async function handleTimeExit(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
): Promise<void> {
	const { strategyId, currentPrice } = data as any;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	logger.info(
		`EOD square-off for ${monitor.strategy.symbol} at ₹${currentPrice}`,
	);
	console.log("Strategy execution - Exit by Time Exit for " + monitor.strategy.symbol);
	
	// Log time-based exit
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"info",
		"risk",
		`⏰ End of day square-off - Position closed at ₹${currentPrice}`,
		{
			currentPrice,
			exitReason: "TIME_EXIT",
		},
	);

	await executeExit(monitor, currentPrice as number, "TIME_EXIT", monitors);

	websocketServer.emitNotification(monitor.strategy.userId.toString(), {
		type: "info",
		title: "End of Day Square-Off",
		message: `${monitor.strategy.name}: Position squared-off at ₹${currentPrice}`,
	});
}

/**
 * Handle trend change event
 */
export async function handleTrendChange(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
	clearHighLowWatcher: (monitor: MonitorState) => void,
): Promise<void> {
	const { strategyId, oldTrend, newTrend, latestCandle } = data;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	const oldTrendData = oldTrend as any;
	const newTrendData = newTrend as any;
	const candle = latestCandle as any;

	// Build trend change message with candle details
	const trendEmoji = newTrendData.direction === "UPTREND" ? "📈" : newTrendData.direction === "DOWNTREND" ? "📉" : "➡️";
	const trendText = newTrendData.direction === "UPTREND" ? "Bullish" : newTrendData.direction === "DOWNTREND" ? "Bearish" : "Neutral";
	const trendMessage = `${trendEmoji} Market trend changed to ${trendText} at ₹${candle?.close || 'N/A'}`;

	logger.info(
		`Trend changed for ${monitor.strategy.symbol}: ${oldTrendData.direction} → ${newTrendData.direction}`,
	);

	// Log trend change with candle details
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"info",
		"trend",
		trendMessage,
		{
			oldTrend: oldTrendData.direction,
			newTrend: newTrendData.direction,
			close: candle?.close,
			high: candle?.high,
			low: candle?.low,
		},
	);

	// Cancel any pending high/low watcher if trend no longer matches
	if (monitor.highLowWatcher?.action) {
		const expectedDirection =
			monitor.highLowWatcher.action === "BUY" ? "UPTREND" : "DOWNTREND";
		if (newTrendData.direction !== expectedDirection) {
			clearHighLowWatcher(monitor);
		}
	}

	websocketServer.emitToUser(
		monitor.strategy.userId.toString(),
		"trend_change",
		{
			strategyId,
			symbol: monitor.strategy.symbol,
			oldTrend: oldTrendData.direction,
			newTrend: newTrendData.direction,
		},
	);
}

/**
 * Handle error event
 */
export async function handleError(
	data: Record<string, unknown>,
	monitors: Map<string, MonitorState>,
): Promise<void> {
	const { strategyId, error } = data;
	const monitor = monitors.get(strategyId as string);

	if (!monitor) return;

	const { strategy } = monitor;

	strategy.status = "ERROR";
	strategy.lastErrorMessage = error as string;
	await updateStrategy((strategy as any)._id, { status: "ERROR", lastErrorMessage: strategy.lastErrorMessage });

	logger.error(`Strategy error: ${strategy.name} - ${error}`);

	// Log error
	await strategyLogService.log(
		strategy.userId.toString(),
		(strategy as any)._id.toString(),
		"error",
		"system",
		`Strategy error: ${error}`,
		{
			error: error as string,
		},
	);

	websocketServer.emitNotification(strategy.userId.toString(), {
		type: "error",
		title: "Strategy Error",
		message: `${strategy.name}: ${error}`,
	});
}

