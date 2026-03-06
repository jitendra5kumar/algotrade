// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import brokerApi from "@/lib/broker-api";
import { useHoldingsWebSocket } from "./useHoldingsWebSocket";

const extractArrayFromPayload = (
	payload: any,
	candidateKeys: string[] = [],
): any[] => {
	if (!payload) return [];
	if (Array.isArray(payload)) return payload;

	for (const key of candidateKeys) {
		const segments = key.split(".");
		let current: any = payload;
		for (const segment of segments) {
			if (current == null) break;
			current = current?.[segment];
		}

		if (Array.isArray(current)) {
			return current;
		}

		if (current && typeof current === "object") {
			const values = Object.values(current);
			if (values.every((value) => typeof value === "object")) {
				return values as any[];
			}
		}
	}

	if (payload?.result) {
		const fromResult = extractArrayFromPayload(
			payload.result,
			candidateKeys,
		);
		if (fromResult.length) return fromResult;
	}

	if (payload?.data) {
		const fromData = extractArrayFromPayload(payload.data, candidateKeys);
		if (fromData.length) return fromData;
	}

	if (typeof payload === "object") {
		for (const value of Object.values(payload)) {
			const nested = extractArrayFromPayload(value, candidateKeys);
			if (nested.length) return nested;
		}
	}

	return [];
};

