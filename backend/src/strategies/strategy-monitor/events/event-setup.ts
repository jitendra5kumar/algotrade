import logger from "../../../utils/logger";

/**
 * Consolidated daily tasks at market open (9:15 AM IST)
 * - Resets daily loss limits for all users
 * - Executes pending trades that were saved after market close
 * Uses a single timer instead of multiple timers for efficiency
 */
export function setupDailyReset(dailyLossTracker: Map<string, number>): void {
	let lastExecutionDate: string | null = null;

	setInterval(async () => {
		const now = new Date();
		const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
		const istDate = new Date(istString);
		
		const hours = istDate.getHours();
		const minutes = istDate.getMinutes();
		const today = istDate.toDateString();

		// Execute at 9:15 AM IST, but only once per day
		if (hours === 9 && minutes === 15 && lastExecutionDate !== today) {
			lastExecutionDate = today;
			
			try {
				// Reset daily loss limits
				dailyLossTracker.clear();
				logger.info("Daily loss limits reset at market open (9:15 AM IST)");

				// Execute pending trades
				logger.info("Executing pending trades at market open (9:15 AM IST)");
				const pendingTradeService = (await import("../../../services/pending-trade.service")).default;
				await pendingTradeService.executePendingTrades();
				logger.info("Pending trades execution completed");
			} catch (error: unknown) {
				logger.error("Error in daily market open tasks:", error);
			}
		}
	}, 60000); // Check every minute
}

/**
 * Setup pending trade execution at market open (9:15 AM IST)
 * Executes pending trades that were saved after market close
 * 
 * @deprecated This function is now consolidated into setupDailyReset()
 * Kept for backward compatibility but does nothing (all logic moved to setupDailyReset)
 */
export function setupPendingTradeExecution(): void {
	// Logic moved to setupDailyReset() to use a single timer
	// This function is kept for backward compatibility but does nothing
	logger.debug("setupPendingTradeExecution() called but logic moved to setupDailyReset()");
}

