import { RedisClientType } from "redis";
import logger from "../utils/logger";
import config from "./environment";

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection (optional)
 * Will gracefully skip if Redis is disabled or not available
 */
export const initializeRedis = async (): Promise<void> => {
	// Skip Redis if explicitly disabled
	if (!config.USE_REDIS) {
		logger.info(
			"Redis is disabled in configuration. Skipping Redis initialization.",
		);
		return;
	}

	try {
		// Dynamically import redis only if needed
		const redis = await import("redis");

		redisClient = redis.createClient({
			socket: {
				host: config.REDIS_HOST,
				port: config.REDIS_PORT,
				connectTimeout: 5000,
			},
			password: config.REDIS_PASSWORD || undefined,
			database: config.REDIS_DB,
		});

		redisClient.on("error", (error: Error) => {
			logger.warn("Redis connection error (non-critical):", error.message);
			isRedisAvailable = false;
		});

		redisClient.on("connect", () => {
			logger.info("Redis connected successfully");
			isRedisAvailable = true;
		});

		redisClient.on("ready", () => {
			logger.info("Redis client ready");
			isRedisAvailable = true;
		});

		redisClient.on("end", () => {
			logger.info("Redis connection closed");
			isRedisAvailable = false;
		});

		await redisClient.connect();
	} catch (error: any) {
		logger.warn(
			"Redis initialization failed (non-critical). Continuing without cache:",
			(error as Error).message,
		);
		isRedisAvailable = false;
		redisClient = null;
	}
};

/**
 * Get Redis client if available
 */
export const getRedisClient = () => {
	return redisClient;
};

/**
 * Check if Redis is available
 */
export const isRedisEnabled = (): boolean => {
	return isRedisAvailable && redisClient !== null;
};

/**
 * Set a key-value pair in Redis (with optional TTL)
 */
export const setCache = async (
	key: string,
	value: string | number | Buffer,
	ttl?: number,
): Promise<boolean> => {
	if (!isRedisEnabled()) {
		return false;
	}

	try {
		if (!redisClient) {
			return false;
		}
		const serialized = JSON.stringify(value);
		if (ttl) {
			await redisClient.setEx(key, ttl, serialized);
		} else {
			await redisClient.set(key, serialized);
		}
		return true;
	} catch (error) {
		logger.warn("Redis SET failed:", error);
		return false;
	}
};

/**
 * Get a value from Redis
 */
export const getCache = async (key: string): Promise<string | null> => {
	if (!isRedisEnabled()) {
		return null;
	}

	try {
		if (!redisClient) {
			return null;
		}
		const value = await redisClient.get(key);
		return value ? JSON.parse(value) : null;
	} catch (error) {
		logger.warn("Redis GET failed:", error);
		return null;
	}
};

/**
 * Delete a key from Redis
 */
export const deleteCache = async (key: string): Promise<boolean> => {
	if (!isRedisEnabled()) {
		return false;
	}

	try {
		if (!redisClient) {
			return false;
		}
		await redisClient.del(key);
		return true;
	} catch (error) {
		logger.warn("Redis DEL failed:", error);
		return false;
	}
};

/**
 * Clear all cache
 */
export const clearCache = async (): Promise<boolean> => {
	if (!isRedisEnabled()) {
		return false;
	}

	try {
		if (!redisClient) {
			return false;
		}
		await redisClient.flushDb();
		return true;
	} catch (error) {
		logger.warn("Redis FLUSHDB failed:", error);
		return false;
	}
};

/**
 * Disconnect Redis
 */
export const disconnectRedis = async (): Promise<void> => {
	if (redisClient) {
		try {
			await redisClient.quit();
			logger.info("Redis disconnected successfully");
		} catch (error) {
			logger.warn("Error disconnecting Redis:", error);
		}
	}
};

export default {
	initializeRedis,
	getRedisClient,
	isRedisEnabled,
	setCache,
	getCache,
	deleteCache,
	clearCache,
	disconnectRedis,
};
