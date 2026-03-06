import path from "node:path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface EnvironmentConfig {
	// Server
	NODE_ENV: string;
	PORT: number;
	HOST: string;

	// Frontend
	FRONTEND_URL: string;
	ALLOWED_ORIGINS: string[];

	// MongoDB
	MONGODB_URI: string;
	MONGODB_TEST_URI: string;

	// Redis (Optional)
	USE_REDIS: boolean;
	REDIS_HOST: string;
	REDIS_PORT: number;
	REDIS_PASSWORD: string;
	REDIS_DB: number;

	// JWT
	JWT_SECRET: string;
	JWT_EXPIRES_IN: string;
	JWT_REFRESH_SECRET: string;
	JWT_REFRESH_EXPIRES_IN: string;

	// Security
	BCRYPT_ROUNDS: number;
	API_RATE_LIMIT_WINDOW: number;
	API_RATE_LIMIT_MAX: number;

	// AnandRathi XTS API
	BROKER_NAME: string;
	XTS_API_BASE_URL: string;
	XTS_MARKET_DATA_URL: string;
	XTS_INTERACTIVE_URL: string;
	XTS_API_KEY: string;
	XTS_API_SECRET: string;
	XTS_SOURCE: string;

	// Market Data API (Separate credentials)
	MARKET_DATA_API_KEY: string;
	MARKET_DATA_API_SECRET: string;
	MARKET_DATA_SOURCE: string;

	// Interactive Order API (Separate credentials)
	INTERACTIVE_API_KEY: string;
	INTERACTIVE_API_SECRET: string;
	INTERACTIVE_SOURCE: string;

	// Dealer API (Direct Trading)
	DEALER_API_BASE_URL: string;
	DEALER_SECRET_KEY: string;
	DEALER_APP_KEY: string;
	DEALER_SOURCE: string;
	DEALER_ID: string;

	// WebSocket
	WS_PORT: number;
	WS_PATH: string;
	WS_PING_TIMEOUT: number;
	WS_PING_INTERVAL: number;

	// Logging
	LOG_LEVEL: string;
	LOG_FILE_PATH: string;

	// Strategy
	DEFAULT_CHECK_INTERVAL: number;
	MAX_ACTIVE_STRATEGIES: number;
	HISTORICAL_DATA_LIMIT: number;
}

const config: EnvironmentConfig = {
	// Server
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: parseInt(process.env.PORT || "5000", 10),
	HOST: process.env.HOST || "localhost",

	// Frontend
	FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
	ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [
		"http://localhost:3000",
		"http://localhost:3004",
		"http://localhost:3001",
		"http://localhost:3002",
		"http://localhost:3003",
	],

	// MongoDB
	MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/algotrade",
	MONGODB_TEST_URI:
		process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/algotrade_test",

	// Redis (Optional - disabled by default in development)
	USE_REDIS: process.env.USE_REDIS === "true",
	REDIS_HOST: process.env.REDIS_HOST || "localhost",
	REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
	REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
	REDIS_DB: parseInt(process.env.REDIS_DB || "0", 10),

	// JWT
	JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
	JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

	// Security
	BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
	API_RATE_LIMIT_WINDOW: parseInt(
		process.env.API_RATE_LIMIT_WINDOW || "15",
		10,
	),
	API_RATE_LIMIT_MAX: parseInt(process.env.API_RATE_LIMIT_MAX || "100", 10),

	// AnandRathi XTS API
	BROKER_NAME: process.env.BROKER_NAME || "anandrathi",
	XTS_API_BASE_URL:
		process.env.XTS_API_BASE_URL || "https://algozy.rathi.com",
	XTS_MARKET_DATA_URL:
		process.env.XTS_MARKET_DATA_URL || "https://algozy.rathi.com/apimarketdata",
	XTS_INTERACTIVE_URL:
		process.env.XTS_INTERACTIVE_URL || "https://algozy.rathi.com/interactive",
	XTS_API_KEY: process.env.XTS_API_KEY || "",
	XTS_API_SECRET: process.env.XTS_API_SECRET || "Rsyg217#oV",
	XTS_SOURCE: process.env.XTS_SOURCE || "WebAPI",

	// Market Data API (Separate credentials)
	MARKET_DATA_API_KEY: process.env.MARKET_DATA_API_KEY || "c1bbad7f9b5e2ac0cf5802",
	MARKET_DATA_API_SECRET: process.env.MARKET_DATA_API_SECRET || "Rsyg217#oV",
	MARKET_DATA_SOURCE: process.env.MARKET_DATA_SOURCE || "WebAPI",

	// Interactive Order API (Separate credentials)
	INTERACTIVE_API_KEY: process.env.INTERACTIVE_API_KEY || "c74e42e66ac93f76e56470",
	INTERACTIVE_API_SECRET: process.env.INTERACTIVE_API_SECRET || "Sehm320#UZ",
	INTERACTIVE_SOURCE: process.env.INTERACTIVE_SOURCE || "WebAPI",

	// Dealer API (Direct Trading) - Anand Rathi Algozy Platform
	DEALER_API_BASE_URL:
		process.env.DEALER_API_BASE_URL || "https://algozy.rathi.com",
	DEALER_SECRET_KEY: process.env.DEALER_SECRET_KEY || "Sehm320#UZ",
	DEALER_APP_KEY: process.env.DEALER_APP_KEY || "c74e42e66ac93f76e56470",
	DEALER_SOURCE: process.env.DEALER_SOURCE || "WEBAPI",
	DEALER_ID: process.env.DEALER_ID || "605267B",

	// WebSocket
	WS_PORT: parseInt(process.env.WS_PORT || "5000", 10),
	WS_PATH: process.env.WS_PATH || "/socket.io",
	WS_PING_TIMEOUT: parseInt(process.env.WS_PING_TIMEOUT || "60000", 10),
	WS_PING_INTERVAL: parseInt(process.env.WS_PING_INTERVAL || "25000", 10),

	// Logging
	LOG_LEVEL: process.env.LOG_LEVEL || "info",
	LOG_FILE_PATH: process.env.LOG_FILE_PATH || "./logs",

	// Strategy
	DEFAULT_CHECK_INTERVAL: parseInt(
		process.env.DEFAULT_CHECK_INTERVAL || "60000",
		10,
	),
	MAX_ACTIVE_STRATEGIES: parseInt(
		process.env.MAX_ACTIVE_STRATEGIES || "10",
		10,
	),
	HISTORICAL_DATA_LIMIT: parseInt(
		process.env.HISTORICAL_DATA_LIMIT || "500",
		10,
	),
};

// Validate required environment variables
const validateConfig = () => {
	const required = ["JWT_SECRET", "MONGODB_URI"];

	const missing = required.filter(
		(key) => !config[key as keyof EnvironmentConfig],
	);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}

	if (
		config.NODE_ENV === "production" &&
		config.JWT_SECRET === "your-secret-key"
	) {
		throw new Error("JWT_SECRET must be changed in production!");
	}
};

// Validate on load
if (config.NODE_ENV !== "test") {
	validateConfig();
}

export default config;
