import axios, { type AxiosInstance } from "axios";
import User from "../models/User.model";
import logger from "../utils/logger";
import { jwtDecode } from "jwt-decode";

interface MarketDataToken {
	token: string;
	expiry: Date;
	lastRefresh: Date;
	isActive: boolean;
}

interface CandleData {
	timestamp: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	oi?: number;
}

interface HistoricalDataRequest {
	exchangeSegment: number;
	exchangeInstrumentID: number;
	startTime: string;
	endTime: string;
	compressionValue: number;
}

class MarketDataService {
	getCurrentPrice(_exchangeSegment: string, _exchangeInstrumentID: number) {
		throw new Error("Method not implemented.");
	}
	getSymbolPrice(_exchangeSegment: string, _exchangeInstrumentID: number) {
		throw new Error("Method not implemented.");
	}
	private apiClient: AxiosInstance;
	private marketDataToken: MarketDataToken | null = null;
	private readonly MARKET_DATA_BASE_URL =
		"https://algozy.rathi.com/apimarketdata";
	private readonly API_CREDENTIALS = {
		secretKey: process.env.MARKET_DATA_API_SECRET || "Fxsw187@RK",
		appKey: process.env.MARKET_DATA_API_KEY || "0df7553a0e6416f834a145",
		source: "WEBAPI",
	};
	private systemUserId: string | null = null;
	private tokenInvalidated: boolean = false; // Flag to prevent reloading invalid token from DB
	// Quote cache: exchangeInstrumentID -> latest quote data
	private quoteCache: Map<number, { data: Record<string, unknown>; timestamp: Date }> = new Map();
	// Exchange segment mapping: number -> string
	private readonly exchangeSegmentMap: { [key: number]: string } = {
		1: "NSECM",   // NSE Cash Market
		2: "NSEFO",   // NSE Futures & Options
		3: "NSECD",   // NSE Currency Derivatives
		11: "BSECM",  // BSE Cash Market
		12: "BSEFO",  // BSE Futures & Options
		51: "MCXFO",  // MCX Futures & Options
	};

	// Reverse mapping: string -> number (unused, kept for reference)
	// private readonly exchangeSegmentToNumber: { [key: string]: number } = {
	// 	"NSECM": 1,
	// 	"NSEFO": 2,
	// 	"NSECD": 3,
	// 	"BSECM": 11,
	// 	"BSEFO": 12,
	// 	"MCXFO": 51,
	// };

	constructor() {
		this.apiClient = axios.create({
			baseURL: this.MARKET_DATA_BASE_URL,
			timeout: 30000,
			headers: {
				"Content-Type": "application/json",
			},
		});
		// Initialize by loading token from database (fire and forget)
		this.initialize().catch((error) => {
			logger.error("Failed to initialize market data service:", error);
		});
	}

	/**
	 * Initialize service by loading token from database
	 */
	private async initialize(): Promise<void> {
		try {
			// Find first admin user (system user) or create a system user
			const adminUser = await User.findOne({
				role: { $in: ["ADMIN", "SUPER_ADMIN"] },
			})
				.select("_id marketDataCredentials")
				.exec();

			if (adminUser && adminUser._id) {
				this.systemUserId = (adminUser._id as any).toString();
				await this.loadTokenFromDatabase();
			} else {
				logger.warn("No admin user found for market data token storage");
			}
		} catch (error: unknown) {
			logger.error("Error initializing market data service:", error);
		}
	}

