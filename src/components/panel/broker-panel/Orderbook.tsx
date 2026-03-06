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

export default function Orderbook() {
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(typeof window !== "undefined");
	const [error, setError] = useState<any>(null);
	const [brokerConnected, setBrokerConnected] = useState<boolean | null>(null);

	// Check broker status first
	const checkBrokerStatus = useCallback(async () => {
		try {
			const status = await brokerApi.getStatus();
			console.log('[Orderbook] Broker status response:', status);
			// brokerApi.getStatus() returns unwrapped data directly
			const isConnected = status?.isConnected === true;
			console.log('[Orderbook] Is connected:', isConnected);
			setBrokerConnected(isConnected);
			return isConnected;
		} catch (err) {
			console.error("Error checking broker status:", err);
			setBrokerConnected(false);
			return false;
		}
	}, []);

	const fetchOrders = useCallback(async () => {
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

			const rawOrderbook = await brokerApi.getOrderBook();
			const ordersSource = extractArrayFromPayload(rawOrderbook, [
				"DealerOrderBookDetails",
				"orderBookDetails",
				"OrderBookDetails",
				"listOrderDetails",
			]);
			const ordersData = Array.isArray(ordersSource) ? ordersSource : [];

			// Transform API data to match UI format
			const transformedOrders = ordersData.map((order) => ({
				id: order.AppOrderID?.toString() || "N/A",
				symbol: order.TradingSymbol || "N/A",
				type: order.OrderSide || "N/A",
				quantity: order.OrderQuantity || 0,
				price: parseFloat(order.OrderPrice) || 0,
				status: mapOrderStatus(order.OrderStatus),
				time: formatTime(order.OrderGeneratedDateTime),
				originalData: order,
			}));

			setOrders(transformedOrders);
		} catch (err) {
			console.error("Error fetching orders:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to fetch orders. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			// Check broker status first, then fetch orders
			checkBrokerStatus().then((isConnected) => {
				if (isConnected) {
					fetchOrders();
				}
			});
		}
	}, [checkBrokerStatus, fetchOrders]);

	const mapOrderStatus = (status) => {
		switch (status) {
			case "Filled":
				return "EXECUTED";
			case "Rejected":
				return "CANCELLED";
			case "Pending":
			case "New":
				return "PENDING";
			default:
				return status || "PENDING";
		}
	};

	const formatTime = (dateTime) => {
		if (!dateTime || dateTime === "N/A" || dateTime === "") return "N/A";
		try {
			const date = new Date(dateTime);
			// Check if date is valid
			if (isNaN(date.getTime())) {
				return "N/A";
			}
			return date.toLocaleTimeString("en-IN", {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		} catch {
			return "N/A";
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "PENDING":
				return "bg-yellow-100 text-yellow-700 border-yellow-300";
			case "EXECUTED":
				return "bg-green-100 text-green-700 border-green-300";
			case "CANCELLED":
				return "bg-red-100 text-red-700 border-red-300";
			default:
				return "bg-gray-100 text-gray-700 border-gray-300";
		}
	};

	const getTypeColor = (type) => {
		return type === "BUY"
			? "bg-blue-100 text-blue-700 border-blue-300"
			: "bg-orange-100 text-orange-700 border-orange-300";
	};

	if (loading) {
		return (
            <div className="flex items-center justify-center h-56">
				<div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm dark:text-gray-300">Loading orders...</p>
				</div>
			</div>
		);
	}

	if (error) {
		const isBrokerNotConnected = typeof error === 'string' && error.includes("Broker not connected");
		return (
            <div className="flex items-center justify-center h-56">
				<div className="text-center">
                    <div className="text-red-500 text-5xl mb-3">⚠️</div>
                    <p className="text-red-600 mb-3 text-sm">{error}</p>
					{isBrokerNotConnected ? (
						<p className="text-gray-500 text-xs mt-2">
							Please go to Connect Broker page to connect your broker account.
						</p>
					) : (
						<button
							type="button"
							onClick={fetchOrders}
							className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
						>
							Retry
						</button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Header with Refresh Button */}
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Orderbook</h2>
				<button
					type="button"
					onClick={fetchOrders}
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
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border-2 border-blue-200 dark:from-gray-900 dark:to-gray-900 dark:border-blue-900/50"
				>
					<p className="text-xs text-blue-600 font-semibold mb-0.5">
						Total Orders
					</p>
                    <p className="text-xl font-black text-blue-900 dark:text-blue-300">{orders.length}</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border-2 border-green-200 dark:from-gray-900 dark:to-gray-900 dark:border-green-900/50"
				>
					<p className="text-xs text-green-600 font-semibold mb-0.5">Executed</p>
                    <p className="text-xl font-black text-green-900 dark:text-green-300">
						{orders.filter((o) => o.status === "EXECUTED").length}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 border-2 border-yellow-200 dark:from-gray-900 dark:to-gray-900 dark:border-yellow-900/50"
				>
					<p className="text-xs text-yellow-600 font-semibold mb-0.5">Pending</p>
                    <p className="text-xl font-black text-yellow-900 dark:text-yellow-300">
						{orders.filter((o) => o.status === "PENDING").length}
					</p>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border-2 border-red-200 dark:from-gray-900 dark:to-gray-900 dark:border-red-900/50"
				>
					<p className="text-xs text-red-600 font-semibold mb-0.5">Cancelled</p>
                    <p className="text-xl font-black text-red-900 dark:text-red-300">
						{orders.filter((o) => o.status === "CANCELLED").length}
					</p>
				</motion.div>
			</div>

			{/* Orders Table - Desktop View */}
            <div className="hidden md:block overflow-x-auto">
				<table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                        <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Order ID
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
								Price
							</th>
                            <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Status
							</th>
                            <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
								Time
							</th>
						</tr>
					</thead>
                    <tbody>
						{orders.map((order, index) => (
							<motion.tr
								key={order.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05 }}
                                className="border-b border-gray-200 hover:bg-gray-50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800"
							>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 dark:text-gray-100">
									{order.id}
								</td>
                                <td className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-gray-100">
									{order.symbol}
								</td>
								<td className="px-3 py-3">
									<span
										className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getTypeColor(
											order.type,
										)}`}
									>
										{order.type}
									</span>
								</td>
                                <td className="px-3 py-3 text-xs font-semibold text-gray-900 text-right dark:text-gray-100">
									{order.quantity}
								</td>
                                <td className="px-3 py-3 text-xs font-bold text-gray-900 text-right dark:text-gray-100">
									₹{order.price.toFixed(2)}
								</td>
								<td className="px-3 py-3 text-center">
									<span
										className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(
											order.status,
										)}`}
									>
										{order.status}
									</span>
								</td>
                                <td className="px-3 py-3 text-xs font-medium text-gray-600 text-center dark:text-gray-300">
									{order.time}
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

            {orders.length === 0 && !loading && (
				<div className="text-center py-10">
                    <div className="text-gray-400 text-5xl mb-3">📋</div>
                    <p className="text-gray-600 text-base dark:text-gray-300">No orders found</p>
                    <p className="text-gray-500 text-xs dark:text-gray-400">Your orders will appear here</p>
				</div>
			)}

			{/* Orders Cards - Mobile View */}
			<div className="md:hidden space-y-3">
				{orders.map((order, index) => (
					<motion.div
						key={order.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 dark:bg-gray-950 dark:border-gray-800"
					>
						<div className="flex items-start justify-between mb-2.5">
							<div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
									{order.symbol}
								</h3>
                                <p className="text-xs text-gray-500 font-semibold dark:text-gray-400">
									{order.id}
								</p>
							</div>
							<span
								className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getTypeColor(
									order.type,
								)}`}
							>
								{order.type}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-2.5 mb-2.5">
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
									Quantity
								</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									{order.quantity}
								</p>
							</div>
							<div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">Price</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
									₹{order.price.toFixed(2)}
								</p>
							</div>
						</div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-gray-800">
							<span
								className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(
									order.status,
								)}`}
							>
								{order.status}
							</span>
                            <p className="text-xs text-gray-600 font-medium dark:text-gray-300">{order.time}</p>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
