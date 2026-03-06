import type { MonitorState } from "../types";
import type { CandleData } from "../../../indicators/types";
import { handleHighLowBreakEntry } from "../high-low-break/handle-high-low";
import { EventEmitter } from "node:events";

/**
 * Check for entry signal based on trend analysis
 */
export async function checkEntrySignal(
	monitor: MonitorState,
	latestCandle: CandleData,
	monitors: Map<string, MonitorState>,
	emitter?: EventEmitter,
	trendChanged?: boolean, // Add this parameter
): Promise<void> {
	const { strategy, trendState } = monitor;
	console.log('Checking entry signal...', { trendChanged });
	
	// Debug: Log entryMode value
	const entryMode = (strategy.config as any).entryMode;
	console.log(`[DEBUG] Strategy entryMode: "${entryMode}" (type: ${typeof entryMode})`);
	console.log(`[DEBUG] entryMode === "highLowBreak": ${entryMode === "highLowBreak"}`);

	// Use trend recommendation from TrendAnalyzer
	let signal: "BUY" | "SELL" | null = null;

	// Convert trend direction to signal
	if (trendState.direction === "UPTREND") {
		signal = "BUY";
	} else if (trendState.direction === "DOWNTREND") {
		signal = "SELL";
	}
	// SIDEWAYS = no signal

	if (!signal) {
		console.log('No signal - trend is SIDEWAYS');
		return;
	}

	// IMPORTANT: Check if position exists - only skip if position exists in SAME direction
	// This allows signals when:
	// 1. No position exists (regardless of trend change)
	// 2. Trend changed (regardless of position)
	// 3. Position exists but in opposite direction (reversal)
	const currentPosition = strategy.currentPosition;
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

	// Only skip if position exists in same direction AND trend didn't change
	// This allows subsequent signals after position is closed
	if (!trendChanged && hasCurrentPosition && currentPosition.side === signal) {
		console.log('Trend did not change and position exists in same direction - skipping signal generation');
		return;
	}

	// High/Low Break entry mode leverages websocket watcher before executing
	if (entryMode === "highLowBreak") {
		console.log('✅ High-Low Break mode detected - Starting watcher...');
		await handleHighLowBreakEntry(monitor, latestCandle, signal, monitors, emitter);
		return;
	}

	console.log(
		`Entry signal generated @${latestCandle.close} (trend: ${trendState.direction}, trendChanged: ${trendChanged})`,
	);
	
	// CRITICAL: Always emit signal if we have one and no position exists in same direction
	// This ensures signals are not missed for any segment
	if (emitter) {
		const signalData = {
			strategyId: (strategy as any)._id.toString(),
			signal,
			price: latestCandle.close,
			trendState,
			trigger: "CANDLE_CLOSE"
		};
		
		console.log(`Emitting signal_generated event for ${signal} at ₹${latestCandle.close}`, {
			strategyId: signalData.strategyId,
			signal,
			price: latestCandle.close,
			exchangeSegment: strategy.exchangeSegment,
			symbol: strategy.symbol
		});
		
		emitter.emit("signal_generated", signalData);
		
		// Import logger for better logging
		const logger = (await import("../../../utils/logger")).default;
		logger.info(`✅ Signal emitted successfully`, {
			strategyId: (strategy as any)._id.toString(),
			signal,
			price: latestCandle.close,
			exchangeSegment: strategy.exchangeSegment,
			symbol: strategy.symbol,
			trendDirection: trendState.direction,
			trendChanged,
			hasPosition: hasCurrentPosition,
			positionSide: currentPosition?.side
		});
	} else {
		console.error(`❌ CRITICAL: No emitter provided - signal NOT emitted for ${strategy.symbol}`);
		const logger = (await import("../../../utils/logger")).default;
		logger.error(`No emitter available to emit signal`, {
			strategyId: (strategy as any)._id.toString(),
			signal,
			price: latestCandle.close,
			exchangeSegment: strategy.exchangeSegment,
			symbol: strategy.symbol
		});
	}
}