	/**
	 * Load token from database
	 */
	private async loadTokenFromDatabase(): Promise<void> {
		if (!this.systemUserId) return;

		try {
			const user = await User.findById(this.systemUserId)
				.select('+marketDataCredentials.token +marketDataCredentials.marketDataTokenEnc')
				.exec();

			// Check for encrypted token first (marketDataTokenEnc)
			let token: string | null = null;
			let expiry: Date | null = null;

			if (user && user.marketDataCredentials) {
				// Try to get encrypted token and decrypt it FIRST (priority)
				if ((user.marketDataCredentials as any)?.marketDataTokenEnc) {
					const { decrypt } = await import('../utils/crypto.util');
					try {
						const encryptedTokenValue = (user.marketDataCredentials as any).marketDataTokenEnc;
						token = decrypt(encryptedTokenValue);
						console.log('✅ [Market Data] Decrypted token from database:', {
							hasEncryptedToken: !!encryptedTokenValue,
							tokenLength: token?.length || 0,
							tokenPreview: token ? token.substring(0, 20) + '...' : null
						});
						logger.info('Market data token decrypted successfully from database');
					} catch (decryptError: any) {
						logger.error('Error decrypting market data token:', {
							error: decryptError?.message || decryptError,
							stack: decryptError?.stack
						});
						console.error('❌ [Market Data] Decryption failed:', {
							error: decryptError?.message || decryptError,
							willTryPlainToken: !!user.marketDataCredentials.token
						});
					}
				}
				
				// Fallback to plain token only if decryption failed or encrypted token not found
				if (!token && user.marketDataCredentials.token) {
					token = user.marketDataCredentials.token;
					console.log('⚠️ [Market Data] Using plain token from database (encrypted token not available or decryption failed)');
					logger.warn('Using plain token from database - encrypted token not available');
				}

				// Get expiry - check both expiry and marketDataExpiresAt
				if ((user.marketDataCredentials as any)?.marketDataExpiresAt) {
					expiry = new Date((user.marketDataCredentials as any).marketDataExpiresAt);
				} else if (user.marketDataCredentials.expiry) {
					expiry = new Date(user.marketDataCredentials.expiry);
				}

				if (token) {
					// Load token from database regardless of expiry - don't auto-refresh
					// Use expiry from DB if available, otherwise set default
					const tokenExpiry = expiry || new Date(Date.now() + 24 * 60 * 60 * 1000);
					
					this.marketDataToken = {
						token: token,
						expiry: tokenExpiry,
						lastRefresh: user.marketDataCredentials.lastRefresh || new Date(),
						isActive: user.marketDataCredentials.isActive !== false, // Default to true if not set
					};
					
					const now = new Date();
					const isExpired = expiry ? expiry <= now : false;
					
					logger.info('Market data token loaded from database', {
						expiry: tokenExpiry.toISOString(),
						now: now.toISOString(),
						isExpired: isExpired,
						note: 'Token loaded from DB - will use as-is, no auto-refresh'
					});
					console.log('✅ [Market Data] Token loaded from database:', {
						hasToken: !!token,
						expiry: tokenExpiry.toISOString(),
						isExpired: isExpired,
						note: 'Will use token from DB - no auto-refresh'
					});
				} else {
					console.log('⚠️ [Market Data] No token found in database');
				}
			} else {
				console.log('⚠️ [Market Data] No user or marketDataCredentials found');
			}
		} catch (error: unknown) {
			logger.error('Error loading market data token from database:', error);
			console.error('❌ [Market Data] Error loading token:', error);
		}
	}

	/**
	 * Save token to database
	 */
	private async saveTokenToDatabase(
		token: string,
		expiry: Date,
	): Promise<void> {
		if (!this.systemUserId) {
			// Try to find admin user again
			const adminUser = await User.findOne({
				role: { $in: ["ADMIN", "SUPER_ADMIN"] },
			})
				.select("_id")
				.exec();

			if (adminUser && adminUser._id) {
				this.systemUserId = (adminUser._id as any).toString();
			} else {
				logger.warn("Cannot save market data token: No system user found");
				return;
			}
		}

		try {
			// Encrypt the token before saving
			const { encrypt } = await import('../utils/crypto.util');
			const encryptedToken = encrypt(token);

			await User.findByIdAndUpdate(this.systemUserId, {
				$set: {
					'marketDataCredentials.marketDataTokenEnc': encryptedToken,
					'marketDataCredentials.token': token, // Keep plain token as backup
					'marketDataCredentials.expiry': expiry,
					'marketDataCredentials.marketDataExpiresAt': expiry,
					'marketDataCredentials.lastRefresh': new Date(),
					'marketDataCredentials.isActive': true,
					'marketDataCredentials.connectedAt': new Date(),
				},
			});
			logger.info('Market data token saved to database (encrypted)');
			console.log('✅ [Market Data] Token saved to database:', {
				hasEncryptedToken: !!encryptedToken,
				expiry: expiry.toISOString()
			});
		} catch (error: unknown) {
			logger.error('Error saving market data token to database:', error);
			console.error('❌ [Market Data] Error saving token:', error);
		}
	}

	/**
	 * Get market data token
	 * NOTE: Uses stored token from database. Refreshes if expired or invalid.
	 */
	public async getMarketDataToken(): Promise<string> {
		try {
			// If token was invalidated, skip DB and fetch fresh token
			if (this.tokenInvalidated) {
				logger.info("Token was invalidated, skipping DB and fetching fresh token");
				this.marketDataToken = null;
				this.tokenInvalidated = false; // Reset flag
			} else {
				// Load token from database first if not in memory
				if (!this.marketDataToken && this.systemUserId) {
					await this.loadTokenFromDatabase();
				}
			}

			// Check if we have a token and if it's valid (not expired)
			if (this.marketDataToken) {
				const token = this.marketDataToken.token;
				
				// First check if token is not empty
				if (!token || token.trim().length === 0) {
					logger.warn("Token exists but is empty, fetching new token...");
					// Clear invalid token
					this.marketDataToken = null;
				} else if (this.isTokenValid()) {
					// Token is valid - use it
					logger.info("Using existing market data token from database", {
						tokenLength: token.length,
						expiry: this.marketDataToken.expiry.toISOString(),
					});
					return token.trim();
				} else {
					// Token exists but is expired or invalid
					logger.warn("Token expired or invalid, fetching new token...", {
						expiry: this.marketDataToken.expiry.toISOString(),
						isActive: this.marketDataToken.isActive,
						hasToken: !!token,
					});
					// Clear expired token to force refresh
					this.marketDataToken = null;
				}
			}

			// Fetch new token if we don't have one or if it's expired/invalid
			logger.info("Fetching new market data token...");

			const response = await this.apiClient.post("/auth/login", {
				secretKey: this.API_CREDENTIALS.secretKey,
				appKey: this.API_CREDENTIALS.appKey,
				source: this.API_CREDENTIALS.source,
			});

			// Handle both array and object response formats
			const responseData = Array.isArray(response.data)
				? response.data[0]
				: response.data;

			if (responseData?.result?.token) {
				const token = responseData.result.token;
				const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

				this.marketDataToken = {
					token,
					expiry,
					lastRefresh: new Date(),
					isActive: true,
				};

				// Save to database
				await this.saveTokenToDatabase(token, expiry);

				logger.info(
					"Market data token obtained successfully and saved to database",
				);
				return token;
			}

			throw new Error("Failed to get market data token");
		} catch (error: unknown) {
			logger.error("Error getting market data token:", error);

			// Check if it's a CTCL restriction error
			if ((error as any).response?.data?.description?.includes("CTCL")) {
				throw new Error(
					"Market data API is restricted to CTCL (Computer-to-Computer Link) connections only. Please contact your broker for CTCL access.",
				);
			}

			throw new Error(
				(error as any).response?.data?.description || "Failed to get market data token",
			);
		}
	}

