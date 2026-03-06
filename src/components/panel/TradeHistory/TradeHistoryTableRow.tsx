"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Trade } from "./types";

interface TradeHistoryTableRowProps {
	trade: Trade;
	index: number;
}

export default function TradeHistoryTableRow({
	trade,
	index,
}: TradeHistoryTableRowProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.05 }}
			className="px-4 py-3 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-950"
		>
			<div className="grid grid-cols-12 gap-3 items-center text-xs">
				{/* Symbol */}
				<div className="col-span-1">
					<span className="font-bold text-green-600 dark:text-green-400">
						{trade.symbol}
					</span>
				</div>

				{/* Strategy */}
				<div className="col-span-1">
					<span className="text-gray-700 font-medium dark:text-gray-300">
						{trade.strategy}
					</span>
				</div>

				{/* Type */}
				<div className="col-span-1">
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

				{/* Entry */}
				<div className="col-span-1">
					<span className="text-gray-900 font-semibold dark:text-gray-100">
						₹{trade.entry}
					</span>
				</div>

				{/* Exit */}
				<div className="col-span-1">
					<span className="text-gray-900 font-semibold dark:text-gray-100">
						₹{trade.exit}
					</span>
				</div>

				{/* Quantity */}
				<div className="col-span-1">
					<span className="text-gray-700 dark:text-gray-300">{trade.qty}</span>
				</div>

				{/* P&L */}
				<div className="col-span-1">
					<span
						className={`font-bold flex items-center gap-1 ${
							trade.pnl.startsWith("+")
								? "text-green-600 dark:text-green-400"
								: "text-red-600 dark:text-red-400"
						}`}
					>
						{trade.pnl.startsWith("+") ? (
							<TrendingUp size={12} />
						) : (
							<TrendingDown size={12} />
						)}
						{trade.pnl}
					</span>
				</div>

				{/* P&L % */}
				<div className="col-span-1">
					<span
						className={`font-bold ${
							trade.pnlPercent.startsWith("+")
								? "text-green-600 dark:text-green-400"
								: "text-red-600 dark:text-red-400"
						}`}
					>
						{trade.pnlPercent}
					</span>
				</div>

				{/* Entry Date & Time */}
				<div className="col-span-2">
					<div className="flex flex-col">
						<span className="text-gray-900 font-medium dark:text-gray-100 text-xs">
							{trade.entryDate}
						</span>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							{trade.entryTime}
						</span>
					</div>
				</div>

				{/* Exit Date & Time */}
				<div className="col-span-2">
					<div className="flex flex-col">
						{trade.exitDate && trade.exitTime ? (
							<>
								<span className="text-gray-900 font-medium dark:text-gray-100 text-xs">
									{trade.exitDate}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									{trade.exitTime}
								</span>
							</>
						) : (
							<span className="text-xs text-gray-400 dark:text-gray-500 italic">
								N/A
							</span>
						)}
					</div>
				</div>

				{/* Status */}
				<div className="col-span-1">
					<span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold dark:bg-gray-800 dark:text-gray-300">
						{trade.status}
					</span>
				</div>
			</div>
		</motion.div>
	);
}

