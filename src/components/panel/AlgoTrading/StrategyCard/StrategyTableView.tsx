"use client";

import { motion } from "framer-motion";
import {
	Edit,
	List,
	Pause,
	Play,
	TrendingDown,
	TrendingUp,
	Trash2,
	Zap,
} from "lucide-react";
import { Strategy, LiveData } from "../types";

interface StrategyTableViewProps {
	strategy: Strategy;
	index: number;
	liveData: LiveData;
	onToggle: (strategy: Strategy) => void;
	onEdit: (strategy: Strategy) => void;
	onDelete: (id: string) => void;
	onLogsClick: (strategyId: string, name?: string) => void;
}

export default function StrategyTableView({
	strategy,
	index,
	liveData,
	onToggle,
	onEdit,
	onDelete,
	onLogsClick,
}: StrategyTableViewProps) {
	const strategyId = strategy._id || strategy.id || "";
	const symbol = (strategy.symbol || "").toUpperCase().trim();
	const livePrice = liveData[symbol];
	const isActive = strategy.status === "ACTIVE";
	const isPaused = strategy.status === "PAUSED";

	return (
		<motion.tr
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: index * 0.05 }}
			className="group border-b border-gray-200 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200"
		>
			{/* Strategy Name */}
			<td className="px-4 py-3">
				<div className="flex items-center gap-2.5">
					<div
						className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0 ${
							isActive
								? "from-emerald-500 to-green-600"
								: isPaused
									? "from-amber-500 to-orange-600"
									: "from-slate-400 to-slate-600"
						}`}
					>
						{isActive ? (
							<Zap size={14} className="text-white" />
						) : (
							<TrendingUp size={14} className="text-white" />
						)}
					</div>
					<div className="min-w-0">
						<p className="font-bold text-gray-900 dark:text-gray-100 truncate text-xs">
							{strategy.name ||
								(strategy.selectedIndicators &&
								strategy.selectedIndicators.length > 0
									? `${strategy.selectedIndicators
											.map((ind) => ind.toUpperCase())
											.join(" + ")} Strategy`
									: "Custom Strategy")}
						</p>
						<div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
							<span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-bold">
								{symbol}
							</span>
							{livePrice ? (
								<div className="flex items-center gap-1.5">
									<motion.div
										className="flex items-center gap-1"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
									>
										<motion.div
											className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
											animate={{
												scale: [1, 1.3, 1],
												opacity: [1, 0.6, 1],
											}}
											transition={{
												duration: 2,
												repeat: Infinity,
												ease: "easeInOut",
											}}
										/>
										<span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
											Live
										</span>
									</motion.div>
									<span
										className={`font-bold ${
											livePrice.change >= 0
												? "text-emerald-600 dark:text-emerald-400"
												: "text-red-600 dark:text-red-400"
										}`}
									>
										₹{livePrice.lastPrice.toFixed(2)}
									</span>
									<span
										className={`text-[10px] ${
											livePrice.change >= 0
												? "text-emerald-600 dark:text-emerald-400"
												: "text-red-600 dark:text-red-400"
										}`}
									>
										({livePrice.change >= 0 ? "+" : ""}
										{livePrice.changePercent.toFixed(2)}%)
									</span>
								</div>
							) : (
								<span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
									Waiting...
								</span>
							)}
						</div>
					</div>
				</div>
			</td>

			{/* Current Trend */}
			<td className="px-4 py-3">
				{isActive && strategy.currentPosition && strategy.currentPosition.side ? (
					<div className="flex flex-col gap-0.5">
						<div className={`flex items-center gap-1 font-bold text-xs ${strategy.currentPosition.side === "BUY" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
							{strategy.currentPosition.side === "BUY" ? (
								<TrendingUp size={12} />
							) : (
								<TrendingDown size={12} />
							)}
							{strategy.currentPosition.side === "BUY" ? "Bullish" : "Bearish"}
						</div>
						{strategy.currentPosition.entryTime && (
							<div className="text-xs text-gray-500 dark:text-gray-400">
								{new Date(strategy.currentPosition.entryTime).toLocaleString('en-IN', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
									hour12: false
								})}
							</div>
						)}
					</div>
				) : (
					<span className="text-xs text-gray-400 dark:text-gray-500">-</span>
				)}
			</td>

			{/* Stoploss */}
			<td className="px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400">
				{strategy.stoplossEnabled ? `${strategy.stoploss}` : "-"}
			</td>

			{/* Target */}
			<td className="px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
				{strategy.targetEnabled ? `${strategy.target}` : "-"}
			</td>

			{/* Product */}
			<td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
				{strategy.productType}
			</td>

			{/* Order */}
			<td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
				{strategy.orderType}
			</td>

			{/* Quantity */}
			<td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-gray-100">
				{strategy.qty}
			</td>

			{/* Status */}
			<td className="px-4 py-3">
				<motion.span
					className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
						isActive
							? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
							: isPaused
								? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
								: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
					}`}
				>
					<motion.div
						className={`w-2 h-2 rounded-full ${
							isActive
								? "bg-emerald-500"
								: isPaused
									? "bg-amber-500"
									: "bg-slate-500"
						}`}
						animate={isActive ? { scale: [1, 1.3, 1] } : {}}
						transition={{ duration: 2, repeat: Infinity }}
					/>
					{isActive ? "Active" : isPaused ? "Paused" : "Inactive"}
				</motion.span>
			</td>

			{/* Actions */}
			<td className="px-4 py-3">
				<div className="flex items-center justify-center gap-1.5">
					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => onToggle(strategy)}
						className={`p-1.5 rounded-lg transition-all ${
							isActive
								? "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300"
								: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300"
						}`}
					>
						{isActive ? (
							<Pause size={12} />
						) : (
							<Play size={12} />
						)}
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => onLogsClick(strategyId, strategy.name)}
						className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
					>
						<List size={12} />
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => onEdit(strategy)}
						className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-all dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300"
					>
						<Edit size={12} />
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => onDelete(strategyId)}
						className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-all dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
					>
						<Trash2 size={12} />
					</motion.button>
				</div>
			</td>
		</motion.tr>
	);
}