	/**
	 * Check if current token is valid
	 * NOTE: Only checks if token exists, does NOT auto-refresh based on expiry
	 */
	private isTokenValid(): boolean {
		if (!this.marketDataToken || !this.marketDataToken.isActive) return false;
		
		// Just check if token exists - don't check expiry for auto-refresh
		// Token will be used as-is from database
		return !!this.marketDataToken.token && !this.isExpired(this.marketDataToken.token) && this.isTodaysToken(this.marketDataToken.token);
	}

	/**
	 * Get historical candle data (OHLC)
	 * GET /instruments/ohlc?exchangeSegment=1&exchangeInstrumentID=22&startTime=Jul 14 2025 091500&endTime=Jul 15 2025 153000&compressionValue=60
	 */
	public async getHistoricalData(
		request: HistoricalDataRequest,
	): Promise<CandleData[]> {
		try {
			const token = await this.getMarketDataToken();
			console.log('token retrieved',token)
			// Convert exchangeSegment number to string format
			const exchangeSegmentStr =
				this.exchangeSegmentMap[request.exchangeSegment] || "NSECM";
			//Convert the start and end times to the required format
			const startTime = this.convertDate(request.startTime);
			const endTime = this.convertDate(request.endTime);
			console.log(`params: ${exchangeSegmentStr}, ${request.exchangeInstrumentID}, ${startTime}, ${endTime}, ${request.compressionValue}`)
			logger.info("Fetching historical OHLC data:", {
				exchangeSegment: exchangeSegmentStr,
				exchangeInstrumentID: request.exchangeInstrumentID,
				startTime: startTime,
				endTime: endTime,
				compressionValue: request.compressionValue,
			});

			const response = await this.apiClient.get("/instruments/ohlc", {
				params: {
					exchangeSegment: exchangeSegmentStr,
					exchangeInstrumentID: request.exchangeInstrumentID,
					startTime: startTime,
					endTime: endTime,
					compressionValue: request.compressionValue,
				},
				headers: {
					Authorization: token,
				},
			});

			// Handle both array and object response formats
			const responseData = Array.isArray(response.data)
				? response.data[0]
				: response.data;

			if (responseData?.result) {
				// Check for dataReponse field (pipe-separated format)
				const rawData = responseData.result.dataReponse || responseData.result;
				const candles = this.transformOHLCData(rawData);
				logger.info(`Historical OHLC data fetched: ${candles.length} candles`);
				if(candles.length === 1) {
					console.log('1 candle',candles[0])
				}
				return candles;
			}

			return [];
		} catch (error: unknown) {
			logger.error("Error fetching historical OHLC data:", {
				error: error instanceof Error ? error.message : String(error),
				status: (error as any).response?.status,
				statusText: (error as any).response?.statusText,
				data: (error as any).response?.data,
				requestParams: {
					exchangeSegment:
						this.exchangeSegmentMap[request.exchangeSegment] || "NSECM",
					exchangeInstrumentID: request.exchangeInstrumentID,
					startTime: request.startTime,
					endTime: request.endTime,
					compressionValue: request.compressionValue,
				},
			});
			
			// NOTE: Removed automatic token refresh logic
			// If token is invalid, just throw error - don't auto-refresh
			if ((error as any).response?.status === 400 || (error as any).response?.status === 401) {
				const errorMessage = (error as any).response?.data?.description || (error as any).message || "";
				if (errorMessage.includes("Token") || errorMessage.includes("Invalid") || errorMessage.includes("Unauthorized")) {
					logger.warn("Market data token is invalid. Please use refresh endpoint to get a new token.");
				}
			}

			throw new Error(
				(error as any).response?.data?.description ||
					(error as any).message ||
					"Failed to fetch historical OHLC data",
			);
		}
	}

	/**
	 * Update quote cache from WebSocket data
	 */
	public updateQuoteCache(exchangeInstrumentID: number, quoteData: Record<string, unknown>): void {
		this.quoteCache.set(exchangeInstrumentID, {
			data: quoteData,
			timestamp: new Date(),
		});
	}

