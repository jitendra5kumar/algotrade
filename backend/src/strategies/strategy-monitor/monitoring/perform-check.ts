import Strategy from "../../../models/Strategy.model";
import historicalDataService from "../../../services/historical-data.service";
import { isMarketOpen } from "../../../utils/helpers";
import logger from "../../../utils/logger";
import trendAnalyzer from "../../trend-analyzer.service";
import { getStrategy } from "../../strategy-query.service";
import { getMAPeriod } from "../utils/calculations";
import { updateHighLowReference } from "../high-low-break/reference";
import type { MonitorState } from "../types";
import { checkEntrySignal } from "./check-entry-signal";
import { checkRiskManagement } from "../risk-management/check-risk";
import { EventEmitter } from "node:events";

/**
 * Perform periodic check on strategy
 */
export async function performCheck(
	strategyId: string,
	monitors: Map<string, MonitorState>,
	emitter?: EventEmitter,
): Promise<void> {
	const monitor = monitors.get(strategyId);
	console.log('Monitoring check started...at: ', (new Date()).toLocaleString());
	if (!monitor) return;

	try {
		// Refresh strategy from database to catch any config changes
		const latestStrategy = await getStrategy(strategyId);
		if (latestStrategy) {
			monitor.strategy = latestStrategy;
			// Debug: Log entryMode after refresh with full config
			const entryMode = (latestStrategy.config as any)?.entryMode;
			console.log(`[DEBUG perform-check] Strategy entryMode from DB: "${entryMode}" (type: ${typeof entryMode})`);
			console.log(`[DEBUG perform-check] Full config.entryMode:`, JSON.stringify({
				entryMode: (latestStrategy.config as any)?.entryMode,
				entryConditions: (latestStrategy.config as any)?.entryConditions,
				strategyId: strategyId,
				strategyName: latestStrategy.name,
			}));
		}

		const { strategy } = monitor;

		// Skip check if market is closed (LIVE only)
		if (!isMarketOpen(strategy.exchangeSegment)) {
			logger.info(`Market closed, skipping check for ${strategy.symbol}`);
			return;
		}

		const candles = await historicalDataService.fetchCandles({
			symbol: strategy.symbol,
			exchangeSegment: strategy.exchangeSegment,
			exchangeInstrumentID: strategy.exchangeInstrumentID,
			interval: strategy.timeframe,
			maPeriod: getMAPeriod(strategy.config.indicators),
		}, true);
		
		if (!candles || candles.length === 0) {
			logger.warn(
				`No candles returned for ${strategy.symbol}, skipping check`,
			);
			return;
		}

		monitor.historicalData = candles;
		const latestCandle = candles[candles.length - 1];

		// Update high/low reference for high-low break strategies
		updateHighLowReference(monitor, latestCandle);

		// Analyze trend with updated data
		const newTrendState = await trendAnalyzer.analyze(
			monitor.historicalData,
			strategy.config.indicators,
		);
		console.log('New Trend state:', newTrendState);
		
		// Check if trend direction has changed
		const trendChanged = monitor.trendState.direction !== newTrendState.direction;
		if (trendChanged) {
			if (emitter) {
				emitter.emit("trend_change", {
					strategyId,
					oldTrend: monitor.trendState,
					newTrend: newTrendState,
					latestCandle: latestCandle, // Add candle data for logging
				});
			}
			console.log(`Trend change: ${monitor.trendState.direction} -> ${newTrendState.direction}`);
		}

		monitor.trendState = newTrendState;

		// Check if strategy has an open position
		const position = strategy.currentPosition;
		const hasPosition =
			position !== null &&
			position !== undefined &&
			typeof position === 'object' &&
			position.entryPrice !== undefined &&
			position.entryPrice !== null &&
			position.quantity !== undefined &&
			position.quantity !== null &&
			position.side !== undefined &&
			position.side !== null;
		console.log(`Current position: ${JSON.stringify(position)}`);
		
		// Only log significant P&L changes or errors (not every check)
		// Periodic checks are too frequent and confuse users
		// Instead, we log:
		// - When position opens (in execute-entry.ts)
		// - When position closes (in execute-exit.ts)
		// - When SL/TP is hit (in event-handlers.ts)
		// - Significant P&L milestones (optional, can add later)
		
		if (hasPosition) {
			// Position exists - check risk management (SL/TP)
			logger.debug(`Position exists for ${strategy.symbol}, checking risk management`, {
				strategyId,
				exchangeSegment: strategy.exchangeSegment,
				positionSide: position.side
			});
			await checkRiskManagement(monitor, latestCandle, monitors, emitter);
		} else {
			// No position - check for entry signal (pass trendChanged flag)
			logger.debug(`No position for ${strategy.symbol}, checking for entry signal`, {
				strategyId,
				exchangeSegment: strategy.exchangeSegment,
				trendDirection: newTrendState.direction,
				trendChanged
			});
			await checkEntrySignal(monitor, latestCandle, monitors, emitter, trendChanged);
		}

		// Update last check time
		monitor.lastCheckTime = Date.now();
		// Update the last check time in the database
		await Strategy.findOneAndUpdate(
			{ _id: strategy.id },
			{ lastCheckTime: new Date() }
		);
		console.log('perform check save');
	} catch (error: unknown) {
		logger.error(`Error in performCheck for ${strategyId}: ${(error as Error).message}`);
		if (emitter) {
			emitter.emit("error", { strategyId, error: (error as Error).message });
		}
	}
}

