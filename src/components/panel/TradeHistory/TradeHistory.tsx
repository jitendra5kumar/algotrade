"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getTrades } from "@/lib/trade-api";
import TradeHistoryHeader from "./TradeHistoryHeader";
import TradeHistoryStats from "./TradeHistoryStats";
import TradeHistoryFilters from "./TradeHistoryFilters";
import TradeHistoryTable from "./TradeHistoryTable";
import TradeHistoryCard from "./TradeHistoryCard";
import TradeHistoryPagination from "./TradeHistoryPagination";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import { Trade, TradeStats } from "./types";

export default function TradeHistory() {
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [allTrades, setAllTrades] = useState<Trade[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"all" | "completed" | "open">("all");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
	const itemsPerPage = 10;

	// Fetch trades from API
	const fetchTrades = async (showToast: boolean = false) => {
		try {
			setLoading(true);
			setError(null);

			const response = await getTrades({
				page: 1,
				limit: 1000,
				sortBy: "createdAt",
				order: "desc",
			});

			if (response.success && response.data) {
				const transformedTrades: Trade[] = response.data.trades.map(
					(trade: any) => {
						const entryTime = new Date(trade.entryTime);
						const exitTime = trade.exitTime
							? new Date(trade.exitTime)
							: null;

						// Format date/time as DD-MM-YYYY HH:MM:SS
						const formatDateTime = (date: Date): { date: string; time: string } => {
							const day = String(date.getDate()).padStart(2, '0');
							const month = String(date.getMonth() + 1).padStart(2, '0');
							const year = date.getFullYear();
							const hours = String(date.getHours()).padStart(2, '0');
							const minutes = String(date.getMinutes()).padStart(2, '0');
							const seconds = String(date.getSeconds()).padStart(2, '0');
							
							return {
								date: `${day}-${month}-${year}`,
								time: `${hours}:${minutes}:${seconds}`,
							};
						};

						const entryDateTime = formatDateTime(entryTime);
						const exitDateTime = exitTime ? formatDateTime(exitTime) : { date: null, time: null };

						// Keep old date/time for backward compatibility (using entry date/time)
						const dateOptions: Intl.DateTimeFormatOptions = {
							day: "numeric",
							month: "short",
							year: "numeric",
						};
						const timeOptions: Intl.DateTimeFormatOptions = {
							hour: "numeric",
							minute: "2-digit",
							hour12: true,
						};
						const date = entryTime.toLocaleDateString("en-IN", dateOptions);
						const time = entryTime.toLocaleTimeString("en-IN", timeOptions);

						const formatPrice = (price: number) => {
							return price
								? price.toLocaleString("en-IN", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})
								: "0.00";
						};

						const pnl = trade.netProfit || 0;
						const pnlFormatted =
							pnl >= 0
								? `+₹${Math.abs(pnl).toLocaleString("en-IN", {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									})}`
								: `-₹${Math.abs(pnl).toLocaleString("en-IN", {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									})}`;

						const pnlPercent = trade.profitPercentage || 0;
						const pnlPercentFormatted =
							pnlPercent >= 0
								? `+${pnlPercent.toFixed(2)}%`
								: `${pnlPercent.toFixed(2)}%`;

						const strategyName = trade.strategyId?.name || "N/A";

						let status = "Completed";
						if (trade.status === "OPEN") status = "Open";
						else if (trade.status === "CLOSED") status = "Completed";
						else if (trade.status === "CANCELLED") status = "Cancelled";
						else if (trade.status === "ERROR") status = "Error";

						return {
							id: trade._id,
							symbol: trade.symbol,
							strategy: strategyName,
							type: trade.side as "BUY" | "SELL",
							entry: formatPrice(trade.entryPrice),
							exit: trade.exitPrice ? formatPrice(trade.exitPrice) : "-",
							qty: trade.entryQuantity,
							pnl: pnlFormatted,
							pnlPercent: pnlPercentFormatted,
							date: date,
							time: time,
							entryDate: entryDateTime.date,
							entryTime: entryDateTime.time,
							exitDate: exitDateTime.date,
							exitTime: exitDateTime.time,
							status: status,
						};
					},
				);

				setAllTrades(transformedTrades);
				setLastRefreshTime(new Date());
				if (showToast) {
					toast.success("Trade history refreshed");
				}
			}
		} catch (err: any) {
			console.error("Error fetching trades:", err);
			setError(err.message || "Failed to load trades");
			if (showToast) {
				toast.error("Failed to refresh trade history");
			}
		} finally {
			setLoading(false);
		}
	};

	// Fetch trades on component mount
	useEffect(() => {
		fetchTrades();
	}, []);

	// Refresh handler
	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await fetchTrades(true); // Pass true to show toast notifications
		} catch (err) {
			// Error is already handled in fetchTrades with toast
		} finally {
			setIsRefreshing(false);
		}
	};

	// Filter trades based on search and tab
	const filteredTrades = allTrades.filter((trade) => {
		const matchesSearch =
			trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
			trade.strategy.toLowerCase().includes(searchTerm.toLowerCase());

		// Tab filter
		let matchesTab = true;
		if (activeTab === "completed") {
			matchesTab =
				trade.status.toLowerCase() === "completed" ||
				trade.status.toLowerCase() === "closed";
		} else if (activeTab === "open") {
			matchesTab = trade.status.toLowerCase() === "open";
		}
		// Default: "all", so matchesTab stays true
		return matchesSearch && matchesTab;
	});

	// Pagination for filtered results
	const filteredTotalPages = Math.ceil(filteredTrades.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentTrades = filteredTrades.slice(startIndex, endIndex);

	// Calculate stats
	const totalPnL = filteredTrades.reduce((sum, trade) => {
		const pnl = parseFloat(trade.pnl.replace(/[₹,+]/g, ""));
		return sum + pnl;
	}, 0);

	const winningTrades = filteredTrades.filter((t) => t.pnl.startsWith("+"))
		.length;

	const winRate =
		filteredTrades.length > 0
			? ((winningTrades / filteredTrades.length) * 100).toFixed(1)
			: "0";

	const stats: TradeStats = {
		totalPnL,
		totalTrades: filteredTrades.length,
		winRate: parseFloat(winRate),
	};

	// Loading state
	if (loading) {
		return <LoadingState />;
	}

	// Error state
	if (error) {
		return (
			<ErrorState
				error={error}
				onRetry={() => window.location.reload()}
			/>
		);
	}

	return (
		<div className="p-4 sm:p-6 lg:p-8">
			<TradeHistoryHeader 
				onRefresh={handleRefresh}
				isRefreshing={isRefreshing}
				lastRefreshTime={lastRefreshTime}
			/>

			<TradeHistoryStats stats={stats} />

			<TradeHistoryFilters
				searchTerm={searchTerm}
				onSearchChange={(value) => {
					setSearchTerm(value);
					setCurrentPage(1);
				}}
			/>

			{/* Tabs for Completed and Open Trades */}
			<div className="mb-3 border-b border-gray-200 dark:border-gray-700">
				<div className="flex space-x-1">
					<button
						type="button"
						onClick={() => {
							setActiveTab("all");
							setCurrentPage(1);
						}}
						className={`px-3 py-1.5 text-xs font-medium transition-colors ${
							activeTab === "all"
								? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
								: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
						}`}
					>
						All Trades ({allTrades.length})
					</button>
					<button
						type="button"
						onClick={() => {
							setActiveTab("completed");
							setCurrentPage(1);
						}}
						className={`px-3 py-1.5 text-xs font-medium transition-colors ${
							activeTab === "completed"
								? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
								: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
						}`}
					>
						Completed (
						{
							allTrades.filter(
								(t) =>
									t.status.toLowerCase() === "completed" ||
									t.status.toLowerCase() === "closed",
							).length
						}
						)
					</button>
					<button
						type="button"
						onClick={() => {
							setActiveTab("open");
							setCurrentPage(1);
						}}
						className={`px-3 py-1.5 text-xs font-medium transition-colors ${
							activeTab === "open"
								? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
								: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
						}`}
					>
						Open (
						{allTrades.filter((t) => t.status.toLowerCase() === "open").length})
					</button>
				</div>
			</div>

			{/* Desktop Table View */}
			<TradeHistoryTable trades={currentTrades} />

			{/* Mobile Card View */}
			<div className="lg:hidden space-y-4">
				{currentTrades.length > 0 ? (
					currentTrades.map((trade, idx) => (
						<TradeHistoryCard key={trade.id} trade={trade} index={idx} />
					))
				) : (
					<div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center dark:bg-gray-950 dark:border-gray-800">
						<p className="text-gray-500 text-sm font-medium dark:text-gray-400">
							No trades found
						</p>
					</div>
				)}
			</div>

			{/* Pagination */}
			<TradeHistoryPagination
				currentPage={currentPage}
				totalPages={filteredTotalPages}
				totalItems={filteredTrades.length}
				itemsPerPage={itemsPerPage}
				startIndex={startIndex}
				endIndex={endIndex}
				onPageChange={setCurrentPage}
			/>
		</div>
	);
}

