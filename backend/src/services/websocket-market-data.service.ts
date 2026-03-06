import axios from "axios";
import socketIoClient from "socket.io-client";
import logger from "../utils/logger";
import marketDataService from "./market-data.service";
import User from "../models/User.model";

interface WebSocketSubscription {
	id: string;
	instruments: Array<{ exchangeSegment: number; exchangeInstrumentID: number }>;
	clientId: string;
	isActive: boolean;
}


class SocketIOMarketDataService {
	private socket: any = null;
	private subscriptions: Map<string, WebSocketSubscription> = new Map();
	private subscriptionCallbacks: Map<
		string,
		(message: Record<string, unknown>) => void
	> = new Map();
	// Track which instruments are subscribed to broker (to prevent duplicates)
	private subscribedInstruments: Map<string, Set<string>> = new Map(); // instrumentKey -> Set of subscriptionIds
	private isConnected = false;
	private isJoined = false; // Track if socket has received "joined" event
	private authToken: string | null = null;
	private cachedClientId: string | null = null;

	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10; // Increased from 5 to 10
	private reconnectDelay = 5000; // Initial reconnect delay
	private maxReconnectDelay = 60000; // Maximum delay between reconnects (60 seconds)

	private reconnectTimeout: any = null;
	private isResubscribing = false; // Prevent multiple simultaneous resubscribe calls
	private isStarting = false; // Prevent multiple simultaneous start calls
	private healthCheckInterval: NodeJS.Timeout | null = null; // Connection health monitoring
	private lastHeartbeat: Date | null = null;
	private readonly HEARTBEAT_TIMEOUT = 60000; // 60 seconds without heartbeat = unhealthy

	constructor() {
		logger.info("Socket.IO Market Data Service initialized (idle)");
	}

	/**
	 * Start Socket.IO connection (public method)
	 */
	public async start(clientId?: string): Promise<void> {
		// Prevent multiple simultaneous start calls
		if (this.isStarting) {
			logger.warn("Socket.IO start already in progress, skipping duplicate call");
			return;
		}

		if (this.isConnected) {
			logger.warn("Socket.IO already connected");
			return;
		}

		this.isStarting = true;
		try {
			await this.connect(clientId);
		} finally {
			// Reset flag after a delay to allow connection to complete
			setTimeout(() => {
				this.isStarting = false;
			}, 2000);
		}
	}

	/**
	 * Stop Socket.IO connection
	 */
	public stop(): void {
		// Clear health check interval
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}

