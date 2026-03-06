"use client";

import { motion } from "framer-motion";
import {
	Activity,
	Pause,
	Play,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { Strategy } from "./types";

interface StrategyCardProps {
	strategy: Strategy;
	onToggleStrategy: (strategyId: string, currentStatus: string) => void;
}

export default function StrategyCard({
	strategy,
	onToggleStrategy,
}: StrategyCardProps) {
	const strategyId = strategy.id || strategy._id || "";

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800"
		>
			{/* Header */}
			<div className="flex items-start justify-between mb-4">
				<div className="flex-1">
					<h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
						{strategy.name}
					</h3>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						by {strategy.user}
					</p>
				</div>
				<button
					type="button"
					onClick={() => onToggleStrategy(strategyId, strategy.status)}
					className={`p-2 rounded-lg transition-colors ${
						strategy.status === "active"
							? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
							: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
					}`}
				>
					{strategy.status === "active" ? (
						<Pause className="w-5 h-5" />
					) : (
						<Play className="w-5 h-5" />
					)}
				</button>
			</div>

			{/* Details */}
			<div className="grid grid-cols-2 gap-4 mb-4">
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Symbol</p>
					<p className="font-semibold text-gray-900 dark:text-gray-100">
						{strategy.symbol}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type</p>
					<span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
						{strategy.type}
					</span>
				</div>
			</div>

			{/* Performance */}
			<div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
				<div className="text-center">
					<div
						className={`flex items-center justify-center gap-1 mb-1 ${
							strategy.pnl >= 0
								? "text-green-600 dark:text-green-400"
								: "text-red-600 dark:text-red-400"
						}`}
					>
						{strategy.pnl >= 0 ? (
							<TrendingUp className="w-4 h-4" />
						) : (
							<TrendingDown className="w-4 h-4" />
						)}
						<span className="font-bold">
							₹{Math.abs(strategy.pnl).toLocaleString()}
						</span>
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400">P&L</p>
				</div>
				<div className="text-center">
					<p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
						{strategy.totalTrades}
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">Trades</p>
				</div>
				<div className="text-center">
					<p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
						{strategy.winRate}%
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">Win Rate</p>
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-2">
					<Activity className="w-4 h-4 text-gray-400 dark:text-gray-500" />
					<span className="text-sm text-gray-600 dark:text-gray-300">
						Last: {strategy.lastSignal}
					</span>
				</div>
				<span
					className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
						strategy.status === "active"
							? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
							: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
					}`}
				>
					<div
						className={`w-2 h-2 rounded-full ${
							strategy.status === "active"
								? "bg-green-500 animate-pulse"
								: "bg-gray-500"
						}`}
					></div>
					{strategy.status}
				</span>
			</div>
		</motion.div>
	);
}

