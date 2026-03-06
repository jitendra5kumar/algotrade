"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface TradeHistoryHeaderProps {
	onRefresh?: () => void;
	isRefreshing?: boolean;
	lastRefreshTime?: Date | null;
}

export default function TradeHistoryHeader({ 
	onRefresh, 
	isRefreshing = false, 
	lastRefreshTime 
}: TradeHistoryHeaderProps) {
	return (
		<div className="mb-5 lg:mb-6 flex items-center justify-between">
			<div>
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1.5 dark:text-gray-100">
					Trade History
				</h1>
				<p className="text-xs lg:text-sm text-gray-600 font-medium dark:text-gray-300">
					Track all your automated trades
				</p>
			</div>
			<div className="flex items-center gap-3">
				{lastRefreshTime && (
					<span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
						Last refresh: {lastRefreshTime.toLocaleTimeString('en-IN', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})}
					</span>
				)}
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={onRefresh}
					disabled={isRefreshing}
					className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
					title="Refresh trade history"
				>
					<RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
					<span className="hidden sm:inline">Refresh</span>
				</motion.button>
			</div>
		</div>
	);
}

