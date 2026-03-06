import logger from "../../../utils/logger";
import type { MonitorState } from "../types";
import type { CandleData } from "../../../indicators/types";
import { getCandleTimestamp } from "../utils/helpers";

/**
 * Update stored high/low reference when new candle closes
 * CRITICAL FIX: Signal candle should remain locked until breakout occurs
 * Only update reference when:
 * 1. No reference exists yet, OR
 * 2. No active watcher exists (new signal or watcher completed)
 */
export function updateHighLowReference(
	monitor: MonitorState,
	latestCandle: CandleData | null,
): void {
	if (!latestCandle) {
		return;
	}

	const timestamp = getCandleTimestamp(latestCandle);
	const current = monitor.highLowReference;

	// CRITICAL FIX: Check if there's an active watcher - if yes, keep the original signal candle
	if (monitor.highLowWatcher && monitor.highLowWatcher.referenceTimestamp) {
		// Active watcher exists - DO NOT update reference
		// The signal candle should remain locked until breakout occurs
		logger.debug("Signal candle locked - watcher active, keeping original reference", {
			strategyId: (monitor.strategy as any)._id?.toString(),
			lockedTimestamp: monitor.highLowWatcher.referenceTimestamp,
			newCandleTimestamp: timestamp,
		});
		return; // Keep the original signal candle
	}

	// Only update if no active watcher (new signal or first time)
	if (!current || timestamp > current.timestamp) {
		monitor.highLowReference = {
			high: latestCandle.high,
			low: latestCandle.low,
			timestamp,
		};

		logger.debug("High/Low reference updated (no active watcher)", {
			strategyId: (monitor.strategy as any)._id?.toString(),
			newTimestamp: timestamp,
			oldTimestamp: current?.timestamp,
		});
	}
}

