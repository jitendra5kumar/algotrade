"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { StrategyCardData } from "./types";

interface StrategyCardProps {
	strategy: StrategyCardData;
	index: number;
}

export default function StrategyCard({ strategy, index }: StrategyCardProps) {
	const Icon = strategy.icon;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1 * (index + 1) }}
			whileHover={{ y: -5 }}
			className={`bg-gradient-to-br ${strategy.gradientFrom} ${strategy.gradientTo} border-2 ${strategy.borderColor} rounded-2xl p-4 sm:p-5 lg:p-6 transition-all shadow-lg hover:shadow-xl dark:from-gray-900 dark:to-gray-900 dark:border-gray-800 dark:hover:border-gray-700`}
		>
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
				<div className="flex items-center gap-3">
					<div
						className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${strategy.gradientFrom} ${strategy.gradientTo} rounded-xl flex items-center justify-center shadow-lg`}
					>
						<Icon
							size={20}
							className="text-white sm:w-6 sm:h-6 lg:w-7 lg:h-7"
							strokeWidth={2.5}
						/>
					</div>
					<div>
						<h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
							{strategy.name}
						</h3>
						<p className="text-xs text-gray-600 font-medium dark:text-gray-300">
							{strategy.description}
						</p>
					</div>
				</div>
				<div
					className={`px-2.5 py-1 sm:px-3 sm:py-1.5 ${strategy.badgeColor} text-white text-xs font-bold rounded-full shadow-md`}
				>
					ACTIVE
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:gap-3 mb-5">
				<div
					className={`bg-white/80 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-2.5 lg:p-3 border ${strategy.borderColor} dark:bg-gray-800/60 dark:border-gray-800`}
				>
					<p className="text-[10px] text-gray-600 font-semibold mb-1 dark:text-gray-300">
						Win Rate
					</p>
					<p className={`text-base sm:text-lg lg:text-xl font-black ${strategy.textColor}`}>
						{strategy.winRate}%
					</p>
				</div>
				<div
					className={`bg-white/80 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-2.5 lg:p-3 border ${strategy.borderColor} dark:bg-gray-800/60 dark:border-gray-800`}
				>
					<p className="text-[10px] text-gray-600 font-semibold mb-1 dark:text-gray-300">
						Today P&L
					</p>
					<p className={`text-base sm:text-lg lg:text-xl font-black ${strategy.textColor}`}>
						{strategy.todayPnL}
					</p>
				</div>
				<div
					className={`bg-white/80 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-2.5 lg:p-3 border ${strategy.borderColor} dark:bg-gray-800/60 dark:border-gray-800`}
				>
					<p className="text-[10px] text-gray-600 font-semibold mb-1 dark:text-gray-300">
						Trades
					</p>
					<p className="text-base sm:text-lg lg:text-xl font-black text-gray-900 dark:text-gray-100">
						{strategy.trades}
					</p>
				</div>
			</div>

			{/* Details */}
			<div className="space-y-2 sm:space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-xs sm:text-sm text-gray-600 font-medium dark:text-gray-300">
						Capital Deployed
					</span>
					<span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
						{strategy.capitalDeployed}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-xs sm:text-sm text-gray-600 font-medium dark:text-gray-300">
						Avg. Trade Duration
					</span>
					<span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
						{strategy.avgTradeDuration}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-xs sm:text-sm text-gray-600 font-medium dark:text-gray-300">
						Risk Level
					</span>
					<span
						className={`px-2 sm:px-3 py-1 ${strategy.riskLevelColor} text-xs font-bold rounded-full`}
					>
						{strategy.riskLevel}
					</span>
				</div>
			</div>
		</motion.div>
	);
}

