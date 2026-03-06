import websocketServer from "../../../websocket/websocket.server";
import type { MonitorState } from "../types";
import type { CandleData } from "../../../indicators/types";
import { updateTrailingStop } from "./trailing-stop";
import { checkTimeBasedExit } from "./time-exit";
import { EventEmitter } from "node:events";

/**
 * Check risk management (Stop Loss, Take Profit, Trailing Stop, Time Exit)
 */
export async function checkRiskManagement(
	monitor: MonitorState,
	latestCandle: CandleData,
	monitors: Map<string, MonitorState>,
	emitter?: EventEmitter,
): Promise<void> {
	console.log('Checking risk management...');
	const { strategy } = monitor;
	const position = strategy.currentPosition;

	if (!position) return;

	const currentPrice = latestCandle.close;

	// Calculate current Profit & Loss percentage (for display/metrics)
	let plPercent: number;
	if (position.side === "BUY") {
		plPercent =
			((currentPrice - position.entryPrice) / position.entryPrice) * 100;
	} else {
		plPercent =
			((position.entryPrice - currentPrice) / position.entryPrice) * 100;
	}

	// Update unrealized P&L
	position.currentPrice = currentPrice;
	const pnlCalculation =
		(currentPrice - position.entryPrice) * position.quantity;
	position.unrealizedPnL = Number.isNaN(pnlCalculation) ? 0 : pnlCalculation;
	if (position.side === "SELL") {
		position.unrealizedPnL *= -1;
	}

	const trendDirection = monitor.trendState.direction;
	if (
		(position.side === "BUY" && trendDirection === "DOWNTREND") ||
		(position.side === "SELL" && trendDirection === "UPTREND")
	) {
		// Exit with trend flip only when the signal type is not "highLowBreak"
		if ((strategy.config as any).entryMode !== "highLowBreak") {
			if (emitter) {
				emitter.emit("trend_flip_exit", {
					strategyId: (strategy as any)._id.toString(),
					position,
					currentPrice,
					loss: plPercent,
					newDirection: trendDirection,
				});
			}
		} else {
			let signal: "BUY" | "SELL" | null = null;
			if (trendDirection === "UPTREND") {
				signal = "BUY";
			} else if (trendDirection === "DOWNTREND") {
				signal = "SELL";
			}
			if (signal) {
				const { handleHighLowBreakEntry } = await import("../high-low-break/handle-high-low");
				await handleHighLowBreakEntry(monitor, latestCandle, signal, monitors, emitter);
			}
		}
	}

	// ==================== TRAILING STOP ====================
	const trailingStopPercent = (strategy.config as any).trailingStopLoss || 0;
	if (trailingStopPercent > 0) {
		updateTrailingStop(monitor, position, currentPrice, plPercent, emitter);
	}

	// ==================== CHECK STOP LOSS (in points) ====================
	if (position.stopLossPrice && position.stopLossPrice > 0) {
		const stopLossHit = position.side === "BUY"
			? currentPrice <= position.stopLossPrice
			: currentPrice >= position.stopLossPrice;

		if (stopLossHit) {
			console.log(`Stop Loss hit for ${strategy.symbol} at ${currentPrice}`);
			if (emitter) {
				emitter.emit("stop_loss_hit", {
					strategyId: (strategy as any)._id.toString(),
					position,
					currentPrice,
					loss: plPercent,
				});
			}
		}
	}

	// ==================== CHECK TAKE PROFIT (in points) ====================
	if (position.takeProfitPrice && position.takeProfitPrice > 0) {
		const takeProfitHit = position.side === "BUY"
			? currentPrice >= position.takeProfitPrice
			: currentPrice <= position.takeProfitPrice;

		if (takeProfitHit) {
			console.log(`Take profit hit for ${strategy.symbol} at ${currentPrice}`);
			if (emitter) {
				emitter.emit("take_profit_hit", {
					strategyId: (strategy as any)._id.toString(),
					position,
					currentPrice,
					profit: plPercent,
				});
			}
		}
	}

	// ==================== CHECK TIME-BASED EXIT ====================
	checkTimeBasedExit(monitor, currentPrice, emitter);

	// Emit real-time position update via WebSocket
	websocketServer.emitPositionUpdate(strategy.userId.toString(), {
		strategyId: (strategy as any)._id,
		symbol: strategy.symbol,
		position,
		currentPrice,
		unrealizedPnL: position.unrealizedPnL,
	});
}

