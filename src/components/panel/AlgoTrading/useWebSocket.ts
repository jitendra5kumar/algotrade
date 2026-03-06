import { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { Strategy, LiveData } from "./types";
import { getAuthToken, isValidJWT, isTokenExpired } from "@/utils/token-utils";

export function useWebSocket(
	strategies: Strategy[],
	setLiveData: React.Dispatch<React.SetStateAction<LiveData>>,
) {
	const [socketRef, setSocketRef] = useState<Socket | null>(null);
	const symbolsRef = useRef<string>("");
	const tokenRef = useRef<string | null>(null); // Track token changes

	// Extract symbols from strategies (normalize to uppercase for consistency)
	const currentSymbols = strategies
		.map((strategy) => (strategy.symbol || "").toUpperCase().trim())
		.filter(Boolean)
		.sort()
		.join(",");

	// Get current token
	const currentToken = getAuthToken();

	useEffect(() => {
		if (strategies.length === 0) {
			// Clear live data when no strategies
			setLiveData({});
			return;
		}

		// Check if token changed - if so, force reconnection
		const tokenChanged = tokenRef.current !== null && tokenRef.current !== currentToken;
		
		// If token changed, clear live data and disconnect old socket
		if (tokenChanged) {
			console.log("[WebSocket] Token changed, reconnecting with new token...");
			setLiveData({}); // Clear live data for new account
			if (socketRef?.connected) {
				const oldSymbols = symbolsRef.current.split(",").filter(Boolean);
				if (oldSymbols.length > 0) {
					socketRef.emit("unsubscribe:market_data", { symbols: oldSymbols });
				}
				socketRef.disconnect();
				setSocketRef(null);
			}
			tokenRef.current = currentToken;
		}

		// If socket is connected and symbols changed (but token didn't change), re-subscribe
		if (socketRef?.connected && symbolsRef.current !== currentSymbols && !tokenChanged) {
			const symbols = currentSymbols.split(",").filter(Boolean);
			if (symbols.length > 0) {
				socketRef.emit("subscribe:market_data", { symbols });
				symbolsRef.current = currentSymbols;
			}
			return;
		}

		// Only reconnect if symbols actually changed and socket is not connected, OR if token changed
		if (symbolsRef.current === currentSymbols && socketRef?.connected && !tokenChanged) {
			return;
		}

		// Handle comma-separated URLs (take first one)
		const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
		const base = envUrl.includes(',') ? envUrl.split(',')[0].trim() : envUrl.trim();
		
		// Use current token (already fetched above)
		const token = currentToken;

		// Validate token before attempting connection
		if (!token) {
			console.warn("[WebSocket] No valid token found, skipping connection");
			return;
		}

		// Check if token is valid JWT format
		if (!isValidJWT(token)) {
			console.error("[WebSocket] Invalid token format, expected JWT");
			return;
		}

		// Check if token is expired
		if (isTokenExpired(token)) {
			console.warn("[WebSocket] Token expired, skipping connection. Please refresh token.");
			return;
		}

		// Disconnect existing socket if symbols changed
		if (socketRef && socketRef.connected) {
			const oldSymbols = symbolsRef.current.split(",").filter(Boolean);
			if (oldSymbols.length > 0) {
				socketRef.emit("unsubscribe:market_data", { symbols: oldSymbols });
			}
			socketRef.disconnect();
		}

		// Dynamic import for socket.io-client (client-side only)
		if (typeof window === "undefined") {
			return;
		}

		// Async function to handle socket connection
		const setupSocket = async () => {
			try {
				// Dynamic import to avoid SSR issues
				const socketIoClient = await import("socket.io-client");
				const io = socketIoClient.io || socketIoClient.default || socketIoClient;
				
				if (!io || typeof io !== "function") {
					return;
				}

				// Socket.IO v2.2.0 configuration - uses 'query' instead of 'auth'
				// Ensure base URL doesn't have trailing slash and is properly formatted
				const baseUrl = base.replace(/\/$/, ""); // Remove trailing slash
				
				const socket = io(baseUrl, {
					path: "/socket.io",
					query: { token: token.trim() }, // v2 uses 'query' instead of 'auth', trim whitespace
					withCredentials: true,
					transports: ["polling", "websocket"], // Try polling first, then websocket
					reconnection: true,
					reconnectionDelay: 1000,
					reconnectionDelayMax: 5000,
					reconnectionAttempts: 3, // Reduced attempts to avoid spam
					timeout: 20000,
					autoConnect: true,
					forceNew: true, // Force new connection to avoid reuse issues
				});

				if (!socket) return;

				setSocketRef(socket);
				symbolsRef.current = currentSymbols;
				tokenRef.current = token; // Update token reference

				socket.on("connect", () => {
					console.log("[WebSocket] Connected, subscribing to symbols:", currentSymbols);
					const symbols = currentSymbols.split(",").filter(Boolean);
					if (symbols.length > 0) {
						socket.emit("subscribe:market_data", { symbols });
					}
				});
				
				socket.on("subscribed", (data: any) => {
					// Subscription confirmed
				});

				socket.on("market_data", (update: any) => {
					if (!update?.symbol || !update?.data) {
						return;
					}

					// Backend now emits using short symbol directly
					// Normalize symbol to uppercase for consistent matching
					const symbol = update.symbol ? update.symbol.toUpperCase().trim() : null;
					const data = update.data;

					if (!symbol) {
						return;
					}

					const symbolToUse = symbol;

					// Extract price from different event formats
					// 1501 (TouchLine): LastTradedPrice
					// 1502 (MarketDepth): Touchline.LastTradedPrice (already merged in backend)
					// 1512 (LTP): LastTradedPrice
					const lastPrice =
						data.LastTradedPrice ||
						data.lastTradedPrice ||
						data.LTP ||
						data.lastPrice ||
						data.price ||
						(data.Touchline && (data.Touchline.LastTradedPrice || data.Touchline.lastTradedPrice));

					if (lastPrice !== undefined && lastPrice !== null) {
						const change = data.Change || data.change || data.changeValue || 
							(data.Touchline && (data.Touchline.Change || data.Touchline.change)) || 0;
						
						const changePercent =
							data.PercentChange ||
							data.changePercent ||
							data.changePercentage ||
							(data.Touchline && (data.Touchline.PercentChange || data.Touchline.changePercent)) ||
							(lastPrice && change ? (change / (lastPrice - change)) * 100 : 0);
						
						const volume =
							data.TotalTradedQuantity ||
							data.Volume ||
							data.volume ||
							data.TotalVolume ||
							(data.Touchline && (data.Touchline.TotalTradedQuantity || data.Touchline.Volume)) ||
							0;

						setLiveData((prev: LiveData) => {
							return {
								...prev,
								[symbolToUse]: {
									lastPrice: Number(lastPrice),
									change: Number(change || 0),
									changePercent: Number(changePercent || 0),
									volume: Number(volume || 0),
									timestamp: new Date(),
									isMockData: false,
								},
							};
						});
					}
				});

				socket.on("error", (error: any) => {
					console.error("[WebSocket] Socket error:", error);
					// Check if error is authentication related
					if (error?.message?.includes("Authentication") || error?.message?.includes("token")) {
						console.warn("[WebSocket] Authentication error - token may be invalid or expired");
						// Optionally trigger token refresh or logout
						const currentToken = localStorage.getItem("accessToken");
						if (currentToken === token) {
							console.warn("[WebSocket] Token may need refresh");
						}
					}
				});

				socket.on("connect_error", (error: any) => {
					console.error("[WebSocket] Connection error:", {
						message: error?.message,
						type: error?.type,
						description: error?.description,
					});
					
					// Handle 400 Bad Request specifically
					if (error?.message?.includes("400") || error?.type === "TransportError") {
						console.error("[WebSocket] 400 Bad Request - Possible causes:");
						console.error("  1. Invalid or expired token");
						console.error("  2. Token format issue");
						console.error("  3. Server authentication failure");
						
						// Try to refresh token if available
						const refreshToken = localStorage.getItem("refreshToken");
						if (refreshToken) {
							console.log("[WebSocket] Attempting to refresh token...");
							// Note: Token refresh should be handled by auth service
						}
					}

					// Socket.IO will automatically attempt to reconnect
					// But we can add additional handling here if needed
				});

				socket.on("disconnect", (reason: string) => {
					console.log("[WebSocket] Disconnected:", reason);
					
					if (reason === "io server disconnect") {
						// Server disconnected, likely due to authentication failure
						console.warn("[WebSocket] Server disconnected - may need to reconnect with new token");
						// Socket.IO will attempt to reconnect automatically
					} else if (reason === "transport close") {
						console.warn("[WebSocket] Transport closed - network issue");
						// Socket.IO will attempt to reconnect automatically
					} else if (reason === "transport error") {
						console.error("[WebSocket] Transport error - connection problem");
						// Socket.IO will attempt to reconnect automatically
					} else if (reason === "ping timeout") {
						console.warn("[WebSocket] Ping timeout - connection may be slow");
						// Socket.IO will attempt to reconnect automatically
					}
				});

				socket.on("reconnect", (attemptNumber: number) => {
					console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
					// Re-subscribe to market data after reconnection
					if (currentSymbols) {
						const symbols = currentSymbols.split(",").filter(Boolean);
						if (symbols.length > 0) {
							console.log("[WebSocket] Re-subscribing to market data after reconnect");
							socketRef.emit("subscribe:market_data", { symbols });
						}
					}
				});

				socket.on("reconnect_attempt", (attemptNumber: number) => {
					console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
				});

				socket.on("reconnect_error", (error: any) => {
					console.error("[WebSocket] Reconnection error:", error);
				});

				socket.on("reconnect_failed", () => {
					console.error("[WebSocket] Reconnection failed - max attempts reached");
					// Could trigger a manual reconnection or show user notification
				});
			} catch (error) {
				// Fatal error handled silently
			}
		};

		setupSocket();

		return () => {
			if (socketRef && socketRef.connected) {
				try {
					const symbols = currentSymbols.split(",").filter(Boolean);
					if (symbols.length > 0) {
						socketRef.emit("unsubscribe:market_data", { symbols });
					}
					socketRef.disconnect();
				} catch (error) {
					// Error cleaning up socket
				}
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentSymbols, currentToken]); // Depend on both symbols and token to detect account changes

	return socketRef;
}
