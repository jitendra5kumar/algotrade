"use client";

import { motion } from "framer-motion";
import {
	ArrowDownRight,
	ArrowUpRight,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Filter,
	Search,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getAllTrades } from "@/lib/admin-api";

interface Trade {
	id: string;
	user: string;
	symbol: string;
	type: string;
	quantity: number;
	entryPrice: number;
	exitPrice: number;
	pnl: number;
	entryTime: string;
	exitTime: string;
	strategy: string;
	status: string;
	isOptions: boolean;
	expiry?: string;
	strikePrice?: number;
	optionType?: string;
}

export default function TradeHistory() {
	const [activeTab, setActiveTab] = useState("normal");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [allTrades, setAllTrades] = useState<Trade[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const itemsPerPage = 10;

	// Fetch trades from API
	useEffect(() => {
		const fetchTrades = async () => {
			try {
				setLoading(true);
				setError(null);
				
				// Get all trades for admin
				const response = await getAllTrades({
					page: 1,
					limit: 1000, // Get all trades for client-side filtering
					sortBy: 'createdAt',
					order: 'desc'
				});

				if (response.success && response.data) {
					// Transform API response to match component's expected format
					const transformedTrades = response.data.trades.map(trade => {
						const entryTime = new Date(trade.entryTime);
						const exitTime = trade.exitTime ? new Date(trade.exitTime) : null;
						
						// Format entry and exit times as DD-MM-YYYY HH:MM:SS
						const formatDateTime = (date) => {
							if (!date) return '';
							const year = date.getFullYear();
							const month = String(date.getMonth() + 1).padStart(2, '0');
							const day = String(date.getDate()).padStart(2, '0');
							const hours = String(date.getHours()).padStart(2, '0');
							const minutes = String(date.getMinutes()).padStart(2, '0');
							const seconds = String(date.getSeconds()).padStart(2, '0');
							return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
						};

						// Get user name
						const userName = trade.userId?.name || 'Unknown User';
						
						// Get strategy name
						const strategyName = trade.strategyId?.name || 'N/A';

						// Determine if it's an options trade (contains CE or PE)
						const isOptions = trade.symbol && (trade.symbol.includes(' CE') || trade.symbol.includes(' PE'));

						return {
							id: trade._id,
							user: userName,
							symbol: trade.symbol,
							type: trade.side,
							quantity: trade.entryQuantity,
							entryPrice: trade.entryPrice,
							exitPrice: trade.exitPrice || 0,
							pnl: trade.netProfit || 0,
							entryTime: formatDateTime(entryTime),
							exitTime: formatDateTime(exitTime),
							strategy: strategyName,
							status: trade.status?.toLowerCase() || 'completed',
							isOptions: isOptions,
							// Options specific fields
							expiry: trade.exitTime ? formatDateTime(exitTime).split(' ')[0] : '',
							strikePrice: 0, // Not available in trade model
							optionType: isOptions ? (trade.symbol.includes(' CE') ? 'CE' : 'PE') : ''
						};
					});

					setAllTrades(transformedTrades);
				}
			} catch (err: any) {
				console.error('Error fetching trades:', err);
				setError(err.message || 'Failed to load trades');
			} finally {
				setLoading(false);
			}
		};

		fetchTrades();
	}, []);

	// Separate normal and options trades
	const normalTrades = allTrades.filter(trade => !trade.isOptions);
	const optionsTrades = allTrades.filter(trade => trade.isOptions);

	// Loading state
	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
						<p className="text-gray-600 dark:text-gray-400 font-medium">Loading trades...</p>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="space-y-6">
				<div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
					<p className="text-red-600 font-medium">Error: {error}</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	// Dummy data removed - using real data from API
	// Old dummy data for reference (removed):
	/*
	const normalTradesOld = [
		{
			id: 1,
			user: "Parveen Rana",
			symbol: "RELIANCE",
			type: "BUY",
			quantity: 50,
			entryPrice: 2450.5,
			exitPrice: 2475.8,
			pnl: 1265,
			entryTime: "2024-10-18 09:30:00",
			exitTime: "2024-10-18 14:45:00",
			strategy: "RSI Strategy",
			status: "completed",
		},
		{
			id: 2,
			user: "Rajesh Kumar",
			symbol: "TCS",
			type: "SELL",
			quantity: 30,
			entryPrice: 3680.25,
			exitPrice: 3695.5,
			pnl: -457.5,
			entryTime: "2024-10-18 10:15:00",
			exitTime: "2024-10-18 15:20:00",
			strategy: "MACD Strategy",
			status: "completed",
		},
		{
			id: 3,
			user: "Priya Sharma",
			symbol: "INFY",
			type: "BUY",
			quantity: 100,
			entryPrice: 1450.75,
			exitPrice: 1465.2,
			pnl: 1445,
			entryTime: "2024-10-18 11:00:00",
			exitTime: "2024-10-18 16:00:00",
			strategy: "EMA Crossover",
			status: "completed",
		},
		{
			id: 4,
			user: "Amit Singh",
			symbol: "HDFC",
			type: "BUY",
			quantity: 40,
			entryPrice: 1620.3,
			exitPrice: 1608.75,
			pnl: -462,
			entryTime: "2024-10-17 09:45:00",
			exitTime: "2024-10-17 14:30:00",
			strategy: "Bollinger Bands",
			status: "completed",
		},
		{
			id: 5,
			user: "Neha Gupta",
			symbol: "ICICIBANK",
			type: "SELL",
			quantity: 60,
			entryPrice: 950.8,
			exitPrice: 945.2,
			pnl: 336,
			entryTime: "2024-10-17 10:30:00",
			exitTime: "2024-10-17 15:45:00",
			strategy: "RSI Strategy",
			status: "completed",
		},
		{
			id: 6,
			user: "Vikram Patel",
			symbol: "WIPRO",
			type: "BUY",
			quantity: 80,
			entryPrice: 420.5,
			exitPrice: 428.9,
			pnl: 672,
			entryTime: "2024-10-16 09:15:00",
			exitTime: "2024-10-16 14:00:00",
			strategy: "MACD Strategy",
			status: "completed",
		},
		{
			id: 7,
			user: "Sanjay Reddy",
			symbol: "AXISBANK",
			type: "BUY",
			quantity: 45,
			entryPrice: 1050.25,
			exitPrice: 1045.8,
			pnl: -200.25,
			entryTime: "2024-10-16 11:20:00",
			exitTime: "2024-10-16 15:30:00",
			strategy: "Trend Following",
			status: "completed",
		},
		{
			id: 8,
			user: "Pooja Mehta",
			symbol: "SBIN",
			type: "SELL",
			quantity: 70,
			entryPrice: 625.4,
			exitPrice: 618.9,
			pnl: 455,
			entryTime: "2024-10-15 09:00:00",
			exitTime: "2024-10-15 14:15:00",
			strategy: "RSI Strategy",
			status: "completed",
		},
		{
			id: 9,
			user: "Rahul Sharma",
			symbol: "LT",
			type: "BUY",
			quantity: 25,
			entryPrice: 3420.6,
			exitPrice: 3445.8,
			pnl: 630,
			entryTime: "2024-10-15 10:45:00",
			exitTime: "2024-10-15 15:50:00",
			strategy: "EMA Crossover",
			status: "completed",
		},
		{
			id: 10,
			user: "Kavita Joshi",
			symbol: "MARUTI",
			type: "BUY",
			quantity: 15,
			entryPrice: 10250.75,
			exitPrice: 10180.5,
			pnl: -1053.75,
			entryTime: "2024-10-14 09:30:00",
			exitTime: "2024-10-14 14:45:00",
			strategy: "Bollinger Bands",
			status: "completed",
		},
		{
			id: 11,
			user: "Deepak Kumar",
			symbol: "TATAMOTORS",
			type: "SELL",
			quantity: 90,
			entryPrice: 785.3,
			exitPrice: 778.9,
			pnl: 576,
			entryTime: "2024-10-14 11:00:00",
			exitTime: "2024-10-14 16:00:00",
			strategy: "MACD Strategy",
			status: "completed",
		},
		{
			id: 12,
			user: "Anita Desai",
			symbol: "HCLTECH",
			type: "BUY",
			quantity: 55,
			entryPrice: 1280.4,
			exitPrice: 1295.6,
			pnl: 836,
			entryTime: "2024-10-13 09:20:00",
			exitTime: "2024-10-13 14:30:00",
			strategy: "RSI Strategy",
			status: "completed",
		},
	];
	*/

	const currentTrades = activeTab === "normal" ? normalTrades : optionsTrades;

	// Filter trades based on search
	const filteredTrades = currentTrades.filter(
		(trade) =>
			trade.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
			trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
			trade.strategy.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Pagination
	const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentPageTrades = filteredTrades.slice(startIndex, endIndex);

	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleTabChange = (tab) => {
		setActiveTab(tab);
		setCurrentPage(1); // Reset to first page when changing tabs
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Trade History</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Complete trading history across all users
				</p>
			</div>

			{/* Tabs and Search */}
			<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					{/* Tabs */}
					<div className="flex gap-2">
						<button
							onClick={() => handleTabChange("normal")}
							className={`px-6 py-3 rounded-xl font-semibold transition-all ${
								activeTab === "normal"
									? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
									: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
							}`}
						>
							Normal Trades
						</button>
						<button
							onClick={() => handleTabChange("options")}
							className={`px-6 py-3 rounded-xl font-semibold transition-all ${
								activeTab === "options"
									? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
									: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
							}`}
						>
							Options Trades
						</button>
					</div>

					{/* Search */}
					<div className="relative flex-1 lg:max-w-md">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search by user, symbol, or strategy..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1); // Reset to first page on search
							}}
							className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						/>
					</div>
				</div>

				{/* Stats Summary */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
					<div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
						<p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Trades</p>
						<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							{currentTrades.length}
						</p>
					</div>
					<div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
						<p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Profitable</p>
						<p className="text-2xl font-bold text-green-600">
							{currentTrades.filter((t) => t.pnl > 0).length}
						</p>
					</div>
					<div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
						<p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Loss</p>
						<p className="text-2xl font-bold text-red-600">
							{currentTrades.filter((t) => t.pnl < 0).length}
						</p>
					</div>
					<div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
						<p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total P&L</p>
						<p
							className={`text-2xl font-bold ${
								currentTrades.reduce((sum, t) => sum + t.pnl, 0) >= 0
									? "text-green-600"
									: "text-red-600"
							}`}
						>
							₹{currentTrades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
						</p>
					</div>
				</div>
			</div>

			{/* Trade Table - Desktop */}
			<div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
							<tr>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									User
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Symbol
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Type
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Qty
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Entry
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Exit
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									P&L
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Entry Date & Time
								</th>
								<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
									Exit Date & Time
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
							{currentPageTrades.map((trade) => (
								<motion.tr
									key={trade.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900"
								>
									<td className="px-6 py-4">
										<div>
											<p className="font-semibold text-gray-900 dark:text-gray-100">
												{trade.user}
											</p>
											<p className="text-sm text-gray-500 dark:text-gray-400">{trade.strategy}</p>
										</div>
									</td>
									<td className="px-6 py-4">
										<div>
											<p className="font-semibold text-gray-900 dark:text-gray-100">
												{trade.symbol}
											</p>
											{activeTab === "options" && (
												<p className="text-xs text-gray-500 dark:text-gray-400">
													Strike: {trade.entryPrice} | Expiry: {trade.entryTime}
												</p>
											)}
										</div>
									</td>
									<td className="px-6 py-4">
										<span
											className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
												trade.type === "BUY"
													? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
													: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
											}`}
										>
											{trade.type === "BUY" ? (
												<ArrowUpRight className="w-3 h-3" />
											) : (
												<ArrowDownRight className="w-3 h-3" />
											)}
											{trade.type}
										</span>
									</td>
									<td className="px-6 py-4">
										<p className="font-semibold text-gray-900 dark:text-gray-100">
											{trade.quantity}
										</p>
									</td>
									<td className="px-6 py-4">
										<p className="text-gray-900 dark:text-gray-100">
											₹{trade.entryPrice.toFixed(2)}
										</p>
									</td>
									<td className="px-6 py-4">
										<p className="text-gray-900 dark:text-gray-100">
											₹{trade.exitPrice.toFixed(2)}
										</p>
									</td>
									<td className="px-6 py-4">
										<div
											className={`flex items-center gap-1 font-bold ${
												trade.pnl >= 0 ? "text-green-600" : "text-red-600"
											}`}
										>
											{trade.pnl >= 0 ? (
												<TrendingUp className="w-4 h-4" />
											) : (
												<TrendingDown className="w-4 h-4" />
											)}
											₹{Math.abs(trade.pnl).toFixed(2)}
										</div>
									</td>
									<td className="px-6 py-4">
										<div className="text-sm text-gray-600 dark:text-gray-300">
											<p className="font-medium">{trade.entryTime.split(" ")[0]}</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{trade.entryTime.split(" ")[1]}
											</p>
										</div>
									</td>
									<td className="px-6 py-4">
										<div className="text-sm text-gray-600 dark:text-gray-300">
											{trade.exitTime ? (
												<>
													<p className="font-medium">{trade.exitTime.split(" ")[0]}</p>
													<p className="text-xs text-gray-500 dark:text-gray-400">
														{trade.exitTime.split(" ")[1]}
													</p>
												</>
											) : (
												<p className="text-xs text-gray-400 dark:text-gray-500 italic">
													N/A
												</p>
											)}
										</div>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Trade Cards - Mobile */}
			<div className="lg:hidden space-y-4">
				{currentPageTrades.map((trade) => (
					<motion.div
						key={trade.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
					>
						<div className="flex items-start justify-between mb-4">
							<div>
								<h3 className="font-bold text-gray-900 dark:text-gray-100">{trade.symbol}</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400">{trade.user}</p>
							</div>
							<span
								className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
									trade.type === "BUY"
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-700"
								}`}
							>
								{trade.type}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-4 mb-4">
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Entry Price</p>
								<p className="font-semibold text-gray-900 dark:text-gray-100">
									₹{trade.entryPrice.toFixed(2)}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Exit Price</p>
								<p className="font-semibold text-gray-900 dark:text-gray-100">
									₹{trade.exitPrice.toFixed(2)}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quantity</p>
								<p className="font-semibold text-gray-900 dark:text-gray-100">{trade.quantity}</p>
							</div>
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">P&L</p>
								<p
									className={`font-bold flex items-center gap-1 ${
										trade.pnl >= 0 ? "text-green-600" : "text-red-600"
									}`}
								>
									{trade.pnl >= 0 ? (
										<TrendingUp className="w-4 h-4" />
									) : (
										<TrendingDown className="w-4 h-4" />
									)}
									₹{Math.abs(trade.pnl).toFixed(2)}
								</p>
							</div>
						</div>

						<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
								<Calendar className="w-4 h-4" />
								{trade.entryTime}
							</div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
					<div className="text-sm text-gray-600 dark:text-gray-300">
						Showing {startIndex + 1} to{" "}
						{Math.min(endIndex, filteredTrades.length)} of{" "}
						{filteredTrades.length} trades
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>

						{[...Array(totalPages)].map((_, index) => (
							<button
								type="button"
								key={index + 1}
								onClick={() => handlePageChange(index + 1)}
								className={`px-4 py-2 rounded-lg font-medium transition-all ${
									currentPage === index + 1
										? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
										: "border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
								}`}
							>
								{index + 1}
							</button>
						))}

						<button
							type="button"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