	/**
	 * Get cached quote for an instrument
	 */
	public getCachedQuote(exchangeInstrumentID: number): Record<string, unknown> | null {
		const cached = this.quoteCache.get(exchangeInstrumentID);
		if (cached) {
			// Return cached data if it's less than 5 seconds old
			const age = Date.now() - cached.timestamp.getTime();
			if (age < 5000) {
				return cached.data;
			}
		}
		return null;
	}

	/**
	 * Subscribe to instruments via REST API (like working marketdata.js)
	 */
	private async subscribeInstruments(
		instruments: Array<{ exchangeSegment: number; exchangeInstrumentID: number }>,
		xtsMessageCode: number = 1512,
	): Promise<void> {
		try {
			// Validate instruments before subscribing
			if (!instruments || instruments.length === 0) {
				logger.warn("No instruments provided for subscription");
				return;
			}

			// Filter out invalid instruments
			const validInstruments = instruments.filter(inst => 
				inst && 
				typeof inst.exchangeSegment === 'number' && 
				inst.exchangeSegment > 0 &&
				typeof inst.exchangeInstrumentID === 'number' && 
				inst.exchangeInstrumentID > 0
			);

			if (validInstruments.length === 0) {
				logger.warn("No valid instruments after filtering:", { originalCount: instruments.length });
				return;
			}

			if (validInstruments.length !== instruments.length) {
				logger.warn("Some instruments were filtered out:", {
					original: instruments.length,
					valid: validInstruments.length
				});
			}

			let token = await this.getMarketDataToken();
			
			// Validate token before using - if invalid, try to refresh
			if (!token || typeof token !== 'string' || token.trim().length === 0) {
				logger.warn("Invalid or empty token retrieved, attempting to refresh...");
				// Clear token to force refresh
				this.marketDataToken = null;
				token = await this.getMarketDataToken();
				
				// If still invalid after refresh, log and return (don't throw)
				if (!token || typeof token !== 'string' || token.trim().length === 0) {
					logger.error("Failed to get valid token after refresh, skipping subscription");
					return; // Don't throw, just return silently
				}
				logger.info("Token refreshed successfully");
			}

			// Format payload according to XTS API requirements
			const payload = {
				instruments: validInstruments.map(inst => ({
					exchangeSegment: inst.exchangeSegment,
					exchangeInstrumentID: inst.exchangeInstrumentID,
				})),
				xtsMessageCode: xtsMessageCode,
			};

			logger.info("Subscribing to instruments via REST API:", {
				url: "/instruments/subscription",
				instrumentCount: validInstruments.length,
				xtsMessageCode,
				sampleInstrument: validInstruments[0],
				tokenLength: token.length,
				tokenPrefix: token.substring(0, 10) + "...", // Log first 10 chars for debugging
			});

			const response = await this.apiClient.post(
				"/instruments/subscription",
				payload,
				{
					headers: {
						'Content-Type': 'application/json',
						'Authorization': token.trim(), // Ensure no whitespace
					},
				},
			);

			logger.info("Subscription response:", {
				status: response.status,
				data: response.data,
			});
			console.log('✅ [Market Data] Subscribed to instruments:', {
				count: validInstruments.length,
				xtsMessageCode,
				response: response.data,
			});
		} catch (error: any) {
			const errorData = error?.response?.data;
			const errorCode = errorData?.code;
			const errorDescription = errorData?.description;
			const errorStatus = error?.response?.status;
			
			// Log full error details for debugging
			logger.error("Subscription error details:", {
				status: errorStatus,
				code: errorCode,
				description: errorDescription,
				message: error?.message,
				responseData: errorData,
				requestPayload: {
					instrumentCount: instruments?.length,
					sampleInstrument: instruments?.[0],
					xtsMessageCode,
				},
			});
			
			// "Instrument Already Subscribed" is not a real error
			if (errorCode === 'e-session-0002' && errorDescription?.includes('Already Subscribed')) {
				logger.info("Instruments already subscribed", {
					code: errorCode,
					description: errorDescription,
					instruments: instruments,
				});
				console.log('ℹ️ [Market Data] Instruments already subscribed:', errorDescription);
				return; // Don't throw, this is expected
			}
			
			// For 400 errors, check if it's a token issue and refresh if needed
			if (errorStatus === 400) {
				// Check if error is related to token/authorization
				const isTokenError = errorDescription?.toLowerCase().includes('token') || 
					errorDescription?.toLowerCase().includes('authorization') ||
					errorDescription?.toLowerCase().includes('not found');
				
				if (isTokenError) {
					logger.warn("Token error detected in subscription, marking token as invalid", {
						errorDescription,
						errorCode,
					});
					// Mark token as invalidated to prevent reloading from DB
					this.tokenInvalidated = true;
					this.marketDataToken = null;
					console.error('❌ [Market Data] Token error detected, will fetch new token on next call');
				} else {
					logger.warn("Subscription returned 400 - this might be due to invalid instruments or market closed", {
						errorDescription,
						errorCode,
						instrumentCount: instruments?.length,
					});
					console.error('❌ [Market Data] Subscription failed (400):', errorDescription || error?.message);
				}
				// Don't throw for 400 errors - just log and return
				// The system will fall back to REST API quotes
				return;
			}
			
			// For other errors, throw
			console.error('❌ [Market Data] Subscription failed:', error?.message);
			throw error;
		}
	}

