import { BrokerService } from "../../../services/broker.service";
import logger from "../../../utils/logger";
import type { MonitorState } from "../types";

/**
 * Resolve broker client ID for monitor
 */
export async function resolveBrokerClientId(
	monitor: MonitorState,
): Promise<string | null> {
	if (monitor.brokerClientId) {
		return monitor.brokerClientId;
	}

	try {
		const status = await BrokerService.getBrokerStatus(
			monitor.strategy.userId.toString(),
		);
		if (status?.clientId) {
			monitor.brokerClientId = status.clientId;
			return status.clientId;
		}
	} catch (error) {
		logger.error("Failed to fetch broker client ID for strategy", {
			strategyId: (monitor.strategy as any)._id?.toString(),
			error:
				error instanceof Error
					? { message: error.message, stack: error.stack }
					: error,
		});
	}

	return null;
}

