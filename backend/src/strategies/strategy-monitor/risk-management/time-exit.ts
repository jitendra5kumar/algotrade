import type { MonitorState } from "../types";
import { EventEmitter } from "node:events";

/**
 * Check if time-based exit conditions are met
 */
export function checkTimeBasedExit(
	monitor: MonitorState,
	currentPrice: number,
	emitter?: EventEmitter,
): void {
	console.log("Checking time-based exit...");
	const config = monitor.strategy.config as any;
	const { strategy } = monitor;

	// Convert to IST
	const now = new Date();
	const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
	const istDate = new Date(istString);
	const hours = istDate.getHours();
	const minutes = istDate.getMinutes();
	const timeInMinutes = hours * 60 + minutes;

	// Check for MIS auto-square-off at 3:13 PM (193 minutes)
	const productType = config.productType || "";
	if (productType.toUpperCase() === "MIS") {
		const misSquareOffTime = 15 * 60 + 13; // 3:13 PM
		if (timeInMinutes >= misSquareOffTime) {
			console.log("MIS auto-square-off time reached (3:13 PM)");
			if (emitter) {
				emitter.emit("time_exit", {
					strategyId: (strategy as any)._id.toString(),
					position: strategy.currentPosition,
					currentPrice,
					reason: "MIS auto-square-off at 3:13 PM",
				});
			}
			return;
		}
	}

	// Only for intraday trading (if not MIS)
	if (!config.intradayEnabled) {
		return;
	}

	// Check explicit square-off time
	if (config.squareOffTime) {
		const [squareOffHours, squareOffMinutes] = config.squareOffTime.split(":").map(Number);
		const squareOffTimeInMinutes = squareOffHours * 60 + squareOffMinutes;

		if (timeInMinutes >= squareOffTimeInMinutes) {
			console.log("Square-off time reached");
			if (emitter) {
				emitter.emit("time_exit", {
					strategyId: (strategy as any)._id.toString(),
					position: strategy.currentPosition,
					currentPrice,
					reason: "Square-off time reached",
				});
			}
			return;
		}
	}

	// Fallback to trading end time
	if (config.tradingEndTime) {
		const [hours, minutes] = config.tradingEndTime.split(":").map(Number);
		const tradingEndTime = new Date(now);
		tradingEndTime.setHours(hours, minutes, 0, 0);

		if (now >= tradingEndTime) {
			console.log("Trading end time reached");
			if (emitter) {
				emitter.emit("time_exit", {
					strategyId: (monitor.strategy as any)._id.toString(),
					position: monitor.strategy.currentPosition,
					currentPrice,
					reason: "Trading end time reached",
				});
			}
			return;
		}
	}
	console.log('end check complete');
}

