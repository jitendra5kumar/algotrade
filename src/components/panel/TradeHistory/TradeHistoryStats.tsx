"use client";

import { motion } from "framer-motion";
import { TradeStats } from "./types";

interface TradeHistoryStatsProps {
	stats: TradeStats;
}

export default function TradeHistoryStats({ stats }: TradeHistoryStatsProps) {
	return (
		<div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 dark:bg-gray-950 dark:border-gray-800"
			>
				<p className="text-xs text-gray-600 font-medium mb-0.5 dark:text-gray-300">
					Total P&L
				</p>
				<p
					className={`text-xl font-black ${
						stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
					}`}
				>
					{stats.totalPnL >= 0 ? "+" : ""}₹
					{Math.abs(stats.totalPnL).toLocaleString("en-IN")}
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 dark:bg-gray-950 dark:border-gray-800"
			>
				<p className="text-xs text-gray-600 font-medium mb-0.5 dark:text-gray-300">
					Total Trades
				</p>
				<p className="text-xl font-black text-gray-900 dark:text-gray-100">
					{stats.totalTrades}
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 dark:bg-gray-950 dark:border-gray-800"
			>
				<p className="text-xs text-gray-600 font-medium mb-0.5 dark:text-gray-300">
					Win Rate
				</p>
				<p className="text-xl font-black text-green-600">{stats.winRate}%</p>
			</motion.div>
		</div>
	);
}