	/**
	 * Get live quotes for instruments
	 * Uses WebSocket-based approach (like working marketdata.js):
	 * 1. Subscribe via REST API subscription endpoint
	 * 2. Check cache for recent quotes
	 * 3. If not in cache, wait briefly for WebSocket data
	 */
	public async getLiveQuotes(
		instruments: Array<{
			exchangeSegment: number;
			exchangeInstrumentID: number;
		}>,
	): Promise<Record<string, unknown>[]> {
		// Filter out instruments with invalid IDs
		const validInstruments = instruments.filter(
			(instrument) =>
				instrument.exchangeInstrumentID &&
				instrument.exchangeInstrumentID > 0,
		);

		if (validInstruments.length === 0) {
			logger.warn("No valid instruments provided for live quotes");
			return [];
		}

		logger.info("Getting live quotes:", {
			count: validInstruments.length,
			instruments: validInstruments,
		});

		try {
			// Step 0: Ensure WebSocket is connected (needed to receive quote updates)
			// Import dynamically to avoid circular dependency
			const { default: websocketMarketDataService } = await import('./websocket-market-data.service');
			if (!websocketMarketDataService.isActive()) {
				try {
					await websocketMarketDataService.start();
					logger.info("WebSocket market data service started for live quotes");
				} catch (wsError: any) {
					logger.warn("Failed to start WebSocket service, will rely on REST API:", wsError?.message);
				}
			}

			// Step 1: Subscribe to instruments via REST API (like working marketdata.js)
			// Try LTP (1512) first as it works in the JS file
			// Note: Subscription failures are non-fatal - we can still get quotes from cache or REST API
			try {
				await this.subscribeInstruments(validInstruments, 1512);
			} catch (subError: any) {
				logger.warn("LTP (1512) subscription failed, trying MarketDepth (1502):", subError?.message);
				// Fallback to MarketDepth (1502)
				try {
					await this.subscribeInstruments(validInstruments, 1502);
				} catch (subError2: any) {
					// Log but don't throw - subscription failure is not fatal
					// We can still get quotes from cache or REST API fallback
					logger.warn("Both subscription attempts failed, will use cache/REST fallback:", {
						error1: subError?.message,
						error2: subError2?.message,
					});
				}
			}

			// Step 2: Check cache for recent quotes
			const quotes: Record<string, unknown>[] = [];
			const missingInstruments: number[] = [];

			for (const instrument of validInstruments) {
				const cachedQuote = this.getCachedQuote(instrument.exchangeInstrumentID);
				if (cachedQuote) {
					quotes.push({
						...cachedQuote,
						exchangeSegment: instrument.exchangeSegment,
						exchangeInstrumentID: instrument.exchangeInstrumentID,
					});
				} else {
					missingInstruments.push(instrument.exchangeInstrumentID);
				}
			}

			// Debug logging
			logger.info('Cache check result', {
				requestedCount: validInstruments.length,
				cachedCount: quotes.length,
				missingCount: missingInstruments.length,
				requestedIds: validInstruments.map(i => i.exchangeInstrumentID),
				cachedIds: quotes.map(q => q.exchangeInstrumentID),
				missingIds: missingInstruments,
			});

			// Step 3: Only return from cache if we have ALL quotes
			if (quotes.length === validInstruments.length) {
				console.log(`✅ [Market Data] Returning ${quotes.length} quote(s) from cache`);
				return quotes;
			} else if (quotes.length > 0) {
				// Partial cache - log and continue to WebSocket wait
				logger.warn('Partial cache hit - waiting for remaining quotes', {
					cached: quotes.length,
					total: validInstruments.length,
					missingIds: missingInstruments,
				});
				// Don't return partial cache - continue to WebSocket wait
			}

			// Step 4: If no cache or partial cache, wait briefly for WebSocket data (max 6 seconds)
			console.log('⏳ [Market Data] No cached quotes or partial cache, waiting for WebSocket data...');
			const maxWaitTime = 6000; // 6 seconds
			const checkInterval = 500; // Check every 500ms
			const startTime = Date.now();

			while (Date.now() - startTime < maxWaitTime) {
				// Check cache again for ALL instruments
				const foundQuotes: Record<string, unknown>[] = [];
				for (const instrument of validInstruments) {
					const cachedQuote = this.getCachedQuote(instrument.exchangeInstrumentID);
					if (cachedQuote) {
						foundQuotes.push({
							...cachedQuote,
							exchangeSegment: instrument.exchangeSegment,
							exchangeInstrumentID: instrument.exchangeInstrumentID,
						});
					}
				}

				// Only return if we have ALL quotes
				if (foundQuotes.length === validInstruments.length) {
					console.log(`✅ [Market Data] Received ${foundQuotes.length} quote(s) from WebSocket`);
					return foundQuotes;
				}

				// Wait before next check
				await new Promise(resolve => setTimeout(resolve, checkInterval));
			}

			// Step 5: If still no complete data, try REST API quotes endpoint as last resort
			if (quotes.length < validInstruments.length) {
				console.log('⚠️ [Market Data] Incomplete cache/WebSocket data, trying REST API quotes endpoint as fallback...');
				try {
					const restQuotes = await this.getLiveQuotesViaREST(validInstruments);
					if (restQuotes && restQuotes.length > 0) {
						console.log(`✅ [Market Data] Got ${restQuotes.length} quote(s) from REST API fallback`);
						return restQuotes;
					}
				} catch (restError: any) {
					logger.warn("REST API fallback also failed", {
						error: restError?.message,
						status: restError?.response?.status,
						description: restError?.response?.data?.description,
					});
				}
			}

			// Return whatever quotes we have (even if incomplete) as last resort
			if (quotes.length > 0) {
				logger.warn('Returning partial quotes', {
					returned: quotes.length,
					requested: validInstruments.length,
				});
				return quotes;
			}

			return [];
		} catch (error: unknown) {
			logger.error("Error fetching live quotes:", error);
			console.error("❌ [Market Data] Error details:", {
				status: (error as any).response?.status,
				statusText: (error as any).response?.statusText,
				data: (error as any).response?.data,
				message: (error as any).message,
				url: (error as any).config?.url,
				method: (error as any).config?.method
			});
			
			// NOTE: Removed automatic token refresh logic
			// If token is invalid, just throw error - don't auto-refresh
			if (
				typeof error === "object" &&
				error !== null &&
				"response" in error &&
				(error as any).response?.status !== undefined &&
				((error as any).response.status === 400 || (error as any).response.status === 401)
			) {
				const responseData = (error as any).response?.data || {};
				const errorMessage =
					responseData.description ||
					responseData.message ||
					(error as any).message ||
					"Invalid Token";
				if (
					typeof errorMessage === "string" &&
					(errorMessage.includes("Token") ||
						errorMessage.includes("Invalid") ||
						errorMessage.includes("Unauthorized"))
				) {
					logger.warn("Market data token is invalid. Attempting to refresh token automatically...");
					console.log("⚠️ [Market Data] Token is invalid. Attempting automatic refresh...");
					
					// Try to refresh token automatically
					try {
						const newToken = await this.refreshToken(); // refreshToken() returns the new token
						logger.info("Market data token refreshed successfully, retrying request...");
						console.log("✅ [Market Data] Token refreshed, retrying request...");
						console.log("✅ [Market Data] Using fresh token from refreshToken()");
						
						// Retry MarketDepth (1502)
						const retryPayload1502 = {
							instruments: validInstruments,
							xtsMessageCode: 1502,
							publishFormat: "JSON",
						};
						
						let retryQuotes: Record<string, unknown>[] = [];
						try {
							const retryResponse1502 = await this.apiClient.post(
								"/instruments/quotes",
								retryPayload1502,
								{
									headers: {
										Authorization: newToken,
									},
								},
							);
							
							if (
								retryResponse1502.data &&
								retryResponse1502.data.result &&
								retryResponse1502.data.result.listQuotes
							) {
								retryQuotes = retryResponse1502.data.result.listQuotes;
								if (retryQuotes.length > 0) {
									console.log("✅ [Market Data] Retry successful after token refresh");
									return retryQuotes;
								}
							}
							
							// If MarketDepth still empty, try LTP (1512)
							if (retryQuotes.length === 0) {
								const retryPayload1512 = {
									instruments: validInstruments,
									xtsMessageCode: 1512,
									publishFormat: "JSON",
								};
								
								const retryResponse1512 = await this.apiClient.post(
									"/instruments/quotes",
									retryPayload1512,
									{
										headers: {
											Authorization: newToken,
										},
									},
								);
								
								if (
									retryResponse1512.data &&
									retryResponse1512.data.result &&
									retryResponse1512.data.result.listQuotes
								) {
									const retryQuotes1512 = retryResponse1512.data.result.listQuotes;
									if (retryQuotes1512.length > 0) {
										console.log("✅ [Market Data] Retry with LTP (1512) successful after token refresh");
										return retryQuotes1512;
									}
								}
							}
						} catch (retryError: any) {
							logger.error("Retry failed after token refresh:", retryError);
							console.error("❌ [Market Data] Retry failed after token refresh:", retryError?.message);
						}
					} catch (refreshError: any) {
						logger.error("Failed to refresh market data token automatically:", refreshError);
						console.error("❌ [Market Data] Automatic token refresh failed:", refreshError?.message);
						console.error("❌ [Market Data] Please use /api/market-data/refresh-token endpoint to refresh token manually.");
					}
				}
			}

			throw new Error(
				(error as any).response?.data?.description || (error as any).response?.data?.message || (error as any).message || "Failed to fetch live quotes",
			);
		}
	}

