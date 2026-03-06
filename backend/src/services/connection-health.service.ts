import database from '../config/database';
import logger from '../utils/logger';

/**
 * Connection Health Monitoring Service
 * Periodically checks database and other connections to ensure they're healthy
 */
class ConnectionHealthService {
	private healthCheckInterval: NodeJS.Timeout | null = null;
	private readonly CHECK_INTERVAL = 60000; // Check every 60 seconds

	/**
	 * Start periodic health checks
	 */
	public start(): void {
		if (this.healthCheckInterval) {
			logger.warn("Health check already running");
			return;
		}

		logger.info("Starting connection health monitoring");

		this.healthCheckInterval = setInterval(async () => {
			try {
				await this.performHealthCheck();
			} catch (error) {
				logger.error("Error during health check:", error);
			}
		}, this.CHECK_INTERVAL);

		// Perform initial check
		this.performHealthCheck();
	}

	/**
	 * Stop health checks
	 */
	public stop(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
			logger.info("Stopped connection health monitoring");
		}
	}

	/**
	 * Perform health check on all connections
	 */
	private async performHealthCheck(): Promise<void> {
		try {
			// Check database connection
			const dbStatus = database.getConnectionStatus();
			const dbHealth = await database.healthCheck();

			if (!dbStatus || !dbHealth) {
				const mongoose = await import('mongoose');
				logger.error("Database health check failed", {
					status: dbStatus,
					health: dbHealth,
					readyState: mongoose.default.connection.readyState
				});

				// Attempt to reconnect if disconnected
				if (!dbStatus) {
					logger.info("Attempting to reconnect to database...");
					try {
						await database.connect();
					} catch (reconnectError) {
						logger.error("Failed to reconnect to database:", reconnectError);
					}
				}
			} else {
				logger.debug("Database health check passed");
			}

			// Check WebSocket market data service
			try {
				const websocketMarketDataService = (await import('./websocket-market-data.service')).default;
				const isWebSocketActive = websocketMarketDataService.isActive();
				
				if (!isWebSocketActive) {
					logger.warn("WebSocket market data service is not active", {
						service: 'websocket-market-data'
					});
					// Note: The service will handle its own reconnection
				} else {
					logger.debug("WebSocket market data service is active");
				}
			} catch (wsError) {
				logger.error("Error checking WebSocket market data service:", wsError);
			}
		} catch (error) {
			logger.error("Health check error:", error);
		}
	}
}

export default new ConnectionHealthService();

