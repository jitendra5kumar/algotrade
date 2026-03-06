import logger from "../../../utils/logger";
import type { MonitorState } from "../types";
import type { CandleData } from "../../../indicators/types";
import { getCandleTimestamp } from "../utils/helpers";
import { startHighLowBreakWatcher } from "./watcher";
import strategyLogService from "../../../services/strategy-log.service";

/**
 * Handle high-low break entry mode
 */
export async function handleHighLowBreakEntry(
	monitor: MonitorState,
	referenceCandle: CandleData,
	signal: "BUY" | "SELL",
	monitors: Map<string, MonitorState>,
	emitter?: any,
): Promise<void> {
	const referenceTimestamp = getCandleTimestamp(referenceCandle);

	// CRITICAL: Only update reference if:
	// 1. No reference exists, OR
	// 2. This is a NEW signal (different timestamp than current watcher)
	const existingWatcher = monitor.highLowWatcher;
	const isNewSignal = !existingWatcher || 
		existingWatcher.referenceTimestamp !== referenceTimestamp ||
		existingWatcher.action !== signal;

	if (isNewSignal) {
		// New signal - update reference and clear old watcher
		monitor.highLowReference = {
			high: referenceCandle.high,
			low: referenceCandle.low,
			timestamp: referenceTimestamp,
		};
		// Clear old watcher before starting new one
		const { clearHighLowWatcher } = await import("./watcher");
		clearHighLowWatcher(monitor);
		logger.info("New signal candle set - old watcher cleared", {
			strategyId: (monitor.strategy as any)._id?.toString(),
			timestamp: referenceTimestamp,
			signal,
		});
	} else {
		// Same signal candle - keep existing reference
		logger.debug("Keeping existing signal candle reference", {
			strategyId: (monitor.strategy as any)._id?.toString(),
			timestamp: referenceTimestamp,
		});
	}

	// Ensure highLowReference exists before using it
	if (!monitor.highLowReference) {
		logger.error("highLowReference is undefined when trying to handle high-low break", {
			strategyId: (monitor.strategy as any)._id?.toString(),
			symbol: monitor.strategy.symbol,
		});
		return;
	}

	console.log(`High low break for ${monitor.strategy.symbol} at ${signal} at ${monitor.highLowReference.timestamp}`);
	console.log(monitor.highLowReference);
	const { high, low } = monitor.highLowReference;
	if (!Number.isFinite(high) || !Number.isFinite(low)) {
		logger.warn(
			"High/Low reference invalid, skipping high-low watch setup",
			{
				strategyId: (monitor.strategy as any)._id?.toString(),
				high,
				low,
			},
		);
		return;
	}

	const watcher = monitor.highLowWatcher;
	if (
		watcher &&
		watcher.action === signal &&
		watcher.referenceTimestamp === referenceTimestamp
	) {
		// Watcher already active for this signal & candle
		return;
	}

	// Log high-low break watcher setup with candle details
	const breakLevel = signal === "BUY" ? high : low;
	const waitEmoji = "⏳";
	
	await strategyLogService.log(
		monitor.strategy.userId.toString(),
		(monitor.strategy as any)._id.toString(),
		"info",
		"signal",
		`${waitEmoji} ${signal} signal detected - Waiting for price to break ${signal === "BUY" ? "above" : "below"} ₹${breakLevel}`,
		{
			signal,
			close: referenceCandle.close,
			high,
			low,
			breakLevel,
			referenceTimestamp,
			trigger: "HIGH_LOW_BREAK",
		},
	);

	await startHighLowBreakWatcher(monitor, signal, referenceCandle, monitors, emitter);
}

