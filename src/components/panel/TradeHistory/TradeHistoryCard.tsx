"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Trade } from "./types";

interface TradeHistoryCardProps {
	trade: Trade;
	index: number;
}

export default function TradeHistoryCard({
	trade,
	index,
}: TradeHistoryCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 shadow-lg dark:bg-gray-950 dark:border-gray-800"
		>
			{/* Header Row */}
			<div className="flex items-start justify-between mb-2.5">
				<div>
					<h3 className="text-base font-black text-green-600 dark:text-green-400">
						{trade.symbol}
					</h3>
					<p className="text-xs text-gray-600 font-medium dark:text-gray-400">
						{trade.strategy}
					</p>
				</div>
				<span
					className={`px-2 py-0.5 rounded-full text-xs font-bold ${
						trade.type === "BUY"
							? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
							: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
					}`}
				>
					{trade.type}
				</span>
			</div>

			{/* Details Grid */}
			<div className="grid grid-cols-2 gap-2.5 mb-2.5">
				<div>
					<p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
						Entry Price
					</p>
					<p className="text-xs font-bold text-gray-900 dark:text-gray-100">
						₹{trade.entry}
					</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
						Exit Price
					</p>
					<p className="text-xs font-bold text-gray-900 dark:text-gray-100">
						₹{trade.exit}
					</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
						Quantity
					</p>
					<p className="text-xs font-bold text-gray-900 dark:text-gray-100">
						{trade.qty}
					</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
						Status
					</p>
					<span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold dark:bg-gray-800 dark:text-gray-200">
						{trade.status}
					</span>
				</div>
			</div>

			{/* P&L Section */}
			<div className="pt-2.5 border-t border-gray-200 dark:border-gray-800">
				<div className="mb-2.5">
					<p className="text-xs text-gray-500 font-medium mb-0.5 dark:text-gray-400">
						Profit & Loss
					</p>
					<div className="flex items-center gap-2">
						<span
							className={`text-base font-black flex items-center gap-1 ${
								trade.pnl.startsWith("+")
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}
						>
							{trade.pnl.startsWith("+") ? (
								<TrendingUp size={14} />
							) : (
								<TrendingDown size={14} />
							)}
							{trade.pnl}
						</span>
						<span
							className={`text-xs font-bold ${
								trade.pnlPercent.startsWith("+")
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}
						>
							({trade.pnlPercent})
						</span>
					</div>
				</div>
				{/* Entry and Exit Date/Time */}
				<div className="grid grid-cols-2 gap-3 text-xs">
					<div>
						<p className="text-gray-500 font-medium mb-1 dark:text-gray-400">
							Entry
						</p>
						<p className="text-gray-900 font-bold dark:text-gray-100">
							{trade.entryDate}
						</p>
						<p className="text-gray-600 dark:text-gray-400">
							{trade.entryTime}
						</p>
					</div>
					<div>
						<p className="text-gray-500 font-medium mb-1 dark:text-gray-400">
							Exit
						</p>
						{trade.exitDate && trade.exitTime ? (
							<>
								<p className="text-gray-900 font-bold dark:text-gray-100">
									{trade.exitDate}
								</p>
								<p className="text-gray-600 dark:text-gray-400">
									{trade.exitTime}
								</p>
							</>
						) : (
							<p className="text-gray-400 italic dark:text-gray-500">
								N/A
							</p>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
}

