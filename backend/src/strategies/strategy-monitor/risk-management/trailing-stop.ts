import type { MonitorState } from "../types";
import { EventEmitter } from "node:events";

/**
 * Update trailing stop level
 */
export function updateTrailingStop(
	monitor: MonitorState,
	position: any,
	currentPrice: number,
	_plPercent: number,
	emitter?: EventEmitter,
): void {
	const trailingStopPercent =
		(monitor.strategy.config as any).trailingStopLoss || 0;

	if (position.side === "BUY") {
		// For BUY: trailing stop goes up as price goes up
		const candidate = currentPrice * (1 - trailingStopPercent / 100);
		if (
			!position.trailingStopPrice ||
			candidate > position.trailingStopPrice
		) {
			position.trailingStopPrice = candidate;
		}

		// Check if trailing stop is hit
		if (
			position.trailingStopPrice &&
			currentPrice <= position.trailingStopPrice
		) {
			console.log(`Trailing stop hit for ${monitor.strategy.symbol} at ${currentPrice}`);
			if (emitter) {
				emitter.emit("trailing_stop_hit", {
					strategyId: (monitor.strategy as any)._id.toString(),
					position,
					currentPrice,
					trailingStop: position.trailingStopPrice,
				});
			}
		}
	} else {
		// For SELL: trailing stop goes down as price goes down
		const candidate = currentPrice * (1 + trailingStopPercent / 100);
		if (
			!position.trailingStopPrice ||
			candidate < position.trailingStopPrice
		) {
			position.trailingStopPrice = candidate;
		}

		// Check if trailing stop is hit
		if (
			position.trailingStopPrice &&
			currentPrice >= position.trailingStopPrice
		) {
			console.log(`Trailing stop hit for ${monitor.strategy.symbol} at ${currentPrice}`);
			if (emitter) {
				emitter.emit("trailing_stop_hit", {
					strategyId: (monitor.strategy as any)._id.toString(),
					position,
					currentPrice,
					trailingStop: position.trailingStopPrice,
				});
			}
		}
	}
}