		// Clear reconnect timeout
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		this.isConnected = false;
		this.isJoined = false;
		this.isStarting = false; // Reset flag on stop
		this.reconnectAttempts = 0; // Reset reconnect attempts
		this.subscriptions.clear();
		this.subscriptionCallbacks.clear();
		this.subscribedInstruments.clear(); // Clear instrument tracking
		this.cachedClientId = null;
		this.lastHeartbeat = null;
		logger.info("Socket.IO Market Data Service stopped");
	}

	private async resolveDefaultClientId(): Promise<string | null> {
		if (this.cachedClientId) {
			return this.cachedClientId;
		}

		try {
			const user = await User.findOne({
				"brokerCredentials.isConnected": true,
				"brokerCredentials.clientId": { $exists: true, $ne: "" },
			})
				.select("brokerCredentials.clientId")
				.lean();

			const clientId =
				(user as any)?.brokerCredentials?.clientId ??
				(user as any)?.brokerCredentials?.clientID;

			if (clientId && typeof clientId === "string") {
				this.cachedClientId = clientId;
				return clientId;
			}

			logger.warn(
				"No connected broker client found in database for market data service",
			);
			return null;
		} catch (error) {
			logger.error("Failed to resolve broker client ID from database", {
				error:
					error instanceof Error
						? { message: error.message, stack: error.stack }
						: error,
			});
			return null;
		}
	}

	/**
	 * Check if Socket.IO is active
	 */
	public isActive(): boolean {
		return this.isConnected;
	}

	/**
	 * Connect to market data Socket.IO
	 */
	private async connect(clientId?: string): Promise<void> {
		try {
			const token = await marketDataService.getMarketDataToken();

			if (!token) {
			    throw new Error('No market data token available. Please connect broker first.');
			}

			const baseRoot = "https://algozy.rathi.com";
			const socketPath = "/apimarketdata/socket.io";
			logger.info("Connecting to market data Socket.IO...");
			const brokerClientId =
				clientId ||
				process.env.MARKET_DATA_CLIENT_ID ||
				(await this.resolveDefaultClientId());

			if (!brokerClientId) {
				throw new Error(
					"No broker client ID available for market data WebSocket connection",
				);
			}

			this.cachedClientId = brokerClientId;

			// this.socket = io(socketUrl, {
			//     auth: {
			//         token: token
			//     },
			//     reconnection: true,
			//     reconnectionDelay: 5000,
			//     reconnectionDelayMax: 20000,
			//     reconnectionAttempts: 5,
			//     transports: ['websocket'],
			//     upgrade: false
			// });
			// Login to get token (REST)
			// const login = await axios.post(
			// 	`${baseHttp}/auth/login`,
			// 	{ appKey, secretKey, source: "WEBAPI" },
			// 	{
			// 		headers: { "Content-Type": "application/json" },
			// 	},
			// );
			
			// const token = (Array.isArray(login.data) ? login.data[0] : login.data)
			// 	?.result?.token;
			if (!token) throw new Error("No token from login");
			this.authToken = token;
			logger.info("Login success", { tokenLength: token.length });

			this.socket = socketIoClient(baseRoot, {
				path: socketPath,
				reconnection: true,
				reconnectionDelay: 2000,
				reconnectionDelayMax: 20000,
				reconnectionAttempts: 10,
				query: {
					token,
					userID: brokerClientId,
					publishFormat: "JSON",
					broadcastMode: "Full",
					transports: ["websocket"],
					EIO: 3,
				},
			});

			this.socket.on("connect", async () => {
				logger.info("Market data Socket.IO connected");
				this.isConnected = true;
				this.isStarting = false; // Reset flag on successful connection
				this.reconnectAttempts = 0; // Reset reconnect counter on successful connection
				this.lastHeartbeat = new Date(); // Reset heartbeat timestamp
				
				// Start health check monitoring
				this.startHealthCheck();
				// Don't subscribe immediately - wait for "joined" event
			});

			this.socket.on("message", (data: Record<string, unknown>) => {
				this.handleMessage(data);
			});

			this.socket.on("joined", (data: Record<string, unknown>) => {
				logger.info("Socket joined successfully", data);
				this.isJoined = true;
				// Now that socket is fully joined, resubscribe all instruments
				// Use a debounce to prevent multiple rapid calls
				if (this.isResubscribing) {
					logger.debug("Resubscribe already in progress, skipping");
					return;
				}
				try {
					// Add a small delay to ensure socket is fully ready
					setTimeout(() => {
						this.resubscribeAll();
					}, 500);
				} catch (e: any) {
					logger.error("Resubscribe on joined failed", { error: e?.message });
					this.isResubscribing = false;
				}
			});

			// Listen to event-code based events as per XTS Market Data API documentation
			// 1501 = TouchLine Event (JSON)
			this.socket.on('1501-json-full', (data: Record<string, unknown>) => {
				this.handleQuoteUpdate(data);
			});

			this.socket.on('1501-json-partial', (data: Record<string, unknown>) => {
				this.handleQuoteUpdate(data);
			});

			// 1502 = MarketDepth Event (JSON)
			this.socket.on('1502-json-full', (data: Record<string, unknown>) => {
				// Reduced logging - only log occasionally
				if (Math.random() < 0.01) { // Log 1% of events
					logger.debug('1502-json-full (MarketDepth Full) received');
				}
				this.handleQuoteUpdate(data);
			});

			this.socket.on('1502-json-partial', (data: Record<string, unknown>) => {
				// Reduced logging - only log occasionally
				if (Math.random() < 0.01) { // Log 1% of events
					logger.debug('1502-json-partial (MarketDepth Partial) received');
				}
				this.handleQuoteUpdate(data);
			});

			// 1512 = LTP Event (JSON)
			this.socket.on('1512-json-full', (data: any) => {
				this.handleQuoteUpdate(data);
			});

			this.socket.on('1512-json-partial', (data: any) => {
				this.handleQuoteUpdate(data);
			});

			// Keep generic handlers as fallback
			this.socket.on("quote", (data: Record<string, unknown>) => {
				this.handleQuoteUpdate(data);
			});

			this.socket.on("heartbeat", (data: Record<string, unknown>) => {
				this.lastHeartbeat = new Date();
				this.handleHeartbeat(data);
			});

			this.socket.on("error", (data: Record<string, unknown>) => {
				this.handleError(data);
			});

			this.socket.on("disconnect", (reason: string) => {
				logger.warn(`Market data Socket.IO disconnected: ${reason}`, {
					reconnectAttempts: this.reconnectAttempts,
					maxAttempts: this.maxReconnectAttempts,
				});
				this.isConnected = false;
				this.isJoined = false; // Reset joined flag on disconnect
				this.lastHeartbeat = null; // Reset heartbeat on disconnect
				
				// Stop health check on disconnect
				if (this.healthCheckInterval) {
					clearInterval(this.healthCheckInterval);
					this.healthCheckInterval = null;
				}

				// Clear instrument tracking on disconnect since broker loses track
				// We'll resubscribe everything when reconnected
				this.subscribedInstruments.clear();
				logger.info("Cleared instrument subscription tracking due to disconnect");
				
				// Attempt reconnection for various disconnect reasons
				if (
					reason === "io server disconnect" || 
					reason === "transport close" ||
					reason === "transport error" ||
					reason === "ping timeout"
				) {
					logger.warn(
						"XTS: Connection lost, attempting reconnect.",
						{ reason, attempt: this.reconnectAttempts + 1 }
					);
					this.scheduleReconnect(); // Trigger our own reconnect logic
				} else if (reason === "client disconnect") {
					logger.info("Client initiated disconnect - not reconnecting");
				} else {
					logger.warn(`Unexpected disconnect reason: ${reason} - attempting reconnect`);
					this.scheduleReconnect();
				}
			});

			this.socket.on("connect_error", (error: Error) => {
				logger.error("Market data Socket.IO connection error:", {
					message: error.message,
					stack: error.stack,
					reconnectAttempts: this.reconnectAttempts,
				});
				this.isConnected = false;
				this.isStarting = false; // Reset flag on connection error

				// Don't reconnect if it's an authentication issue
				if (
					error.message?.includes("token") ||
					error.message?.includes("403") ||
					error.message?.includes("401") ||
					error.message?.includes("authentication")
				) {
					logger.warn("Not reconnecting due to authentication issue", {
						error: error.message,
					});
					this.reconnectAttempts = 0; // Reset attempts for auth errors
					this.socket?.disconnect();
					return;
				}

				// For other connection errors, schedule reconnect
				if (this.reconnectAttempts < this.maxReconnectAttempts) {
					logger.info("Scheduling reconnect after connection error");
					this.scheduleReconnect();
				} else {
					logger.error("Max reconnection attempts reached after connection error");
				}
			});
		} catch (error) {
			logger.error("Failed to connect to market data Socket.IO:", error);
			this.isStarting = false; // Reset flag on exception
			if (
				error instanceof Error &&
				(error.message?.includes("token") || error.message?.includes("403"))
			) {
				logger.warn("Not attempting reconnect due to authentication issue");
				return;
			}
			throw error;
		}
	}

	scheduleReconnect() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			logger.error(
				"XTS: Max reconnection attempts reached, stopping reconnects.",
				{
					attempts: this.reconnectAttempts,
					maxAttempts: this.maxReconnectAttempts,
				}
			);
			// Reset attempts after a longer delay to allow retry later
			setTimeout(() => {
				this.reconnectAttempts = 0;
				logger.info("Reconnection attempts reset - can retry again");
			}, 300000); // Reset after 5 minutes
			return;
		}

		this.reconnectAttempts++;
		// Exponential backoff with max delay cap
		const delay = Math.min(
			this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
			this.maxReconnectDelay
		);

		logger.info(
			`XTS: Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms.`,
			{
				attempt: this.reconnectAttempts,
				maxAttempts: this.maxReconnectAttempts,
				delayMs: delay,
				delaySeconds: Math.round(delay / 1000),
			}
		);

		this.reconnectTimeout = setTimeout(async () => {
			try {
				logger.info(`XTS: Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
				await this.connect();
			} catch (error) {
				logger.error("Reconnect attempt failed:", error);
				// Schedule another reconnect if we haven't exceeded max attempts
				if (this.reconnectAttempts < this.maxReconnectAttempts) {
					this.scheduleReconnect();
				}
			}
		}, delay);
	}

	/**
	 * Start connection health monitoring
	 */
	private startHealthCheck(): void {
		// Clear existing health check if any
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
		}

		// Check connection health every 30 seconds
		this.healthCheckInterval = setInterval(() => {
			this.checkConnectionHealth();
		}, 30000);

		logger.info("Started WebSocket connection health monitoring");
	}

	/**
	 * Check connection health and reconnect if needed
	 */
	private checkConnectionHealth(): void {
		try {
			// Check if socket is connected
			if (!this.socket || !this.socket.connected) {
				logger.warn("WebSocket health check: Socket not connected");
				if (!this.reconnectTimeout && this.reconnectAttempts < this.maxReconnectAttempts) {
					this.scheduleReconnect();
				}
				return;
			}

			// Check heartbeat timeout
			if (this.lastHeartbeat) {
				const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat.getTime();
				if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT) {
					logger.warn("WebSocket health check: No heartbeat received", {
						timeSinceLastHeartbeatMs: timeSinceLastHeartbeat,
						timeoutMs: this.HEARTBEAT_TIMEOUT,
					});
					// Force disconnect to trigger reconnection
					this.socket.disconnect();
					return;
				}
			}

			// Check if joined
			if (!this.isJoined) {
				logger.warn("WebSocket health check: Not joined to broker");
				// Attempt to rejoin
				if (this.socket.connected) {
					logger.info("Attempting to rejoin broker...");
					// Rejoin logic would go here if needed
				}
			}

			logger.debug("WebSocket health check: Connection healthy", {
				connected: this.socket.connected,
				joined: this.isJoined,
				lastHeartbeat: this.lastHeartbeat?.toISOString(),
			});
		} catch (error) {
			logger.error("Error during WebSocket health check:", error);
		}
	}

	/**
	 * Handle incoming messages
	 */
	private handleMessage(data: Record<string, unknown>): void {
		try {
			// Handle different message types
			switch (data.type) {
				case "quote":
					this.handleQuoteUpdate(data);
					break;
				case "heartbeat":
					this.handleHeartbeat(data);
					break;
				case "error":
					this.handleError(data);
					break;
				default:
					logger.debug("Unknown message type:", data.type);
			}
		} catch (error) {
			logger.error("Error processing Socket.IO message:", error);
		}
	}

	/**
	 * Handle quote updates
	 */
	private handleQuoteUpdate(message: Record<string, unknown>): void {
		// Extract quote data - handle both string and object formats
		let data: any = message.data || message;
		
		// If data is a JSON string, parse it
		if (typeof data === 'string') {
			try {
				data = JSON.parse(data);
			} catch (e) {
				logger.error('Failed to parse JSON string in quote update:', e);
				return;
			}
		}
		
		// If message itself is a string, try parsing it
		if (typeof message === 'string') {
			try {
				data = JSON.parse(message);
			} catch (e) {
				logger.error('Failed to parse message string in quote update:', e);
				return;
			}
		}
		
		// Extract exchangeInstrumentID from various possible fields
		const exchangeInstrumentID = 
			data?.ExchangeInstrumentID || 
			data?.exchangeInstrumentID || 
			data?.InstrumentIdentifier?.ExchangeInstrumentID ||
			data?.InstrumentIdentifier?.ExchangeInstrumentId;

		// Update quote cache in market data service
		if (exchangeInstrumentID) {
			marketDataService.updateQuoteCache(Number(exchangeInstrumentID), data as Record<string, unknown>);
		} else {
			logger.debug('Could not extract exchangeInstrumentID from quote data', {
				dataType: typeof data,
				dataKeys: typeof data === 'object' && data !== null ? Object.keys(data).slice(0, 10) : 'N/A',
			});
		}

		// Broadcast quote updates to all subscribed clients
		const quoteData = {
			type: "quote_update",
			data: data,
			timestamp: new Date().toISOString(),
		};

		// Fan-out to any registered callbacks
		for (const [
			subscriptionId,
			callback,
		] of this.subscriptionCallbacks.entries()) {
			const sub = this.subscriptions.get(subscriptionId);
			if (sub && sub.isActive) {
				try {
					callback(quoteData as any);
				} catch (err) {
					logger.error("Error in subscription callback:", err);
				}
			}
		}
	}

	/**
	 * Handle heartbeat messages
	 */
	private handleHeartbeat(_message: Record<string, unknown>): void {
		logger.debug("Heartbeat received");
	}

	/**
	 * Handle error messages
	 */
	private handleError(message: Record<string, unknown>): void {
		logger.error("Socket.IO error message:", {
			message,
			connected: this.socket?.connected,
			joined: this.isJoined,
			reconnectAttempts: this.reconnectAttempts,
		});

		// Check for specific error types that require reconnection
		const errorMessage = String(message?.message || message?.error || message);
		
		if (
			errorMessage.includes("timeout") ||
			errorMessage.includes("connection lost") ||
			errorMessage.includes("network error")
		) {
			logger.warn("Network-related error detected - may need reconnection");
			if (this.socket && !this.socket.connected && this.reconnectAttempts < this.maxReconnectAttempts) {
				this.scheduleReconnect();
			}
		} else if (
			errorMessage.includes("authentication") ||
			errorMessage.includes("token") ||
			errorMessage.includes("401") ||
			errorMessage.includes("403")
		) {
			logger.error("Authentication error - stopping reconnection attempts");
			this.reconnectAttempts = 0; // Reset attempts for auth errors
			if (this.socket) {
				this.socket.disconnect();
			}
		}
	}

	/**
	 * Get instrument key string for tracking
	 */
	private getInstrumentKey(instrument: { exchangeSegment: number; exchangeInstrumentID: number }): string {
		return `${instrument.exchangeSegment}_${instrument.exchangeInstrumentID}`;
	}

	/**
	 * Check if instrument is already subscribed to broker
	 */
	private isInstrumentSubscribed(instrument: { exchangeSegment: number; exchangeInstrumentID: number }): boolean {
		const key = this.getInstrumentKey(instrument);
		const subscriptionIds = this.subscribedInstruments.get(key);
		return subscriptionIds !== undefined && subscriptionIds.size > 0;
	}

	/**
	 * Track instrument subscription
	 */
	private trackInstrumentSubscription(
		instrument: { exchangeSegment: number; exchangeInstrumentID: number },
		subscriptionId: string,
	): void {
		const key = this.getInstrumentKey(instrument);
		if (!this.subscribedInstruments.has(key)) {
			this.subscribedInstruments.set(key, new Set());
		}
		this.subscribedInstruments.get(key)!.add(subscriptionId);
	}

	/**
	 * Untrack instrument subscription
	 */
	private untrackInstrumentSubscription(
		instrument: { exchangeSegment: number; exchangeInstrumentID: number },
		subscriptionId: string,
	): void {
		const key = this.getInstrumentKey(instrument);
		const subscriptionIds = this.subscribedInstruments.get(key);
		if (subscriptionIds) {
			subscriptionIds.delete(subscriptionId);
			if (subscriptionIds.size === 0) {
				this.subscribedInstruments.delete(key);
			}
		}
	}

	/**
	 * Subscribe to instruments
	 */
	public subscribe(
		clientId: string,
		instruments: Array<{
			exchangeSegment: number;
			exchangeInstrumentID: number;
		}>,
	): string {
		const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const subscription: WebSocketSubscription = {
			id: subscriptionId,
			instruments,
			clientId,
			isActive: true,
		};

		this.subscriptions.set(subscriptionId, subscription);

		// Check if any instruments need new broker subscription (BEFORE tracking)
		const newInstruments = instruments.filter(inst => !this.isInstrumentSubscribed(inst));
		const existingInstruments = instruments.filter(inst => this.isInstrumentSubscribed(inst));

		// Track which instruments are subscribed (after checking)
		instruments.forEach(instrument => {
			this.trackInstrumentSubscription(instrument, subscriptionId);
		});

		if (existingInstruments.length > 0) {
			logger.debug("Some instruments already subscribed, reusing existing broker subscription", {
				subscriptionId,
				existingInstruments: existingInstruments.map(inst => ({
					exchangeSegment: inst.exchangeSegment,
					exchangeInstrumentID: inst.exchangeInstrumentID,
				})),
			});
		}

		// Only send subscription for NEW instruments if socket is connected AND joined
		if (newInstruments.length > 0 && this.isConnected && this.isJoined && this.socket) {
			// Create a temporary subscription with only new instruments
			const newSubscription: WebSocketSubscription = {
				...subscription,
				instruments: newInstruments,
			};
			this.sendSubscription(newSubscription);
		} else if (newInstruments.length > 0) {
			// Subscription will be sent automatically when socket joins (via resubscribeAll)
			logger.info("Subscription queued for new instruments, will be sent after socket joins", {
				subscriptionId,
				newInstrumentsCount: newInstruments.length,
				isConnected: this.isConnected,
				isJoined: this.isJoined,
			});
		}

		logger.info(
			`Subscription created: ${subscriptionId} for client: ${clientId}`,
			{
				totalInstruments: instruments.length,
				newInstruments: newInstruments.length,
				existingInstruments: existingInstruments.length,
			},
		);
		return subscriptionId;
	}

	/**
	 * Unsubscribe from instruments
	 */
	public unsubscribe(subscriptionId: string): boolean {
		const subscription = this.subscriptions.get(subscriptionId);
		if (!subscription) {
			return false;
		}

		subscription.isActive = false;
		this.subscriptions.delete(subscriptionId);
		this.subscriptionCallbacks.delete(subscriptionId);

		// Untrack instrument subscriptions
		subscription.instruments.forEach(instrument => {
			this.untrackInstrumentSubscription(instrument, subscriptionId);
		});

		// Check if any instruments need to be unsubscribed from broker
		// Only unsubscribe if no other active subscriptions exist for that instrument
		const instrumentsToUnsubscribe: Array<{ exchangeSegment: number; exchangeInstrumentID: number }> = [];
		
		subscription.instruments.forEach(instrument => {
			const key = this.getInstrumentKey(instrument);
			const remainingSubscriptions = this.subscribedInstruments.get(key);
			// If no remaining subscriptions, we need to unsubscribe from broker
			if (!remainingSubscriptions || remainingSubscriptions.size === 0) {
				instrumentsToUnsubscribe.push(instrument);
			}
		});

		// Only send unsubscription to broker if no other subscriptions exist for these instruments
		if (instrumentsToUnsubscribe.length > 0 && this.isConnected && this.socket) {
			logger.info("Unsubscribing instruments from broker (no remaining subscriptions)", {
				subscriptionId,
				instruments: instrumentsToUnsubscribe,
			});
			// Note: Broker API might need unsubscription per instrument, but for now we just log
			// The broker will handle cleanup when socket disconnects
		}

		logger.info(`Subscription removed: ${subscriptionId}`, {
			instrumentsToUnsubscribe: instrumentsToUnsubscribe.length,
		});
		return true;
	}

	/**
	 * Send subscription to Socket.IO
	 */
	private async sendSubscription(
		subscription: WebSocketSubscription,
	): Promise<void> {
		if (!this.isConnected) {
			return;
		}

		// Call broker REST subscription for 1501 (TouchLine), 1502 (MarketDepth), and 1512 (LTP) as per XTS docs
		try {
			const baseRoot = "https://algozy.rathi.com";
			const baseHttp = `${baseRoot}/apimarketdata`;
			if (!this.authToken) {
				logger.warn("sendSubscription: Missing auth token");
				return;
			}

			const headers = {
				Authorization: this.authToken,
				"Content-Type": "application/json",
			} as const;

			// Clean instruments array - remove fullSymbolName as XTS API doesn't accept it
			// Use segment as-is from database (3 for MCXFO)
			const cleanInstruments = subscription.instruments.map((inst: any) => ({
				exchangeSegment: inst.exchangeSegment,
				exchangeInstrumentID: inst.exchangeInstrumentID,
			}));
			

			// 1501 = TouchLine Event
			const payload1501 = {
				instruments: cleanInstruments,
				xtsMessageCode: 1501,
			};

			// 1502 = MarketDepth Event
			const payload1502 = {
				instruments: cleanInstruments,
				xtsMessageCode: 1502,
			};

			// 1512 = LTP Event
			const payload1512 = {
				instruments: cleanInstruments,
				xtsMessageCode: 1512,
			};

			// Subscribe to TouchLine (1501)
			try {
				const response1501 = await axios.post(`${baseHttp}/instruments/subscription`, payload1501, {
					headers,
				});
				logger.info("Broker subscription requested", {
					code: 1501,
					eventType: "TouchLine",
					instruments: subscription.instruments,
					response: response1501.data,
				});
			} catch (e1501: any) {
				const errorData = e1501?.response?.data;
				const errors = errorData?.result?.errors || [];
				const errorCode = errorData?.code;
				const errorDescription = errorData?.description;
				
				// "Instrument Already Subscribed" is not a real error - it's just a warning
				if (errorCode === 'e-session-0002' && errorDescription?.includes('Already Subscribed')) {
					logger.debug("TouchLine (1501) subscription - instrument already subscribed", {
						code: errorCode,
						description: errorDescription,
						instruments: cleanInstruments,
					});
				} else {
					logger.error("Broker subscription request failed for 1501 (TouchLine)", {
						status: e1501?.response?.status,
						statusText: e1501?.response?.statusText,
						data: errorData,
						errors: errors,
						message: e1501?.message,
						payload: payload1501,
					});
				}
			}

			// Subscribe to MarketDepth (1502)
			try {
				const response1502 = await axios.post(`${baseHttp}/instruments/subscription`, payload1502, {
					headers,
				});
				logger.info("Broker subscription requested", {
					code: 1502,
					eventType: "MarketDepth",
					instruments: subscription.instruments,
					response: response1502.data,
				});
			} catch (e1502: any) {
				const errorData = e1502?.response?.data;
				const errors = errorData?.result?.errors || [];
				const errorCode = errorData?.code;
				const errorDescription = errorData?.description;
				
				// "Instrument Already Subscribed" is not a real error - it's just a warning
				if (errorCode === 'e-session-0002' && errorDescription?.includes('Already Subscribed')) {
					logger.debug("MarketDepth (1502) subscription - instrument already subscribed", {
						code: errorCode,
						description: errorDescription,
						instruments: cleanInstruments,
					});
				} else {
					logger.error("Broker subscription request failed for 1502 (MarketDepth)", {
						status: e1502?.response?.status,
						statusText: e1502?.response?.statusText,
						data: errorData,
						errors: errors,
						message: e1502?.message,
						payload: payload1502,
					});
				}
			}

			// Subscribe to LTP (1512)
			try {
				const response1512 = await axios.post(`${baseHttp}/instruments/subscription`, payload1512, {
					headers,
				});
				logger.info("Broker subscription requested", {
					code: 1512,
					eventType: "LTP",
					instruments: subscription.instruments,
					response: response1512.data,
				});
			} catch (e1512: any) {
				const errorData = e1512?.response?.data;
				const errors = errorData?.result?.errors || [];
				const errorCode = errorData?.code;
				const errorDescription = errorData?.description;
				
				// "Instrument Already Subscribed" is not a real error - it's just a warning
				if (errorCode === 'e-session-0002' && errorDescription?.includes('Already Subscribed')) {
					logger.debug("LTP (1512) subscription - instrument already subscribed", {
						code: errorCode,
						description: errorDescription,
						instruments: cleanInstruments,
					});
				} else {
					logger.error("Broker subscription request failed for 1512 (LTP)", {
						status: e1512?.response?.status,
						statusText: e1512?.response?.statusText,
						data: errorData,
						errors: errors,
						message: e1512?.message,
						payload: payload1512,
					});
				}
			}
		} catch (e: any) {
			const errorData = e?.response?.data;
			logger.error("Broker subscription request failed (general error)", {
				status: e?.response?.status,
				statusText: e?.response?.statusText,
				data: errorData,
				message: e?.message,
				stack: e?.stack,
			});
		}
	}

	/**
	 * Subscribe with a callback to receive quote updates
	 */
	public subscribeWithCallback(
		clientId: string,
		instruments: Array<{
			exchangeSegment: number;
			exchangeInstrumentID: number;
		}>,
		onQuote: (message: Record<string, unknown>) => void,
	): string {
		const id = this.subscribe(clientId, instruments);
		this.subscriptionCallbacks.set(id, onQuote);
		return id;
	}


	/**
	 * Resubscribe to all active subscriptions
	 * After reconnect, we need to resubscribe all instruments since broker lost track
	 * But we'll track them to prevent duplicate subscriptions within the same session
	 */
	private resubscribeAll(): void {
		// Prevent multiple simultaneous resubscribe calls
		if (this.isResubscribing) {
			logger.debug("Resubscribe already in progress, skipping duplicate call");
			return;
		}

		this.isResubscribing = true;

		try {
			// After disconnect/reconnect, subscribedInstruments is cleared
			// So we need to resubscribe all active subscriptions
			// But group by clientId and collect unique instruments to avoid duplicate API calls
			
			// Group subscriptions by clientId and collect unique instruments
			const subscriptionsByClient = new Map<string, Array<{ exchangeSegment: number; exchangeInstrumentID: number }>>();
			const instrumentKeysSeen = new Set<string>();
			
			for (const subscription of this.subscriptions.values()) {
				if (subscription.isActive) {
					if (!subscriptionsByClient.has(subscription.clientId)) {
						subscriptionsByClient.set(subscription.clientId, []);
					}
					
					subscription.instruments.forEach(instrument => {
						const key = this.getInstrumentKey(instrument);
						// Check if already tracked (might happen if resubscribeAll called multiple times)
						const alreadyTracked = this.subscribedInstruments.has(key) && 
							this.subscribedInstruments.get(key)!.size > 0;
						
						if (!alreadyTracked) {
							// Only add if we haven't seen this instrument for this client yet
							const clientInstrumentKey = `${subscription.clientId}_${key}`;
							if (!instrumentKeysSeen.has(clientInstrumentKey)) {
								instrumentKeysSeen.add(clientInstrumentKey);
								const existing = subscriptionsByClient.get(subscription.clientId)!;
								// Avoid duplicates within same client
								if (!existing.some(inst => 
									inst.exchangeSegment === instrument.exchangeSegment &&
									inst.exchangeInstrumentID === instrument.exchangeInstrumentID
								)) {
									existing.push(instrument);
								}
							}
						}
					});
				}
			}

			// Send subscriptions for unique instruments per client
			let totalInstruments = 0;
			for (const [clientId, instruments] of subscriptionsByClient.entries()) {
				if (instruments.length > 0) {
					totalInstruments += instruments.length;
					const tempSubscription: WebSocketSubscription = {
						id: `resub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						instruments,
						clientId,
						isActive: true,
					};
					// Track these instruments BEFORE sending subscription
					// This prevents duplicate subscriptions if resubscribeAll is called multiple times
					instruments.forEach(instrument => {
						this.trackInstrumentSubscription(instrument, tempSubscription.id);
					});
					
					this.sendSubscription(tempSubscription).catch((e) => {
						logger.error("Resubscribe failed", {
							clientId,
							instrumentsCount: instruments.length,
							error: (e as any)?.message,
						});
						// Untrack on error
						instruments.forEach(instrument => {
							this.untrackInstrumentSubscription(instrument, tempSubscription.id);
						});
					});
				}
			}

			logger.info("Resubscribed active subscriptions after reconnect", {
				totalSubscriptions: this.subscriptions.size,
				uniqueInstruments: totalInstruments,
				clients: subscriptionsByClient.size,
			});
		} finally {
			// Reset flag after a short delay to allow subscription requests to complete
			setTimeout(() => {
				this.isResubscribing = false;
			}, 2000);
		}
	}

	/**
	 * Get connection status
	 */
	public getStatus(): { connected: boolean; subscriptions: number } {
		return {
			connected: this.isConnected,
			subscriptions: this.subscriptions.size,
		};
	}

	/**
	 * Close Socket.IO connection
	 */
	public close(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		this.isConnected = false;
		this.isJoined = false;
		this.subscriptions.clear();
		this.subscriptionCallbacks.clear();
		this.subscribedInstruments.clear(); // Clear instrument tracking
	}
}

export default new SocketIOMarketDataService();
