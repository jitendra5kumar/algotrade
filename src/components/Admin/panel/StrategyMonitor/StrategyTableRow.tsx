"use client";

import { motion } from "framer-motion";
import {
	Activity,
	BarChart3,
	Pause,
	Play,
	TrendingDown,
	TrendingUp,
	User,
	Zap,
} from "lucide-react";
import { Strategy } from "./types";

interface StrategyTableRowProps {
	strategy: Strategy;
	onToggleStrategy: (strategyId: string, currentStatus: string) => void;
}

export default function StrategyTableRow({
	strategy,
	onToggleStrategy,
}: StrategyTableRowProps) {
	const strategyId = strategy.id || strategy._id || "";
	const isPnlPositive = strategy.pnl >= 0;
	const winRateColor =
		strategy.winRate >= 70
			? "from-emerald-500 to-green-500"
			: strategy.winRate >= 50
				? "from-amber-500 to-yellow-500"
				: "from-red-500 to-orange-500";

	// Get user initials for avatar
	const userInitials = strategy.user
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "US";

	return (
		<motion.tr
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="group border-b border-gray-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent dark:hover:from-emerald-900/10 dark:hover:to-transparent transition-all duration-200 bg-white dark:bg-slate-900"
		>
			{/* Strategy Name & Timeframe */}
			<td className="px-6 py-4">
				<div className="max-w-xs">
					<p className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
						{strategy.name}
					</p>
					<div className="flex items-center gap-1 mt-1">
						<span className="inline-flex px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md">
							{strategy.timeframe || "5m"}
						</span>
					</div>
				</div>
			</td>

			{/* User Info */}
			<td className="px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
						<span className="text-white text-xs font-bold">{userInitials}</span>
					</div>
					<div>
						<p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
							{strategy.user}
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
							{strategy.userEmail || "N/A"}
						</p>
					</div>
				</div>
			</td>

			{/* Symbol */}
			<td className="px-6 py-4">
				<span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-lg border border-blue-200 dark:border-blue-800">
					{strategy.symbol}
				</span>
			</td>

			{/* Type */}
			<td className="px-6 py-4">
				<span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-lg border border-violet-200 dark:border-violet-800">
					<Zap className="w-3 h-3" />
					{strategy.type}
				</span>
			</td>

			{/* PnL */}
			<td className="px-6 py-4">
				<motion.div
					initial={{ scale: 0.9 }}
					animate={{ scale: 1 }}
					className={`inline-flex items-center gap-1.5 font-bold text-sm px-3 py-1.5 rounded-lg ${
						isPnlPositive
							? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
							: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
					}`}
				>
					{isPnlPositive ? (
						<TrendingUp className="w-4 h-4" />
					) : (
						<TrendingDown className="w-4 h-4" />
					)}
					{isPnlPositive ? "+" : "-"}₹{Math.abs(strategy.pnl).toLocaleString()}
				</motion.div>
			</td>

			{/* Total Trades */}
			<td className="px-6 py-4">
				<div className="flex items-center gap-2">
					<div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
						<BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
					</div>
					<span className="font-bold text-gray-900 dark:text-gray-100">
						{strategy.totalTrades}
					</span>
				</div>
			</td>

			{/* Win Rate */}
			<td className="px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="flex-1 max-w-[80px]">
						<div className="relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${strategy.winRate}%` }}
								transition={{ duration: 0.8, ease: "easeOut" }}
								className={`h-full bg-gradient-to-r ${winRateColor} shadow-lg rounded-full`}
							></motion.div>
						</div>
					</div>
					<span className="font-bold text-gray-900 dark:text-gray-100 text-sm min-w-[40px]">
						{strategy.winRate}%
					</span>
				</div>
			</td>

			{/* Last Signal */}
			<td className="px-6 py-4">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
						<Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
					</div>
					<span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
						{strategy.lastSignal}
					</span>
				</div>
			</td>

			{/* Status */}
			<td className="px-6 py-4">
				<motion.span
					initial={{ scale: 0.9 }}
					animate={{ scale: 1 }}
					className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
						strategy.status === "active"
							? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
							: strategy.status === "paused"
								? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
								: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
					}`}
				>
					<motion.div
						className={`w-2.5 h-2.5 rounded-full ${
							strategy.status === "active"
								? "bg-emerald-500"
								: strategy.status === "paused"
									? "bg-amber-500"
									: "bg-slate-500"
						}`}
						animate={strategy.status === "active" ? { scale: [1, 1.2, 1] } : {}}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>
					<span className="capitalize">{strategy.status}</span>
				</motion.span>
			</td>

			{/* Toggle Button */}
			<td className="px-6 py-4">
				<motion.button
					type="button"
					whileHover={{ scale: 1.08 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => onToggleStrategy(strategyId, strategy.status)}
					className={`p-2.5 rounded-lg transition-all font-semibold shadow-sm hover:shadow-md ${
						strategy.status === "active"
							? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700"
							: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
					}`}
					title={
						strategy.status === "active"
							? "Pause Strategy"
							: "Start Strategy"
					}
				>
					{strategy.status === "active" ? (
						<Pause className="w-4 h-4" />
					) : (
						<Play className="w-4 h-4" />
					)}
				</motion.button>
			</td>
		</motion.tr>
	);
}