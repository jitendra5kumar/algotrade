import { EventEmitter } from "node:events";
import Strategy from "../../models/Strategy.model";
import logger from "../../utils/logger";
import websocketServer from "../../websocket/websocket.server";
import { updateStrategy } from "../strategy-query.service";
import type { MonitorState } from "./types";
import { setupDailyReset, setupPendingTradeExecution } from "./events/event-setup";
import {
	handleSignal,
	handleStopLoss,
	handleTakeProfit,
	handleTrailingStop,
	handleTimeExit,
	handleTrendChange,
	handleTrendFlip,
	handleTrendFlipWithHighLow,
	handleError,
} from "./events/event-handlers";
import { startMonitoring as startMonitoringFn } from "./monitoring/start-monitoring";
import { performCheck as performCheckFn } from "./monitoring/perform-check";
import { clearHighLowWatcher } from "./high-low-break/watcher";

/**
 * StrategyMonitorService - Main service for monitoring and executing trading strategies
 *
 * Responsibilities:
 * - Monitor multiple strategies in parallel
 * - Check for entry/exit signals based on indicators
 * - Manage risk with stop loss and take profit
 * - Track daily losses
 * - Emit events for signal generation, exits, errors
 * - Communicate with WebSocket for real-time updates
 */
class StrategyMonitorService extends EventEmitter {
	private monitors: Map<string, MonitorState> = new Map();
	private dailyLossTracker: Map<string, number> = new Map();

	constructor() {
		super();
		this.setupEventHandlers();
		setupDailyReset(this.dailyLossTracker);
		setupPendingTradeExecution();
	}

	/**
	 * Setup event listeners for all strategy events
	 */
	private setupEventHandlers(): void {
		this.on("signal_generated", (data) => handleSignal(data, this.monitors));
		this.on("stop_loss_hit", (data) => handleStopLoss(data, this.monitors, this.dailyLossTracker));
		this.on("take_profit_hit", (data) => handleTakeProfit(data, this.monitors));
		this.on("trailing_stop_hit", (data) => handleTrailingStop(data, this.monitors));
		this.on("time_exit", (data) => handleTimeExit(data, this.monitors));
		this.on("trend_change", async (data) => {
			try {
				await handleTrendChange(data, this.monitors, this.clearHighLowWatcher.bind(this));
			} catch (error) {
				logger.error("Error in trend_change handler:", error);
			}
		});
		this.on("trend_flip_exit", async (data) => {
			try {
				await handleTrendFlip(data, this.monitors);
			} catch (error) {
				logger.error("Error in trend_flip_exit handler:", error);
			}
		});
		this.on("trend_flip_with_high_low", async (data) => {
			try {
				await handleTrendFlipWithHighLow(data, this.monitors);
			} catch (error) {
				logger.error("Error in trend_flip_with_high_low handler:", error);
			}
		});
		this.on("error", (data) => handleError(data, this.monitors));
	}

	/**
	 * Start monitoring a strategy (LIVE trading only)
	 */
	public async startMonitoring(strategyId: string): Promise<void> {
		logger.info(`Starting strategy monitoring: LIVE trading`, {
			strategyId
		});
		await startMonitoringFn(strategyId, this.monitors, this); // Pass monitors and emitter
	}

	/**
	 * Perform periodic check on strategy
	 */
	private async performCheck(strategyId: string): Promise<void> {
		await performCheckFn(strategyId, this.monitors, this);
	}

	/**
	 * Stop monitoring a strategy
	 */
	public async stopMonitoring(strategyId: string): Promise<void> {
		const monitor = this.monitors.get(strategyId);

		if (!monitor) {
			logger.warn(`Strategy ${strategyId} is not being monitored`);
			return;
		}

		clearHighLowWatcher(monitor);

		// Clear the interval
		if (monitor.interval) {
			clearInterval(monitor.interval);
		}

		// Update strategy status in database
		const strategy = await Strategy.findById(strategyId);
		if (strategy) {
			strategy.isMonitoring = false;
			strategy.status = "INACTIVE";
			console.log('stop monitoring');
			try {
				await updateStrategy((strategy as any)._id, { isMonitoring: false, status: "INACTIVE" });
			} catch (error) {
				logger.error("Failed to save strategy while stopping monitor", {
					strategyId,
					error:
						error instanceof Error
							? { message: error.message, stack: error.stack }
							: error,
				});
			}
		}

		// Remove from monitors map
		this.monitors.delete(strategyId);

		logger.info(`Strategy monitoring stopped: ${monitor.strategy.name}`);

		// Notify user
		if (strategy) {
			websocketServer.emitToUser(
				strategy.userId.toString(),
				"strategy_stopped",
				{
					strategyId,
					strategyName: strategy.name,
				},
			);
		}
	}