export default function Holding() {
	const [holdings, setHoldings] = useState<any[]>([]);
	const [loading, setLoading] = useState(typeof window !== "undefined");
	const [error, setError] = useState<any>(null);

	// Extract symbols from holdings for WebSocket subscription
	const holdingsSymbols = useMemo(() => {
		const symbols = holdings.map((h) => h.symbol).filter(Boolean);
		console.log("[Holdings] Symbols for WebSocket subscription:", symbols);
		return symbols;
	}, [holdings]);

	// Get real-time LTP from WebSocket
	const liveData = useHoldingsWebSocket(holdingsSymbols);

	// Debug: Log live data updates
	useEffect(() => {
		if (Object.keys(liveData).length > 0) {
			console.log("[Holdings] Live data received:", liveData);
		}
	}, [liveData]);

	// Check broker status first
	const checkBrokerStatus = useCallback(async () => {
		try {
			const status = await brokerApi.getStatus();
			console.log('[Holdings] Broker status response:', status);
			// brokerApi.getStatus() returns unwrapped data directly
			const isConnected = status?.isConnected === true;
			console.log('[Holdings] Is connected:', isConnected);
			return isConnected;
		} catch (err) {
			console.error("Error checking broker status:", err);
			return false;
		}
	}, []);

	const fetchHoldings = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			
			// Check broker status before fetching
			const isConnected = await checkBrokerStatus();
			if (!isConnected) {
				setError("Broker not connected. Please connect broker first.");
				setLoading(false);
				return;
			}

			const rawHoldings = await brokerApi.getHoldings();
			const holdingsSource = extractArrayFromPayload(rawHoldings, [
				"RMSHoldings.Holdings",
				"Holdings",
				"holdingsList",
			]);

			const holdingsArray = Array.isArray(holdingsSource)
				? holdingsSource
				: Object.values(holdingsSource || {});

		const transformedHoldings = holdingsArray.map((holding: any) => {
			const quantity = parseFloat(holding.Quantity ?? holding.HoldingQuantity) || 0;
			const avgPrice =
				parseFloat(holding.AveragePrice ?? holding.BuyAvgPrice) || 0;
			
			// Don't fall back to avgPrice for LTP - let it be 0 if not available
			// WebSocket will provide live price
			const lastPrice =
				parseFloat(holding.LastTradedPrice ?? holding.LTP) || 0;

			console.log(`[Holdings] Processing ${holding.TradingSymbol}:`, {
				avgPrice,
				lastPrice,
				hasLTP: !!holding.LastTradedPrice || !!holding.LTP,
				willUseLiveData: lastPrice === 0
			});

			return {
				id:
					holding.ExchangeInstrumentId ??
					holding.ExchangeNSEInstrumentId ??
					"N/A",
				symbol: holding.TradingSymbol ?? holding.Symbol ?? "N/A",
				quantity,
				avgPrice,
				ltp: lastPrice, // Will be updated by WebSocket if 0
				investedValue: quantity * avgPrice,
				currentValue: quantity * lastPrice,
				pl: (quantity * (lastPrice - avgPrice)) || 0,
				plPercent:
					avgPrice !== 0 ? ((lastPrice - avgPrice) / avgPrice) * 100 : 0,
				dayChange: parseFloat(holding.DayChange ?? holding.DayGain) || 0,
				originalData: holding,
			};
		});

			setHoldings(transformedHoldings);
		} catch (err) {
			console.error("Error fetching holdings:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to fetch holdings. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, [checkBrokerStatus]);

	// Merge WebSocket live data with holdings data
	const holdingsWithLiveData = useMemo(() => {
		return holdings.map((holding) => {
			const symbol = holding.symbol?.toUpperCase().trim();
			const livePrice = liveData[symbol || ""];
			
			// Priority: WebSocket LTP > API LTP > Show 0 (don't use avgPrice!)
			let currentLTP = 0;
			let isLive = false;
			
			if (livePrice?.lastPrice && livePrice.lastPrice > 0) {
				// WebSocket has live data - use it!
				currentLTP = livePrice.lastPrice;
				isLive = true;
				console.log(`[Holdings] Using WebSocket LTP for ${symbol}:`, currentLTP);
			} else if (holding.ltp > 0) {
				// API provided LTP - use it
				currentLTP = holding.ltp;
				console.log(`[Holdings] Using API LTP for ${symbol}:`, currentLTP);
			} else {
				// No LTP available - use avgPrice as last resort
				currentLTP = holding.avgPrice;
				console.log(`[Holdings] No LTP available for ${symbol}, using avgPrice:`, currentLTP);
			}
			
			return {
				...holding,
				ltp: currentLTP,
				currentValue: holding.quantity * currentLTP,
				pl: (holding.quantity * (currentLTP - holding.avgPrice)) || 0,
				plPercent:
					holding.avgPrice !== 0 ? ((currentLTP - holding.avgPrice) / holding.avgPrice) * 100 : 0,
				// Add live data indicators
				isLive: isLive,
				change: livePrice?.change || 0,
				changePercent: livePrice?.changePercent || 0,
			};
		});
	}, [holdings, liveData]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			fetchHoldings();
		}
	}, [fetchHoldings]);

	// Fetch live market data for holdings if WebSocket doesn't provide it
	useEffect(() => {
		if (holdings.length === 0) return;

		const fetchLiveMarketData = async () => {
			try {
				const symbols = holdings.map(h => h.symbol).filter(Boolean);
				if (symbols.length === 0) return;

				console.log('[Holdings] Fetching live market data for:', symbols);
				
				// Import market data API
				const marketDataApi = (await import('@/lib/market-data-api')).default;
				const liveQuotes = await marketDataApi.getLiveQuotes(symbols);
				
				console.log('[Holdings] Live market data received:', liveQuotes);
				
				// Update holdings with live data
				if (liveQuotes && Object.keys(liveQuotes).length > 0) {
					setHoldings(prevHoldings => 
						prevHoldings.map(holding => {
							const quote = liveQuotes[holding.symbol];
							if (quote?.lastPrice && quote.lastPrice > 0) {
								console.log(`[Holdings] Updating ${holding.symbol} with live price:`, quote.lastPrice);
								return {
									...holding,
									ltp: quote.lastPrice,
									currentValue: holding.quantity * quote.lastPrice,
									pl: (holding.quantity * (quote.lastPrice - holding.avgPrice)) || 0,
									plPercent: holding.avgPrice !== 0 
										? ((quote.lastPrice - holding.avgPrice) / holding.avgPrice) * 100 
										: 0,
								};
							}
							return holding;
						})
					);
				}
			} catch (error) {
				console.error('[Holdings] Error fetching live market data:', error);
				// Don't show error to user, WebSocket will handle it
			}
		};

		// Fetch once on mount, then WebSocket will take over
		const timer = setTimeout(fetchLiveMarketData, 2000);
		
		return () => clearTimeout(timer);
	}, [holdings.length]); // Only re-run if holdings count changes

	const totalInvested = holdingsWithLiveData.reduce(
		(sum, holding) => sum + holding.investedValue,
		0,
	);
	const totalCurrent = holdingsWithLiveData.reduce(
		(sum, holding) => sum + holding.currentValue,
		0,
	);
	const totalPL = totalCurrent - totalInvested;
	const totalPLPercent =
		totalInvested !== 0 ? (totalPL / totalInvested) * 100 : 0;

	if (loading) {
		return (
            <div className="flex items-center justify-center h-56">
				<div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm dark:text-gray-300">Loading holdings...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
            <div className="flex items-center justify-center h-56">
				<div className="text-center">
                    <div className="text-red-500 text-5xl mb-3">⚠️</div>
                    <p className="text-red-600 mb-3 text-sm">{error}</p>
					<button
						type="button"
						onClick={fetchHoldings}
						className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Header with Refresh Button */}
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Holdings</h2>
				<button
					type="button"
					onClick={fetchHoldings}
					className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm"
				>
					<svg
						className="w-3.5 h-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Refresh</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Refresh
				</button>
			</div>

			{/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-3 border-2 border-indigo-200 dark:from-gray-900 dark:to-gray-900 dark:border-indigo-900/50"
				>
					<p className="text-xs text-indigo-600 font-semibold mb-0.5">
						Total Holdings
					</p>
                    <p className="text-xl font-black text-indigo-900 dark:text-indigo-300">
						{holdings.length}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border-2 border-blue-200 dark:from-gray-900 dark:to-gray-900 dark:border-blue-900/50"
				>
					<p className="text-xs text-blue-600 font-semibold mb-0.5">
						Invested Value
					</p>
                    <p className="text-xl font-black text-blue-900 dark:text-blue-300">
						₹{totalInvested.toFixed(2)}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border-2 border-purple-200 dark:from-gray-900 dark:to-gray-900 dark:border-purple-900/50"
				>
					<p className="text-xs text-purple-600 font-semibold mb-0.5">
						Current Value
					</p>
                    <p className="text-xl font-black text-purple-900 dark:text-purple-300">
						₹{totalCurrent.toFixed(2)}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
                    className={`bg-gradient-to-br rounded-xl p-3 border-2 ${
						totalPL >= 0
                            ? "from-green-50 to-green-100 border-green-200 dark:from-gray-900 dark:to-gray-900 dark:border-green-900/50"
                            : "from-red-50 to-red-100 border-red-200 dark:from-gray-900 dark:to-gray-900 dark:border-red-900/50"
					}`}
				>
					<p
						className={`text-xs font-semibold mb-0.5 ${
							totalPL >= 0 ? "text-green-600" : "text-red-600"
						}`}
					>
						Total P&L
					</p>
					<p
                    className={`text-xl font-black ${
                            totalPL >= 0 ? "text-green-900 dark:text-green-300" : "text-red-900 dark:text-red-300"
                        }`}
					>
						₹{totalPL.toFixed(2)}
					</p>
				</motion.div>
			</div>

			{/* Holdings Table - Desktop View */}
            <div className="hidden md:block overflow-x-auto">
				<table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                        <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Symbol
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Quantity
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Avg Price
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								LTP
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Invested
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Current
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								P&L
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								P&L %
							</th>
						</tr>
					</thead>
                    <tbody>
						{holdingsWithLiveData.map((holding, index) => (
							<motion.tr
								key={holding.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
                                className="border-b border-gray-200 hover:bg-gray-50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800"
							>
                                <td className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-gray-100">
									{holding.symbol}
								</td>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 text-right dark:text-gray-100">
									{holding.quantity}
								</td>
                                <td className="px-3 py-3 text-xs font-bold text-gray-900 text-right dark:text-gray-100">
									₹{holding.avgPrice.toFixed(2)}
								</td>
								<td className="px-3 py-3 text-xs font-bold text-gray-900 text-right">
									<div className="flex items-center justify-end gap-1">
										₹{holding.ltp.toFixed(2)}
										{holding.isLive && (
											<span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Live data"></span>
										)}
									</div>
								</td>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 text-right dark:text-gray-100">
									₹{holding.investedValue.toFixed(2)}
								</td>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 text-right dark:text-gray-100">
									₹{holding.currentValue.toFixed(2)}
								</td>
								<td className="px-3 py-3 text-right">
									<span
										className={`text-xs font-bold ${
											holding.pl >= 0 ? "text-green-600" : "text-red-600"
										}`}
									>
										₹{holding.pl.toFixed(2)}
									</span>
								</td>
								<td className="px-3 py-3 text-right">
									<span
										className={`text-xs font-bold ${
											holding.plPercent >= 0 ? "text-green-600" : "text-red-600"
										}`}
									>
										{holding.plPercent.toFixed(2)}%
									</span>
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Holdings Cards - Mobile View */}
            <div className="md:hidden space-y-3">
				{holdingsWithLiveData.map((holding, index) => (
					<motion.div
						key={holding.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 dark:bg-gray-950 dark:border-gray-800"
					>
						<div className="flex items-start justify-between mb-2.5">
							<div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
									{holding.symbol}
								</h3>
                                <p className="text-xs text-gray-500 font-semibold dark:text-gray-400">
									Qty: {holding.quantity}
								</p>
							</div>
							<div className="text-right">
								<div className="flex items-center justify-end gap-1">
									<p className="text-xs font-bold text-gray-900 dark:text-gray-100">
										₹{holding.ltp.toFixed(2)}
									</p>
									{holding.isLive && (
										<span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Live data"></span>
									)}
								</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">LTP</p>
							</div>
						</div>

                        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Avg Price
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{holding.avgPrice.toFixed(2)}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Invested
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{holding.investedValue.toFixed(2)}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Current
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{holding.currentValue.toFixed(2)}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">P&L</p>
								<p
									className={`text-xs font-bold ${
										holding.pl >= 0 ? "text-green-600" : "text-red-600"
									}`}
								>
									₹{holding.pl.toFixed(2)}
								</p>
							</div>
						</div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-gray-800">
							<p className="text-xs text-gray-600 font-medium">
								P&L Percentage
							</p>
							<p
								className={`text-xs font-bold ${
									holding.plPercent >= 0 ? "text-green-600" : "text-red-600"
								}`}
							>
								{holding.plPercent.toFixed(2)}%
							</p>
						</div>
					</motion.div>
				))}
			</div>

            {holdings.length === 0 && !loading && (
				<div className="text-center py-10">
                    <div className="text-gray-400 text-5xl mb-3">📈</div>
                    <p className="text-gray-600 text-base dark:text-gray-300">No holdings found</p>
                    <p className="text-gray-500 text-xs dark:text-gray-400">
						Your holdings will appear here
					</p>
				</div>
			)}
		</div>
	);
}
