import http from "node:http";
import app from "./app";
import database from "./config/database";
import config from "./config/environment";
import redis from "./config/redis";
import Strategy from "./models/Strategy.model";
import strategyMonitor from "./strategies/strategy-monitor";
import logger from "./utils/logger";
import websocketServer from "./websocket/websocket.server";

class Server {
	private server: http.Server;
	private port: number;

	constructor() {
		this.port = config.PORT;
		this.server = http.createServer(app);
		
		// Configure server timeouts and keepAlive
		this.server.keepAliveTimeout = 65000; // 65 seconds (slightly longer than default)
		this.server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)
		this.server.requestTimeout = 30000; // 30 seconds request timeout
	}

	/**
	 * Initialize all connections and start server
	 */
	public async start(): Promise<void> {
		try {
			// Connect to MongoDB
			logger.info("Connecting to MongoDB...");
			await database.connect();
			logger.info("MongoDB connected successfully");

			// Resume active strategy monitors (if any) before starting services
			await this.resumeActiveStrategies();

			// Initialize Redis (optional)
			if (config.USE_REDIS) {
				logger.info("Initializing Redis...");
				await redis.initializeRedis();
				if (redis.isRedisEnabled()) {
					logger.info("Redis connected successfully");
				} else {
					logger.warn("Redis connection failed. Continuing without cache.");
				}
			} else {
				logger.info("Redis is disabled. Skipping Redis initialization.");
			}

			// Initialize WebSocket server
			websocketServer.initialize(this.server);
			logger.info("WebSocket server initialized");

			// Start connection health monitoring
			const connectionHealthService = (await import("./services/connection-health.service")).default;
			connectionHealthService.start();
			logger.info("Connection health monitoring started");

			// Start HTTP server
			this.server.listen(this.port, () => {
				logger.info(`
						╔══════════════════════════════════════════════════════════╗
						║                                                          ║
						║          🚀 AlgoTrade Backend Server Started 🚀          ║
						║                                                          ║
						║  Environment: ${config.NODE_ENV.padEnd(45)}║
						║  Server URL:  http://${config.HOST}:${this.port.toString().padEnd(35)}║
						║  Database:    MongoDB Connected                          ║
						║  Cache:       ${(redis.isRedisEnabled() ? "Redis Enabled" : "Redis Disabled").padEnd(45)}║
						║  WebSocket:   Connected                                  ║
						║  Broker:      ${config.BROKER_NAME.toUpperCase().padEnd(45)}║
						║                                                          ║
						╚══════════════════════════════════════════════════════════╝
                `);
				
				// Emit ready signal for PM2
				if (process.send) {
					process.send('ready');
				}
			});

			// Graceful shutdown handlers
			this.setupGracefulShutdown();
		} catch (error) {
			logger.error("Failed to start server:", error);
			process.exit(1);
		}
	}

	/**
	 * Resume all strategies that were active before restart.
	 * Loads strategies marked as ACTIVE and isMonitoring=true, then calls startMonitoring.
	 */
	private async resumeActiveStrategies(): Promise<void> {
		try {
			logger.info("Resuming active strategies (if any)...");
			const activeStrategies: any[] = await Strategy.find({
				status: "ACTIVE",
				isMonitoring: true,
			})
				.select({ _id: 1, name: 1 })
				.lean();
			console.log("ACTIVE STRATEGIES", activeStrategies.length);

			if (!activeStrategies?.length) {
				logger.info("No active strategies to resume");
				return;
			}

			for (const s of activeStrategies) {
				const id = s?._id?.toString?.() ?? String(s?._id);
				try {
					// Resume monitoring in LIVE mode
					await strategyMonitor.startMonitoring(id);
					logger.info(
						`Resumed monitoring for strategy ${s?.name || id} (LIVE trading)`,
					);
				} catch (e: any) {
					logger.warn(
						`Failed to resume strategy ${s?.name || id}: ${e?.message || e}`,
					);
				}
			}
		} catch (error: any) {
			logger.warn("Resume active strategies failed:", error?.message || error);
		}
	}

	/**
	 * Setup graceful shutdown handlers
	 */
	private setupGracefulShutdown(): void {
		const shutdown = async (signal: string) => {
			logger.info(`\n${signal} received. Starting graceful shutdown...`);

			// Stop accepting new connections
			this.server.close(async () => {
				logger.info("HTTP server closed");

				try {
					// Close WebSocket server
					websocketServer.close();
					logger.info("WebSocket server closed");

					// Close database connection
					await database.disconnect();
					logger.info("Database connection closed");

					// Close Redis connection
					if (redis.isRedisEnabled()) {
						await redis.disconnectRedis();
						logger.info("Redis connection closed");
					}

					logger.info("Graceful shutdown completed");
					process.exit(0);
				} catch (error) {
					logger.error("Error during shutdown:", error);
					process.exit(1);
				}
			});

			// Force close after 10 seconds
			setTimeout(() => {
				logger.error("Forced shutdown after timeout");
				process.exit(1);
			}, 10000);
		};

		// Listen for termination signals
		process.on("SIGTERM", () => shutdown("SIGTERM"));
		process.on("SIGINT", () => shutdown("SIGINT"));

		// Handle uncaught exceptions
		process.on("uncaughtException", (error) => {
			logger.error("Uncaught Exception:", error);
			//shutdown("UNCAUGHT_EXCEPTION");		//Commented to avoid shutdown on uncaught exception.
		});

		// Handle unhandled promise rejections
		process.on("unhandledRejection", (reason, promise) => {
			logger.error("Unhandled Rejection at:", promise, "reason:", reason);
			//shutdown("UNHANDLED_REJECTION");		//Commented to avoid shutdown on unhandled promise rejection
		});
	}
}

// Start the server
const server = new Server();
server.start().catch((error) => {
	logger.error("Failed to start server:", error);
	process.exit(1);
});

export default server;
