import { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { getAuthToken, isValidJWT, isTokenExpired } from "@/utils/token-utils";

interface LivePriceData {
	lastPrice: number;
	change: number;
	changePercent: number;
	volume: number;
	timestamp: Date;
}

export type HoldingsLiveData = Record<string, LivePriceData>;

/**
 * WebSocket hook for holdings market data
 * Subscribes to real-time price updates for holdings symbols
 */
export function useHoldingsWebSocket(symbols: string[]) {
	const [liveData, setLiveData] = useState<HoldingsLiveData>({});
	const [socketRef, setSocketRef] = useState<Socket | null>(null);
	const symbolsRef = useRef<string>("");
	const tokenRef = useRef<string | null>(null); // Track token changes

	// Normalize and join symbols
	const currentSymbols = symbols
		.map((symbol) => (symbol || "").toUpperCase().trim())
		.filter(Boolean)
		.sort()
		.join(",");

	// Get current token
	const currentToken = getAuthToken();

	useEffect(() => {
		if (symbols.length === 0) {
			// Clean up if no symbols
			setLiveData({});
			if (socketRef?.connected) {
				const oldSymbols = symbolsRef.current.split(",").filter(Boolean);
				if (oldSymbols.length > 0) {
					socketRef.emit("unsubscribe:market_data", { symbols: oldSymbols });
				}
				socketRef.disconnect();
				setSocketRef(null);
			}
			return;
		}

		// Check if token changed - if so, force reconnection
		const tokenChanged = tokenRef.current !== null && tokenRef.current !== currentToken;
		
		// If token changed, clear live data and disconnect old socket
		if (tokenChanged) {
			console.log("[HoldingsWebSocket] Token changed, reconnecting with new token...");
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
			const oldSymbols = symbolsRef.current.split(",").filter(Boolean);
			const newSymbols = currentSymbols.split(",").filter(Boolean);
			
			// Unsubscribe from old symbols
			if (oldSymbols.length > 0) {
				socketRef.emit("unsubscribe:market_data", { symbols: oldSymbols });
			}
			
			// Subscribe to new symbols
			if (newSymbols.length > 0) {
				socketRef.emit("subscribe:market_data", { symbols: newSymbols });
			}
			
			symbolsRef.current = currentSymbols;
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
			console.warn("[HoldingsWebSocket] No valid token found, skipping connection");
			return;
		}

		if (!isValidJWT(token)) {
			console.error("[HoldingsWebSocket] Invalid token format");
			return;
		}

		if (isTokenExpired(token)) {
			console.warn("[HoldingsWebSocket] Token expired, skipping connection");
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

				const baseUrl = base.replace(/\/$/, "");
				
				const socket = io(baseUrl, {
					path: "/socket.io",
					query: { token: token.trim() },
					withCredentials: true,
					transports: ["polling", "websocket"],
					reconnection: true,
					reconnectionDelay: 1000,
					reconnectionDelayMax: 5000,
					reconnectionAttempts: 3,
					timeout: 20000,
					autoConnect: true,
					forceNew: true,
				});

				if (!socket) return;

				setSocketRef(socket);
				symbolsRef.current = currentSymbols;
				tokenRef.current = token; // Update token reference

				socket.on("connect", () => {
					console.log("[HoldingsWebSocket] Connected, subscribing to symbols:", currentSymbols);
					const symbolsToSubscribe = currentSymbols.split(",").filter(Boolean);
					if (symbolsToSubscribe.length > 0) {
						socket.emit("subscribe:market_data", { symbols: symbolsToSubscribe });
						console.log("[HoldingsWebSocket] Subscription request sent for:", symbolsToSubscribe);
					}
				});

				socket.on("subscribed", (data: any) => {
					console.log("[HoldingsWebSocket] Subscription confirmed:", data);
				});

				socket.on("market_data", (update: any) => {
					if (!update?.symbol || !update?.data) {
						console.warn("[HoldingsWebSocket] Invalid market_data update:", update);
						return;
					}

					// Normalize symbol to uppercase for consistent matching
					const symbol = update.symbol ? update.symbol.toUpperCase().trim() : null;
					const data = update.data;

					if (!symbol) {
						console.warn("[HoldingsWebSocket] No symbol in update:", update);
						return;
					}

					console.log("[HoldingsWebSocket] Received market_data for:", symbol, data);

					// Extract price from different event formats
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

						setLiveData((prev: HoldingsLiveData) => {
							return {
								...prev,
								[symbol]: {
									lastPrice: Number(lastPrice),
									change: Number(change || 0),
									changePercent: Number(changePercent || 0),
									volume: Number(volume || 0),
									timestamp: new Date(),
								},
							};
						});
					}
				});

				socket.on("error", (error: any) => {
					console.error("[HoldingsWebSocket] Socket error:", error);
				});

				socket.on("connect_error", (error: any) => {
					console.error("[HoldingsWebSocket] Connection error:", error);
					// Socket.IO will automatically attempt to reconnect
				});

				socket.on("disconnect", (reason: string) => {
					console.log("[HoldingsWebSocket] Disconnected:", reason);
					
					if (reason === "io server disconnect") {
						console.warn("[HoldingsWebSocket] Server disconnected");
					} else if (reason === "transport close" || reason === "transport error") {
						console.warn("[HoldingsWebSocket] Transport issue - will attempt reconnect");
					}
					// Socket.IO will automatically attempt to reconnect
				});

				socket.on("reconnect", (attemptNumber: number) => {
					console.log(`[HoldingsWebSocket] Reconnected after ${attemptNumber} attempts`);
					// Re-subscribe after reconnection
					if (currentSymbols && currentSymbols.length > 0) {
						const symbolsToSubscribe = currentSymbols.split(",").filter(Boolean);
						if (symbolsToSubscribe.length > 0) {
							console.log("[HoldingsWebSocket] Re-subscribing after reconnect");
							socketRef.emit("subscribe:market_data", { symbols: symbolsToSubscribe });
						}
					}
				});

				socket.on("reconnect_attempt", (attemptNumber: number) => {
					console.log(`[HoldingsWebSocket] Reconnection attempt ${attemptNumber}`);
				});

				socket.on("reconnect_error", (error: any) => {
					console.error("[HoldingsWebSocket] Reconnection error:", error);
				});

				socket.on("reconnect_failed", () => {
					console.error("[HoldingsWebSocket] Reconnection failed - max attempts reached");
				});
			} catch (error) {
				console.error("[HoldingsWebSocket] Fatal error:", error);
			}
		};

		setupSocket();

		return () => {
			if (socketRef && socketRef.connected) {
				try {
					const symbolsToUnsubscribe = currentSymbols.split(",").filter(Boolean);
					if (symbolsToUnsubscribe.length > 0) {
						socketRef.emit("unsubscribe:market_data", { symbols: symbolsToUnsubscribe });
					}
					socketRef.disconnect();
				} catch (error) {
					console.error("[HoldingsWebSocket] Error cleaning up socket:", error);
				}
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentSymbols, currentToken]); // Depend on both symbols and token to detect account changes

	return liveData;
}

