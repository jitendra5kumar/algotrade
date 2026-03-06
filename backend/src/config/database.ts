import mongoose from "mongoose";
import logger from "../utils/logger";
import config from "./environment";

class Database {
	private static instance: Database;
	private isConnected: boolean = false;

	private constructor() {}

	public static getInstance(): Database {
		if (!Database.instance) {
			Database.instance = new Database();
		}
		return Database.instance;
	}

	public async connect(): Promise<void> {
		if (this.isConnected) {
			logger.info("MongoDB already connected");
			return;
		}

		try {
			const uri =
				config.NODE_ENV === "test"
					? config.MONGODB_TEST_URI
					: config.MONGODB_URI;

			await mongoose.connect(uri, {
				maxPoolSize: 10,
				minPoolSize: 2,
				serverSelectionTimeoutMS: 5000,
				socketTimeoutMS: 45000,
				connectTimeoutMS: 10000,
				heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
			});

			this.isConnected = true;
			logger.info(`MongoDB connected successfully to ${uri}`);

			// Handle connection events
			mongoose.connection.on("error", (error) => {
				logger.error("MongoDB connection error:", error);
				this.isConnected = false;
			});

			mongoose.connection.on("disconnected", () => {
				logger.warn("MongoDB disconnected - attempting to reconnect...");
				this.isConnected = false;
				// Attempt to reconnect after a delay
				setTimeout(async () => {
					try {
						if (mongoose.connection.readyState === 0) {
							await mongoose.connect(uri, {
								maxPoolSize: 10,
								minPoolSize: 2,
								serverSelectionTimeoutMS: 5000,
								socketTimeoutMS: 45000,
								connectTimeoutMS: 10000,
								heartbeatFrequencyMS: 10000,
							});
							this.isConnected = true;
							logger.info("MongoDB reconnected successfully");
						}
					} catch (reconnectError) {
						logger.error("Failed to reconnect to MongoDB:", reconnectError);
					}
				}, 5000);
			});

			mongoose.connection.on("reconnected", () => {
				logger.info("MongoDB reconnected");
				this.isConnected = true;
			});

			// Monitor connection health
			mongoose.connection.on("close", () => {
				logger.warn("MongoDB connection closed");
				this.isConnected = false;
			});
		} catch (error) {
			logger.error("Failed to connect to MongoDB:", error);
			throw error;
		}
	}

	public async disconnect(): Promise<void> {
		if (!this.isConnected) {
			return;
		}

		try {
			await mongoose.connection.close();
			this.isConnected = false;
			logger.info("MongoDB disconnected successfully");
		} catch (error) {
			logger.error("Error disconnecting from MongoDB:", error);
			throw error;
		}
	}

	public getConnectionStatus(): boolean {
		const isReady = mongoose.connection.readyState === 1;
		if (this.isConnected !== isReady) {
			this.isConnected = isReady;
			if (!isReady) {
				logger.warn("Database connection status changed - not ready", {
					readyState: mongoose.connection.readyState,
					states: ['disconnected', 'connected', 'connecting', 'disconnecting']
				});
			}
		}
		return this.isConnected && isReady;
	}

	/**
	 * Health check - verify database connection is actually working
	 */
	public async healthCheck(): Promise<boolean> {
		try {
			// Simple ping to verify connection
			await mongoose.connection.db?.admin().ping();
			return true;
		} catch (error) {
			logger.error("Database health check failed:", error);
			this.isConnected = false;
			return false;
		}
	}
}

export default Database.getInstance();