	/**
	 * Manually close an open position
	 */
	public async closePosition(
		strategyId: string,
		currentPrice: number,
	): Promise<void> {
		const monitor = this.monitors.get(strategyId);

		if (!monitor) {
			throw new Error("Strategy not being monitored");
		}

		if (!monitor.strategy.currentPosition) {
			throw new Error("No open position to close");
		}

		const { executeExit } = await import("./execution/execute-exit");
		await executeExit(monitor, currentPrice, "MANUAL", this.monitors);
	}

	/**
	 * Pause strategy (stop monitoring but keep state)
	 */
	public async pauseStrategy(strategyId: string): Promise<void> {
		const monitor = this.monitors.get(strategyId);

		if (!monitor) {
			throw new Error("Strategy not being monitored");
		}

		clearHighLowWatcher(monitor);

		// Clear interval but keep monitor state
		if (monitor.interval) {
			clearInterval(monitor.interval);
			monitor.interval = null;
		}

		const strategy = await Strategy.findById(strategyId);
		if (strategy) {
			strategy.status = "PAUSED";
			await updateStrategy((strategy as any)._id, { status: "PAUSED" });
		}

		logger.info(`Strategy paused: ${monitor.strategy.name}`);
	}

	/**
	 * Resume a paused strategy
	 */
	public async resumeStrategy(strategyId: string): Promise<void> {
		const monitor = this.monitors.get(strategyId);

		if (!monitor) {
			throw new Error("Strategy not found in monitors");
		}

		if (monitor.interval) {
			logger.warn("Strategy is already running");
			return;
		}

		// Refresh strategy from database to get latest config (important after edit)
		const strategy = await Strategy.findById(strategyId);
		if (strategy) {
			monitor.strategy = strategy;
			strategy.status = "ACTIVE";
			await updateStrategy((strategy as any)._id, { status: "ACTIVE" });
		}

		// Use same interval calculation as start-monitoring for consistency
		const historicalDataService = (await import("../../services/historical-data.service")).default;
		const checkInterval = (historicalDataService.getTimeframeMinutes(monitor.strategy.timeframe) || 1) * 60 * 1000;

		// Perform immediate check first (like start-monitoring does)
		await this.performCheck(strategyId);

		// Then set interval for periodic checks
		monitor.interval = setInterval(() => {
			this.performCheck(strategyId);
		}, checkInterval);

		logger.info(`Strategy resumed: ${monitor.strategy.name} (interval: ${checkInterval}ms, timeframe: ${monitor.strategy.timeframe})`);
	}

	/**
	 * Get status of a specific strategy monitor
	 */
	public getMonitorStatus(strategyId: string): Record<string, unknown> | null {
		const monitor = this.monitors.get(strategyId);

		if (!monitor) {
			return null;
		}

	return {
		strategyId,
		strategyName: monitor.strategy.name,
		symbol: monitor.strategy.symbol,
		status: monitor.strategy.status,
		isMonitoring: monitor.strategy.isMonitoring,
		mode: 'LIVE', // Only LIVE trading supported
		currentPosition: monitor.strategy.currentPosition,
		trendState: monitor.trendState,
		lastCheckTime: monitor.lastCheckTime,
		performance: monitor.strategy.performance,
	};
	}

	/**
	 * Get status of all active monitors
	 */
	public getAllMonitors(): Record<string, unknown>[] {
		const monitors: Record<string, unknown>[] = [];

		this.monitors.forEach((_, strategyId) => {
			const status = this.getMonitorStatus(strategyId);
			if (status) {
				monitors.push(status);
			}
		});

		return monitors;
	}

	/**
	 * Stop all active strategy monitors
	 */
	public async stopAllMonitors(): Promise<void> {
		const strategyIds = Array.from(this.monitors.keys());

		for (const strategyId of strategyIds) {
			await this.stopMonitoring(strategyId);
		}

		logger.info("All strategy monitors stopped");
	}

	/**
	 * Clear high/low watcher (internal method)
	 */
	private clearHighLowWatcher(monitor: MonitorState): void {
		clearHighLowWatcher(monitor);
	}

	/**
	 * Get monitors map (for internal use by modules)
	 */
	public getMonitors(): Map<string, MonitorState> {
		return this.monitors;
	}

	/**
	 * Get daily loss tracker (for internal use by modules)
	 */
	public getDailyLossTracker(): Map<string, number> {
		return this.dailyLossTracker;
	}
}

export default new StrategyMonitorService();

