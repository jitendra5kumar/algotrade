import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type NextFunction,
	type Request,
	type Response,
} from "express";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/environment";
import activityLogRoutes from "./routes/activity-log.routes";
import adminRoutes from "./routes/admin.routes";

// Import routes
import authRoutes from "./routes/auth.routes";
import broadcastRoutes from "./routes/broadcast.routes";
import brokerRoutes from "./routes/broker.routes";
import chatRoutes from "./routes/chat.routes";
import indicatorRoutes from "./routes/indicator.routes";
import instrumentRoutes from "./routes/instrument.routes";
import marketDataRoutes from "./routes/market-data.routes";
import strategyRoutes from "./routes/strategy.routes";
import tokenManagerRoutes from "./routes/token-manager.routes";
import tradeRoutes from "./routes/trade.routes";
import tradingRoutes from "./routes/trading.routes";
import xtsInstrumentsRoutes from "./routes/xts-instruments.routes";
import { sendError } from "./utils/helpers";
import logger from "./utils/logger";

class App {
	public app: Application;

	constructor() {
		this.app = express();
		this.configureMiddleware();
		this.configureRoutes();
		this.configureErrorHandling();
	}

	private configureMiddleware(): void {
		// Request timeout middleware - prevent hanging requests
		this.app.use((req: Request, res: Response, next: NextFunction) => {
			// Set timeout for all requests (30 seconds)
			const timeout = setTimeout(() => {
				if (!res.headersSent) {
					logger.error("Request timeout", {
						url: req.url,
						method: req.method,
						timeout: 30000
					});
					res.status(504).json({
						success: false,
						message: "Request timeout - server took too long to respond",
						timestamp: new Date().toISOString()
					});
				}
			}, 30000); // 30 seconds timeout

			// Clear timeout when response is sent
			res.on("finish", () => {
				clearTimeout(timeout);
			});

			next();
		});

		// Security middleware
		this.app.use(helmet());

		// CORS configuration
		this.app.use(
			cors({
				origin: (origin, callback) => {
					// Allow requests with no origin (mobile apps, postman, etc.)
					if (!origin) return callback(null, true);

					if (config.ALLOWED_ORIGINS.includes(origin)) {
						callback(null, true);
					} else {
						callback(new Error("Not allowed by CORS"));
					}
				},
				credentials: true,
				methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
				allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			}),
		);

		// Body parsing middleware
		this.app.use(express.json({ limit: "10mb" }));
		this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

		// Cookie parser
		this.app.use(cookieParser());

		// Compression
		this.app.use(compression());

		// HTTP request logger (morgan handles all request logging)
		if (config.NODE_ENV === "development") {
			this.app.use(morgan("dev"));
		} else {
			this.app.use(
				morgan("combined", {
					stream: {
						write: (message: string) => logger.info(message.trim()),
					},
				}),
			);
		}
	}

	private configureRoutes(): void {
		// Health check endpoint
		this.app.get("/health", async (_req: Request, res: Response) => {
			try {
				// Check database connection
				const database = (await import("./config/database")).default;
				const dbStatus = database.getConnectionStatus();
				const dbHealth = await database.healthCheck();

				res.status(dbStatus && dbHealth ? 200 : 503).json({
					success: dbStatus && dbHealth,
					message: dbStatus && dbHealth ? "Server is running" : "Server is running but database connection issue",
					timestamp: new Date().toISOString(),
					environment: config.NODE_ENV,
					database: {
						connected: dbStatus,
						healthy: dbHealth
					}
				});
			} catch (error) {
				logger.error("Health check error:", error);
				res.status(503).json({
					success: false,
					message: "Server health check failed",
					timestamp: new Date().toISOString(),
					environment: config.NODE_ENV
				});
			}
		});

		// API routes
		this.app.use("/api/auth", authRoutes);
		this.app.use("/api/broker", brokerRoutes);
		this.app.use("/api/strategies", strategyRoutes);
		this.app.use("/api/trades", tradeRoutes);
		this.app.use("/api/trading", tradingRoutes);
		this.app.use("/api/activity-logs", activityLogRoutes);
		this.app.use("/api/admin", adminRoutes);
		this.app.use("/api/chat", chatRoutes);
		this.app.use("/api/broadcast", broadcastRoutes);
		this.app.use("/api/indicators", indicatorRoutes);
		this.app.use("/api/instruments", instrumentRoutes);
		this.app.use("/api/xts-instruments", xtsInstrumentsRoutes);
		this.app.use("/api/market-data", marketDataRoutes);
		this.app.use("/api/tokens", tokenManagerRoutes);

		// 404 handler
		this.app.use("*", (req: Request, res: Response) => {
			sendError(res, `Route ${req.originalUrl} not found`, 404);
		});
	}

	private configureErrorHandling(): void {
		// Global error handler
		this.app.use(
			(err: unknown, _req: Request, res: Response, _next: NextFunction) => {
				logger.error("Global error handler:", err);

				// Mongoose validation error
				if ((err as any)?.name === "ValidationError") {
					const messages = Object.values((err as any).errors).map(
						(e: any) => e.message,
					);
					return sendError(res, messages.join(", "), 400);
				}

				// Mongoose duplicate key error
				if ((err as any)?.code === 11000) {
					const field = Object.keys((err as any).keyPattern)[0];
					return sendError(res, `${field} already exists`, 409);
				}

				// JWT errors
				if ((err as any)?.name === "JsonWebTokenError") {
					return sendError(res, "Invalid token", 401);
				}

				if ((err as any)?.name === "TokenExpiredError") {
					return sendError(res, "Token expired", 401);
				}

				// CORS error
				if ((err as any)?.message === "Not allowed by CORS") {
					return sendError(res, "CORS policy violation", 403);
				}

				// Default error
				const statusCode =
					(err as any)?.statusCode || (err as any)?.status || 500;
				const message = (err as any)?.message || "Internal server error";

				return sendError(res, message, statusCode);
			},
		);
	}

	public getApp(): Application {
		return this.app;
	}
}

export default new App().getApp();