	/**
	 * Get live quotes via REST API (fallback method)
	 * This is the old approach that returns empty arrays
	 */
	private async getLiveQuotesViaREST(
		validInstruments: Array<{
			exchangeSegment: number;
			exchangeInstrumentID: number;
		}>,
	): Promise<Record<string, unknown>[]> {
		try {
			let token = await this.getMarketDataToken();
			
			// Validate and refresh token if needed
			if (!token || typeof token !== 'string' || token.trim().length === 0) {
				logger.warn("Invalid token in REST fallback, attempting refresh...");
				this.marketDataToken = null;
				token = await this.getMarketDataToken();
				
				if (!token || token.trim().length === 0) {
					logger.error("Failed to get valid token for REST API fallback");
					return []; // Return empty instead of throwing
				}
			}

			// Try MarketDepth (1502) first, fallback to LTP (1512) if empty
			let quotes: Record<string, unknown>[] = [];
			
			// First try: MarketDepth (1502)
			const payload1502 = {
				instruments: validInstruments,
				xtsMessageCode: 1502,
				publishFormat: "JSON",
			};

			logger.info("Making REST API call (MarketDepth 1502):", {
				url: "/instruments/quotes",
				payload: payload1502,
			});

			const response1502 = await this.apiClient.post(
				"/instruments/quotes",
				payload1502,
				{
					headers: {
						Authorization: token.trim(), // Ensure no whitespace
					},
				},
			);

			if (
				response1502.data &&
				response1502.data.result &&
				response1502.data.result.listQuotes
			) {
				const rawQuotes = response1502.data.result.listQuotes;
				// Parse JSON strings to objects if needed
				quotes = rawQuotes.map((quote: any) => {
					if (typeof quote === 'string') {
						try {
							return JSON.parse(quote);
						} catch (e) {
							logger.warn("Failed to parse quote string:", e);
							return quote;
						}
					}
					return quote;
				});
				if (quotes.length > 0) {
					logger.info("Live quotes received via REST (1502):", {
						count: quotes.length,
					});
					return quotes;
				}
			}

			// Fallback: Try LTP (1512)
			if (quotes.length === 0) {
				const payload1512 = {
					instruments: validInstruments,
					xtsMessageCode: 1512,
					publishFormat: "JSON",
				};

				const response1512 = await this.apiClient.post(
					"/instruments/quotes",
					payload1512,
					{
						headers: {
							Authorization: token.trim(), // Ensure no whitespace
						},
					},
				);

				if (
					response1512.data &&
					response1512.data.result &&
					response1512.data.result.listQuotes
				) {
					const rawQuotes = response1512.data.result.listQuotes;
					// Parse JSON strings to objects if needed
					quotes = rawQuotes.map((quote: any) => {
						if (typeof quote === 'string') {
							try {
								return JSON.parse(quote);
							} catch (e) {
								logger.warn("Failed to parse quote string:", e);
								return quote;
							}
						}
						return quote;
					});
					if (quotes.length > 0) {
						logger.info("Live quotes received via REST (1512):", {
							count: quotes.length,
						});
						return quotes;
					}
				}
			}

			// If still empty, return empty array
			logger.warn("REST API quotes endpoint returned empty array");
			return [];
		} catch (error: any) {
			const errorStatus = error?.response?.status;
			const errorData = error?.response?.data;
			const errorDescription = errorData?.description || errorData?.message || error?.message;
			
			// Check if it's a token error
			if (errorStatus === 400 && errorDescription?.toLowerCase().includes('token')) {
				logger.warn("Token error detected in REST API fallback, marking token as invalid", {
					errorDescription,
				});
				// Mark token as invalidated to prevent reloading from DB
				this.tokenInvalidated = true;
				this.marketDataToken = null;
				console.error('❌ [Market Data] Token error in REST fallback, will fetch new token on next call');
			}
			
			logger.error("Error in REST API fallback:", error);
			return [];
		}
	}

