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

export default function Positions() {
	const [positions, setPositions] = useState<any[]>([]);
	const [loading, setLoading] = useState(typeof window !== "undefined");
	const [error, setError] = useState<any>(null);

	// Check broker status first
	const checkBrokerStatus = useCallback(async () => {
		try {
			const status = await brokerApi.getStatus();
			console.log('[Positions] Broker status response:', status);
			// brokerApi.getStatus() returns unwrapped data directly
			const isConnected = status?.isConnected === true;
			console.log('[Positions] Is connected:', isConnected);
			return isConnected;
		} catch (err) {
			console.error("Error checking broker status:", err);
			return false;
		}
	}, []);

	const fetchPositions = useCallback(async () => {
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

			const rawPositions = await brokerApi.getPositions();
			const positionsSource = extractArrayFromPayload(rawPositions, [
				"positionList",
				"DealerPositionDetails",
				"positions",
			]);
			const positionsData = Array.isArray(positionsSource)
				? positionsSource
				: [];

			// Transform API data to match UI format
			const transformedPositions = positionsData.map((position) => ({
				id: position.ExchangeInstrumentId || "N/A",
				symbol: position.TradingSymbol || "N/A",
				type: parseFloat(position.Quantity) >= 0 ? "LONG" : "SHORT",
				quantity: Math.abs(parseFloat(position.Quantity)) || 0,
				avgPrice: parseFloat(position.BuyAveragePrice) || 0,
				ltp: parseFloat(position.BuyAveragePrice) || 0, // Using avg price as LTP for now
				pl: parseFloat(position.MTM) || 0,
				plPercent: calculatePLPercent(position),
				originalData: position,
			}));

			setPositions(transformedPositions);
		} catch (err) {
			console.error("Error fetching positions:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to fetch positions. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			// Check broker status first, then fetch positions
			checkBrokerStatus().then((isConnected) => {
				if (isConnected) {
					fetchPositions();
				}
			});
		}
	}, [checkBrokerStatus, fetchPositions]);

	const calculatePLPercent = (position) => {
		const buyPrice = parseFloat(position.BuyAveragePrice) || 0;
		const mtm = parseFloat(position.MTM) || 0;
		const quantity = Math.abs(parseFloat(position.Quantity)) || 1;

		if (buyPrice === 0) return 0;

		const investment = buyPrice * quantity;
		return investment !== 0 ? (mtm / investment) * 100 : 0;
	};

	const getTypeColor = (type) => {
		return type === "LONG"
			? "bg-green-100 text-green-700 border-green-300"
			: "bg-red-100 text-red-700 border-red-300";
	};

	const totalPL = positions.reduce((sum, pos) => sum + pos.pl, 0);
	const longPositions = positions.filter((p) => p.type === "LONG").length;
	const shortPositions = positions.filter((p) => p.type === "SHORT").length;

	if (loading) {
		return (
            <div className="flex items-center justify-center h-56">
				<div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm dark:text-gray-300">Loading positions...</p>
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
						onClick={fetchPositions}
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
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Positions</h2>
				<button
					type="button"
					onClick={fetchPositions}
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
						Total Positions
					</p>
                    <p className="text-xl font-black text-indigo-900 dark:text-indigo-300">
						{positions.length}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
                    className={`bg-gradient-to-br rounded-xl p-3 border-2 ${
						totalPL >= 0
                            ? "from-green-50 to-green-100 border-green-200 dark:from-gray-900 dark:to-gray-900 dark:border-green-900/50"
                            : "from-red-50 to-red-100 border-red-200 dark:from-gray-900 dark:to-gray-900 dark:border-red-900/50"
					}`}
				>
					<p
						className={`text-xs font-semibold mb-0.5 ${totalPL >= 0 ? "text-green-600" : "text-red-600"}`}
					>
						Total P&L
					</p>
					<p
                    className={`text-xl font-black ${totalPL >= 0 ? "text-green-900 dark:text-green-300" : "text-red-900 dark:text-red-300"}`}
					>
						₹{totalPL.toFixed(2)}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border-2 border-green-200"
				>
					<p className="text-xs text-green-600 font-semibold mb-0.5">
						Long Positions
					</p>
					<p className="text-xl font-black text-green-900">{longPositions}</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border-2 border-red-200"
				>
					<p className="text-xs text-red-600 font-semibold mb-0.5">
						Short Positions
					</p>
					<p className="text-xl font-black text-red-900">{shortPositions}</p>
				</motion.div>
			</div>

			{/* Positions Table - Desktop View */}
            <div className="hidden md:block overflow-x-auto">
				<table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                        <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Symbol
							</th>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Type
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Qty
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Avg Price
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								LTP
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								P&L
							</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								P&L %
							</th>
                            <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Action
							</th>
						</tr>
					</thead>
                    <tbody>
						{positions.map((position, index) => (
							<motion.tr
								key={position.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
                                className="border-b border-gray-200 hover:bg-gray-50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800"
							>
                                <td className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-gray-100">
									{position.symbol}
								</td>
								<td className="px-3 py-3">
									<span
										className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getTypeColor(
											position.type,
										)}`}
									>
										{position.type}
									</span>
								</td>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 text-right dark:text-gray-100">
									{position.quantity}
								</td>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 text-right dark:text-gray-100">
									₹{position.avgPrice.toFixed(2)}
								</td>
								<td className="px-3 py-3 text-xs font-bold text-gray-900 text-right">
									₹{position.ltp.toFixed(2)}
								</td>
								<td
									className={`px-3 py-3 text-xs font-bold text-right ${
										position.pl >= 0 ? "text-green-600" : "text-red-600"
									}`}
								>
									₹{position.pl.toFixed(2)}
								</td>
								<td
									className={`px-3 py-3 text-xs font-bold text-right ${
										position.plPercent >= 0 ? "text-green-600" : "text-red-600"
									}`}
								>
									{position.plPercent.toFixed(2)}%
								</td>
								<td className="px-3 py-3 text-center">
									<button
										type="button"
										className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
									>
										Exit
									</button>
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

            {positions.length === 0 && !loading && (
				<div className="text-center py-10">
                    <div className="text-gray-400 text-5xl mb-3">📊</div>
                    <p className="text-gray-600 text-base dark:text-gray-300">No positions found</p>
                    <p className="text-gray-500 text-xs dark:text-gray-400">
						Your positions will appear here
					</p>
				</div>
			)}

			{/* Positions Cards - Mobile View */}
			<div className="md:hidden space-y-3">
				{positions.map((position, index) => (
					<motion.div
						key={position.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 dark:bg-gray-950 dark:border-gray-800"
					>
						<div className="flex items-start justify-between mb-2.5">
							<div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
									{position.symbol}
								</h3>
                                <p className="text-xs text-gray-500 font-semibold dark:text-gray-400">
									{position.id}
								</p>
							</div>
							<span
								className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getTypeColor(
									position.type,
								)}`}
							>
								{position.type}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-2.5 mb-2.5">
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Quantity
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									{position.quantity}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Avg Price
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{position.avgPrice.toFixed(2)}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">LTP</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{position.ltp.toFixed(2)}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500 font-medium mb-0.5">P&L</p>
                                <p
									className={`text-xs font-bold ${position.pl >= 0 ? "text-green-600" : "text-red-600"}`}
								>
									₹{position.pl.toFixed(2)} ({position.plPercent.toFixed(2)}%)
								</p>
							</div>
						</div>

						<button
							type="button"
							className="w-full mt-2.5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
						>
							Exit Position
						</button>
					</motion.div>
				))}
			</div>
		</div>
	);
}
