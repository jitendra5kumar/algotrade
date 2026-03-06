import historicalDataService from "../../../services/historical-data.service";
import { BrokerService } from "../../../services/broker.service";
import { isMarketOpen } from "../../../utils/helpers";
import logger from "../../../utils/logger";
import websocketServer from "../../../websocket/websocket.server";
import trendAnalyzer from "../../trend-analyzer.service";
import { getStrategy, updateStrategy } from "../../strategy-query.service";
import { getCandleTimestamp } from "../utils/helpers";
import { getMAPeriod, getDelay } from "../utils/calculations";
import type { MonitorState } from "../types";
import { performCheck } from "./perform-check";
import { EventEmitter } from "node:events";

/**
 * Start monitoring a strategy
 */
export async function startMonitoring(
	strategyId: string,
	monitors: Map<string, MonitorState>,
	emitter?: EventEmitter, // Add emitter parameter
): Promise<void> {
	try {
		console.log('Started monitoring strategy (LIVE only):', strategyId);
		// Check if already monitoring this strategy
		if (monitors.has(strategyId)) {
			logger.warn(`Strategy ${strategyId} is already being monitored`);
			return;
		}

		// Fetch strategy from database
		const strategy = await getStrategy(strategyId);
		if (!strategy) {
			throw new Error("Strategy not found in database");
		}

		// Validate market is open for live trading
		if (!isMarketOpen(strategy.exchangeSegment)) {
			throw new Error("Market is closed. Cannot start live trading");
		}

		// Fetch initial historical data
		const historicalData = await historicalDataService.fetchCandles({
			symbol: strategy.symbol,
			exchangeSegment: strategy.exchangeSegment,
			exchangeInstrumentID: strategy.exchangeInstrumentID,
			interval: strategy.timeframe,
			maPeriod: getMAPeriod(strategy.config?.indicators),
		});
		console.log(`Fetched historical data - ${historicalData.length} candles`);
		
		// Perform initial trend analysis with enabled indicators
		const trendState = await trendAnalyzer.analyze(
			historicalData,
			strategy.config.indicators,
		);
		console.log(`Initial - TREND STATE - ${trendState}`);
		
		const latestInitialCandle = historicalData[historicalData.length - 1] ?? null;
		const initialReference =
			latestInitialCandle != null
				? {
						high: latestInitialCandle.high,
						low: latestInitialCandle.low,
						timestamp: getCandleTimestamp(latestInitialCandle),
				  }
				: undefined;
		
		let brokerClientId: string | undefined;
		try {
			const brokerStatus = await BrokerService.getBrokerStatus(
				strategy.userId.toString(),
			);
			if (brokerStatus?.clientId) {
				brokerClientId = brokerStatus.clientId;
			}
		} catch (error) {
			logger.warn("Unable to resolve broker client ID for strategy", {
				strategyId,
				error:
					error instanceof Error
						? { message: error.message, stack: error.stack }
						: error,
			});
		}

		// Create monitor state object
		const monitorState: MonitorState = {
			strategy,
		historicalData,
		trendState,
		lastCheckTime: Date.now(),
		interval: null,
		highLowReference: initialReference,
		brokerClientId,
		};

		// Check for instant entry if enabled
		const instantEntry = (strategy.config as any)?.instantEntry;
		if (instantEntry && latestInitialCandle) {
			// Check if position already exists - if it does, skip instant entry
			// This prevents taking trades when starting card in middle of trade
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

			if (hasCurrentPosition) {
				logger.info(
					`Instant entry enabled but position already exists - waiting for next signal for strategy ${strategy.name}`,
				);
				// Don't execute instant entry if position exists - wait for next signal
			} else {
				// Convert trend direction to signal
				let signal: "BUY" | "SELL" | null = null;
				if (trendState.direction === "UPTREND") {
					signal = "BUY";
				} else if (trendState.direction === "DOWNTREND") {
					signal = "SELL";
				}

				if (signal) {
					logger.info(
						`Instant entry enabled - Executing ${signal} signal immediately for strategy ${strategy.name}`,
					);
					
					// Import checkEntrySignal dynamically to avoid circular dependencies
					const { checkEntrySignal } = await import("./check-entry-signal");
					
					// Execute entry signal immediately with emitter (if available)
					// For instant entry, trendChanged is undefined (no trend change yet, just initial entry)
					await checkEntrySignal(
						monitorState,
						latestInitialCandle,
						monitors,
						emitter,
						undefined, // trendChanged is undefined for instant entry
					);
				}
			}
		}

		// Start monitoring at the next clock minute
		const millisecondsToNextMinute = getDelay(strategy.timeframe);
		console.log('delay', millisecondsToNextMinute);
		const checkInterval = (historicalDataService.getTimeframeMinutes(strategy.timeframe) || 1) * 60 * 1000;
		
		setTimeout(() => {
			// Perform check at the next minute and set the interval from there on
			performCheck(strategyId, monitors, emitter); // Pass emitter
			console.log(`Performing check and setting monitor at:,${Date.now()} with checkInterval:${checkInterval}`);
			monitorState.interval = setInterval(() => {
				performCheck(strategyId, monitors, emitter); // Pass emitter
			}, checkInterval);
		}, millisecondsToNextMinute);

		// Store monitor in map
		monitors.set(strategyId, monitorState);

		// Update strategy status in database
		strategy.isMonitoring = true;
		strategy.status = "ACTIVE";
		console.log('start monitoring save');
		try {
			await updateStrategy((strategy as any)._id, { isMonitoring: true, status: "ACTIVE" });
		} catch (error) {
			logger.error("Failed to save strategy while starting monitor", {
				strategyId: strategyId,
				error:
					error instanceof Error
						? { message: error.message, stack: error.stack }
						: error,
			});
		}

		logger.info(`Strategy monitoring started: ${strategy.name} (LIVE Trading)`);

		// Notify user via WebSocket
	websocketServer.emitToUser(
		strategy.userId.toString(),
		"strategy_started",
		{
			strategyId,
			strategyName: strategy.name,
			mode: 'LIVE',
			trendState,
		},
	);
	} catch (error: unknown) {
		logger.error(
			`Error starting monitoring for strategy ${strategyId}: ${(error as Error).message}`,
		);
		throw error;
	}
}