	/**
	 * Transform raw OHLC data to our format
	 */
	private transformOHLCData(rawData: unknown): CandleData[] {
		// Handle pipe-separated string format from Anand Rathi API
		if (typeof rawData === "string" && rawData.includes("|")) {
			const candleStrings = rawData.split(",");
			return candleStrings
				.map((candleStr) => {
					const parts = candleStr.trim().split("|");
					if (parts.length >= 6) {
						return {
							timestamp: new Date(parseInt(parts[0]) * 1000).toISOString(),
							open: parseFloat(parts[1]) || 0,
							high: parseFloat(parts[2]) || 0,
							low: parseFloat(parts[3]) || 0,
							close: parseFloat(parts[4]) || 0,
							volume: parseFloat(parts[5]) || 0,
							oi: parts[6] ? parseFloat(parts[6]) : undefined,
						};
					}
					return null;
				})
				.filter((candle) => candle !== null);
		}

		// Handle different response formats
		if (Array.isArray(rawData)) {
			return rawData.map((candle) => ({
				timestamp: candle.BarTime
					? new Date(candle.BarTime * 1000).toISOString()
					: candle.timestamp,
				open: parseFloat(candle.Open || candle.open || 0),
				high: parseFloat(candle.High || candle.high || 0),
				low: parseFloat(candle.Low || candle.low || 0),
				close: parseFloat(candle.Close || candle.close || 0),
				volume: parseFloat(candle.BarVolume || candle.volume || 0),
				oi: candle.OpenInterest ? parseFloat(candle.OpenInterest) : undefined,
			}));
		}

		// Handle single candle response
		if (rawData && typeof rawData === "object") {
			const data = rawData as any;
			return [
				{
					timestamp: data.BarTime
						? new Date(data.BarTime * 1000).toISOString()
						: data.timestamp,
					open: parseFloat(data.Open || data.open || 0),
					high: parseFloat(data.High || data.high || 0),
					low: parseFloat(data.Low || data.low || 0),
					close: parseFloat(data.Close || data.close || 0),
					volume: parseFloat(data.BarVolume || data.volume || 0),
					oi: data.OpenInterest ? parseFloat(data.OpenInterest) : undefined,
				},
			];
		}

		return [];
	}

