"use client";

import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import brokerApi from "@/lib/broker-api";

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

export default function Tradebook() {
	const [trades, setTrades] = useState<any[]>([]);
	const [loading, setLoading] = useState(typeof window !== "undefined");
	const [error, setError] = useState<any>(null);

	// Check broker status first
	const checkBrokerStatus = useCallback(async () => {
		try {
			const status = await brokerApi.getStatus();
			console.log('[Tradebook] Broker status response:', status);
			// brokerApi.getStatus() returns unwrapped data directly
			const isConnected = status?.isConnected === true;
			console.log('[Tradebook] Is connected:', isConnected);
			return isConnected;
		} catch (err) {
			console.error("Error checking broker status:", err);
			return false;
		}
	}, []);

	const fetchTrades = useCallback(async () => {
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

			const rawTradebook = await brokerApi.getTradebook();
			const tradeSource = extractArrayFromPayload(rawTradebook, [
				"DealerTradeBookDetails",
				"tradeBookDetails",
				"TradeBookDetails",
				"listTradeDetails",
				"tradeDetails",
			]);
			const tradeData = Array.isArray(tradeSource) ? tradeSource : [];

			const transformedTrades = tradeData.map((trade) => {
				const quantity =
					Math.abs(
						parseFloat(trade.FillQuantity ?? trade.TradeQuantity ?? 0),
					) || 0;
				const buyQty = parseFloat(trade.BuyQuantity ?? trade.BuyQty) || 0;
				const sellQty = parseFloat(trade.SellQuantity ?? trade.SellQty) || 0;
				const price =
					parseFloat(trade.Price ?? trade.TradePrice ?? trade.FillPrice) || 0;
				const side =
					trade.BuyOrSell ??
					trade.OrderSide ??
					(buyQty >= sellQty ? "BUY" : "SELL");

				const profit =
					parseFloat(trade.MTM ?? trade.NetPnl ?? trade.Pnl) ||
					parseFloat(trade.RealizedPNL ?? trade.RealizedPnl) ||
					0;

				return {
					id:
						trade.AppOrderID?.toString() ??
						trade.TradeID?.toString() ??
						trade.ExchangeInstrumentID ??
						"N/A",
					symbol: trade.TradingSymbol ?? trade.Symbol ?? "N/A",
					type: typeof side === "string" ? side.toUpperCase() : "BUY",
					quantity,
					entryPrice:
						parseFloat(trade.AverageTradePrice ?? trade.AveragePrice) ||
						price,
					exitPrice:
						parseFloat(trade.SettlementPrice ?? trade.ClosePrice) || price,
					profit,
					time: formatTime(
						trade.TradeDateTime ??
							trade.TradeTime ??
							trade.OrderGeneratedDateTime,
					),
					date: formatDate(
						trade.TradeDateTime ??
							trade.TradeTime ??
							trade.OrderGeneratedDateTime,
					),
					originalData: trade,
				};
			});

			setTrades(transformedTrades);
		} catch (err) {
			console.error("Error fetching trades:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to fetch trades. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, [checkBrokerStatus]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			// Check broker status first, then fetch trades
			checkBrokerStatus().then((isConnected) => {
				if (isConnected) {
					fetchTrades();
				}
			});
		}
	}, [checkBrokerStatus, fetchTrades]);

	const formatTime = (dateTime) => {
		if (!dateTime) return "N/A";
		try {
			const date = new Date(dateTime);
			return date.toLocaleTimeString("en-IN", {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		} catch {
			return dateTime;
		}
	};

	const formatDate = (dateTime) => {
		if (!dateTime) return "N/A";
		try {
			const date = new Date(dateTime);
			return date.toLocaleDateString("en-IN");
		} catch {
			return dateTime;
		}
	};

	const getTypeColor = (type) => {
		return type === "BUY"
			? "bg-blue-100 text-blue-700 border-blue-300"
			: "bg-orange-100 text-orange-700 border-orange-300";
	};

	const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
	const totalTrades = trades.length;
	const profitableTrades = trades.filter((t) => t.profit > 0).length;
	const losingTrades = trades.filter((t) => t.profit < 0).length;

	if (loading) {
		return (
            <div className="flex items-center justify-center h-56">
				<div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm dark:text-gray-300">Loading trades...</p>
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
						onClick={fetchTrades}
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
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Tradebook</h2>
				<button
					type="button"
					onClick={fetchTrades}
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
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border-2 border-purple-200 dark:from-gray-900 dark:to-gray-900 dark:border-purple-900/50"
				>
					<p className="text-xs text-purple-600 font-semibold mb-0.5">
						Total Trades
					</p>
                    <p className="text-xl font-black text-purple-900 dark:text-purple-300">{totalTrades}</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border-2 border-green-200 dark:from-gray-900 dark:to-gray-900 dark:border-green-900/50"
				>
					<p className="text-xs text-green-600 font-semibold mb-0.5">
						Profitable
					</p>
                    <p className="text-xl font-black text-green-900 dark:text-green-300">
						{profitableTrades}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border-2 border-red-200 dark:from-gray-900 dark:to-gray-900 dark:border-red-900/50"
				>
					<p className="text-xs text-red-600 font-semibold mb-0.5">Loss Trades</p>
                    <p className="text-xl font-black text-red-900 dark:text-red-300">{losingTrades}</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
                    className={`bg-gradient-to-br rounded-xl p-3 border-2 ${
						totalProfit >= 0
                            ? "from-green-50 to-green-100 border-green-200 dark:from-gray-900 dark:to-gray-900 dark:border-green-900/50"
                            : "from-red-50 to-red-100 border-red-200 dark:from-gray-900 dark:to-gray-900 dark:border-red-900/50"
					}`}
				>
					<p
						className={`text-xs font-semibold mb-0.5 ${
							totalProfit >= 0 ? "text-green-600" : "text-red-600"
						}`}
					>
						Total P&L
					</p>
					<p
                    className={`text-xl font-black ${
                            totalProfit >= 0 ? "text-green-900 dark:text-green-300" : "text-red-900 dark:text-red-300"
                        }`}
					>
						₹{totalProfit.toFixed(2)}
					</p>
				</motion.div>
			</div>

			{/* Trades Table - Desktop View */}
            <div className="hidden md:block overflow-x-auto">
				<table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                        <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Trade ID
							</th>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Symbol
							</th>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Type
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Quantity
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Entry Price
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Exit Price
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								P&L
							</th>
                            <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Time
							</th>
						</tr>
					</thead>
                    <tbody>
						{trades.map((trade, index) => (
							<motion.tr
								key={trade.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
                                className="border-b border-gray-200 hover:bg-gray-50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800"
							>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 dark:text-gray-100">
									{trade.id}
								</td>
                                <td className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-gray-100">
									{trade.symbol}
								</td>
								<td className="px-3 py-3">
									<span
										className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getTypeColor(
											trade.type,
										)}`}
									>
										{trade.type}
									</span>
								</td>
								<td className="px-3 py-3 text-xs font-semibold text-gray-900 text-right">
									{trade.quantity}
								</td>
								<td className="px-3 py-3 text-xs font-bold text-gray-900 text-right">
									₹{trade.entryPrice.toFixed(2)}
								</td>
								<td className="px-3 py-3 text-xs font-bold text-gray-900 text-right">
									₹{trade.exitPrice.toFixed(2)}
								</td>
								<td className="px-3 py-3 text-right">
									<span
										className={`text-xs font-bold ${
											trade.profit >= 0 ? "text-green-600" : "text-red-600"
										}`}
									>
										₹{trade.profit.toFixed(2)}
									</span>
								</td>
                                <td className="px-3 py-3 text-xs font-medium text-gray-600 text-center dark:text-gray-300">
									{trade.time}
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Trades Cards - Mobile View */}
			<div className="md:hidden space-y-3">
				{trades.map((trade, index) => (
					<motion.div
						key={trade.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 dark:bg-gray-950 dark:border-gray-800"
					>
						<div className="flex items-start justify-between mb-2.5">
							<div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
									{trade.symbol}
								</h3>
                                <p className="text-xs text-gray-500 font-semibold dark:text-gray-400">
									{trade.id}
								</p>
							</div>
							<span
								className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getTypeColor(
									trade.type,
								)}`}
							>
								{trade.type}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-2.5 mb-2.5">
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Quantity
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									{trade.quantity}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Entry Price
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{trade.entryPrice.toFixed(2)}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Exit Price
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{trade.exitPrice.toFixed(2)}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">P&L</p>
								<p
									className={`text-xs font-bold ${
										trade.profit >= 0 ? "text-green-600" : "text-red-600"
									}`}
								>
									₹{trade.profit.toFixed(2)}
								</p>
							</div>
						</div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-xs text-gray-600 font-medium dark:text-gray-300">{trade.date}</p>
                            <p className="text-xs text-gray-600 font-medium dark:text-gray-300">{trade.time}</p>
						</div>
					</motion.div>
				))}
			</div>

            {trades.length === 0 && !loading && (
                <div className="text-center py-10">
                    <div className="text-gray-400 text-5xl mb-3">📊</div>
                    <p className="text-gray-600 text-base dark:text-gray-300">No trades found</p>
                    <p className="text-gray-500 text-xs dark:text-gray-400">
                        Your trade history will appear here
                    </p>
                </div>
            )}
		</div>
	);
}