	/**
	 * Get market data token status
	 */
	public getTokenStatus(): MarketDataToken | null {
		return this.marketDataToken;
	}

	/**
	 * Refresh market data token - Force fetch a new token from API
	 */
	public async refreshToken(): Promise<string> {
		this.marketDataToken = null; // Clear existing token from memory
		
		// Also clear from database if system user exists
		if (this.systemUserId) {
			try {
				await User.findByIdAndUpdate(this.systemUserId, {
					$set: {
						'marketDataCredentials.token': '',
						'marketDataCredentials.marketDataTokenEnc': '',
						'marketDataCredentials.isActive': false,
						'marketDataCredentials.expiry': null,
						'marketDataCredentials.marketDataExpiresAt': null,
					},
				});
				logger.info('Cleared market data token from database for refresh');
			} catch (error: unknown) {
				logger.error("Error clearing market data token from database:", error);
			}
		}
		
		// Force fetch a new token from API (don't use cached/database token)
		logger.info("Force fetching new market data token from API...");
		
		const response = await this.apiClient.post("/auth/login", {
			secretKey: this.API_CREDENTIALS.secretKey,
			appKey: this.API_CREDENTIALS.appKey,
			source: this.API_CREDENTIALS.source,
		});

		// Handle both array and object response formats
		const responseData = Array.isArray(response.data)
			? response.data[0]
			: response.data;

		if (responseData && responseData.result && responseData.result.token) {
			const token = responseData.result.token;
			const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

			this.marketDataToken = {
				token,
				expiry,
				lastRefresh: new Date(),
				isActive: true,
			};

			// Save to database
			await this.saveTokenToDatabase(token, expiry);

			logger.info("Market data token refreshed successfully and saved to database");
			console.log('✅ [Market Data] New token fetched from API:', {
				expiry: expiry.toISOString(),
				tokenLength: token.length
			});
			return token;
		}

		throw new Error("Failed to refresh market data token from API");
	}

	/**
	 * Test market data connection
	 */
	public async testConnection(): Promise<boolean> {
		try {
			await this.getMarketDataToken();
			return true;
		} catch (error) {
			logger.error("Market data connection test failed:", error);
			return false;
		}
	}

	/*Date conversion function*/
	private convertDate(dateString: string): string {
		const date = new Date(dateString);
	
		// Options for formatting the date and time
		const options = {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false, // Use 24-hour format
			timeZone: 'Asia/Kolkata' // Specify Indian Standard Time
		  };
		
		  // Create a DateTimeFormat object for the 'en-US' locale and specified options
		  const formatter = new Intl.DateTimeFormat('en-US', options as any);
		
		  // Format the date
		  const formattedDate:any = formatter.format(date);
		  
		  // The output from Intl.DateTimeFormat might be like "Nov 10, 2025, 12:34:56".
		  // Remove commas and colons:
		  return formattedDate.replaceAll(',', '').replaceAll(':','');
	}

	private isExpired(token: string) {
		if(!token)
		  return true;
		try{
		  const decodedToken = jwtDecode(token);
		  const currentTime = Date.now()/1000;
		  if(decodedToken && decodedToken.exp){
			return decodedToken.exp < currentTime;
		  }
		  return true;  
		}catch(e){
		  logger.log('Error decoding dealer token:',e)
		  return true;
		}
	  }
	private isTodaysToken(token:string) {
		if(!this.marketDataToken)
		  return false;
		
		  try {
			const decodedToken = jwtDecode(token);
		
			// The 'iat' claim is typically in seconds since epoch
			const issuedAtTimestampSeconds = decodedToken.iat;
		
			if (!issuedAtTimestampSeconds) {
			  return false; // Token does not have an 'iat' claim
			}
		
			const issuedAtDate = new Date(issuedAtTimestampSeconds * 1000); // Convert to milliseconds
			const currentDate = new Date();
		
			// Compare year, month, and day to check if it's the same day
			const isSameDay =
			  issuedAtDate.getFullYear() === currentDate.getFullYear() &&
			  issuedAtDate.getMonth() === currentDate.getMonth() &&
			  issuedAtDate.getDate() === currentDate.getDate();
			console.log('issued at date',issuedAtDate,'current date',currentDate,'is same day',isSameDay)
			return isSameDay;
		  } catch (error) {
			console.error('Error decoding or checking token:', error);
			return false;
		  }	
		}
}

export default new MarketDataService();
