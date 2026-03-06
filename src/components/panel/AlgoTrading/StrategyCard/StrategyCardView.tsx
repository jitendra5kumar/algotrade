"use client";

import { motion } from "framer-motion";
import {
	Edit,
	List,
	Pause,
	Play,
	Square,
	TrendingDown,
	TrendingUp,
	Trash2,
	Zap,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Strategy, LiveData } from "../types";

interface StrategyCardViewProps {
	strategy: Strategy;
	index: number;
	liveData: LiveData;
	onToggle: (strategy: Strategy) => void;
	onEdit: (strategy: Strategy) => void;
	onDelete: (id: string) => void;
	onLogsClick: (strategyId: string, name?: string) => void;
	onStop?: (strategy: Strategy) => void;
}

export default function StrategyCardView({
	strategy,
	index,
	liveData,
	onToggle,
	onEdit,
	onDelete,
	onLogsClick,
	onStop,
}: StrategyCardViewProps) {
	const strategyId = strategy._id || strategy.id || "";
	const symbol = (strategy.symbol || "").toUpperCase().trim();
	const livePrice = liveData[symbol];
	const isActive = strategy.status === "ACTIVE";
	const isPaused = strategy.status === "PAUSED";
	
	// Track previous price for comparison
	const previousPriceRef = useRef<number | null>(null);
	const [priceDirection, setPriceDirection] = useState<number>(0); // 1 for up, -1 for down, 0 for same
	
	useEffect(() => {
		if (livePrice?.lastPrice !== undefined) {
			const currentPrice = livePrice.lastPrice;
			if (previousPriceRef.current !== null && previousPriceRef.current !== currentPrice) {
				// Price changed - determine direction
				if (currentPrice > previousPriceRef.current) {
					setPriceDirection(1); // Up
				} else if (currentPrice < previousPriceRef.current) {
					setPriceDirection(-1); // Down
				}
			}
			previousPriceRef.current = currentPrice;
		}
	}, [livePrice?.lastPrice]);

	const statusColors = {
		active: "from-emerald-500 to-green-600",
		paused: "from-amber-500 to-orange-600",
		inactive: "from-slate-400 to-slate-600",
	};

	const currentStatus = isActive ? "active" : isPaused ? "paused" : "inactive";

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			whileHover={{ y: -8, transition: { duration: 0.2 } }}
			className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-600"
		>
			{/* Status Indicator Bar */}
			<div
				className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
					currentStatus === "active"
						? statusColors.active
						: currentStatus === "paused"
							? statusColors.paused
							: statusColors.inactive
				}`}
			/>

			{/* Background Accent */}
			<div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-300" />

			<div className="p-5 relative z-10">
				{/* Header Section */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex-1 flex gap-3">
						{/* Status Icon */}
						<motion.div
							whileHover={{ rotate: 12, scale: 1.1 }}
							className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br ${
								currentStatus === "active"
									? statusColors.active
									: currentStatus === "paused"
										? statusColors.paused
										: statusColors.inactive
							} flex-shrink-0`}
						>
							{isActive ? (
								<Zap size={20} className="text-white" />
							) : (
								<TrendingUp size={20} className="text-white" />
							)}
						</motion.div>

						{/* Title & Symbol */}
						<div className="flex-1 min-w-0">
							{/* Symbol Badge - Top */}
							<div className="mb-1.5">
								<span className="inline-flex items-center px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-bold text-xs">
									{symbol}
								</span>
							</div>
							<h3 className="text-base font-black text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
								{strategy.name ||
									(strategy.selectedIndicators &&
									strategy.selectedIndicators.length > 0
										? `${strategy.selectedIndicators
												.map((ind) => ind.toUpperCase())
												.join(" + ")} Strategy`
										: "Custom Strategy")}
							</h3>
							{!livePrice && (
								<span className="text-xs text-gray-400 dark:text-gray-500 italic mt-0.5 block">
									Waiting for price...
								</span>
							)}
						</div>
					</div>

					{/* Status Badge & Live Price - Right Side */}
					<div className="flex flex-col items-end gap-2">
						{/* Status Badge */}
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-md ${
								isActive
									? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
									: isPaused
										? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
										: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
							}`}
						>
							<motion.div
								className={`w-2.5 h-2.5 rounded-full ${
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
						</motion.div>

						{/* Live Price - Below Badge */}
						{livePrice && (
							<div className="flex flex-col items-end gap-0.5">
								{/* Live Price - Color Coded based on price movement */}
								<span
									className={`font-black text-base transition-colors duration-300 ${
										priceDirection === 1
											? "text-emerald-600 dark:text-emerald-400"
											: priceDirection === -1
												? "text-red-600 dark:text-red-400"
												: livePrice.change >= 0
													? "text-emerald-600 dark:text-emerald-400"
													: "text-red-600 dark:text-red-400"
									}`}
								>
									₹{livePrice.lastPrice.toFixed(2)}
								</span>
								{/* Change indicator - Small */}
								<span
									className={`text-xs font-semibold flex items-center gap-0.5 transition-colors duration-300 ${
										priceDirection === 1
											? "text-emerald-600 dark:text-emerald-400"
											: priceDirection === -1
												? "text-red-600 dark:text-red-400"
												: livePrice.change >= 0
													? "text-emerald-600 dark:text-emerald-400"
													: "text-red-600 dark:text-red-400"
									}`}
								>
									{priceDirection === 1 || (priceDirection === 0 && livePrice.change >= 0) ? (
										<TrendingUp size={12} />
									) : (
										<TrendingDown size={12} />
									)}
									{livePrice.change >= 0 ? "+" : ""}
									{livePrice.changePercent.toFixed(2)}%
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Current Trend Display (if strategy is active and has position) */}
				{isActive && strategy.currentPosition && strategy.currentPosition.side && (
					<div className="mb-3 p-2.5 rounded-xl border-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{strategy.currentPosition.side === "BUY" ? (
									<TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
								) : (
									<TrendingDown size={18} className="text-red-600 dark:text-red-400" />
								)}
								<div>
									<div className={`font-bold text-xs ${strategy.currentPosition.side === "BUY" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
										{strategy.currentPosition.side === "BUY" ? "Bullish" : "Bearish"}
									</div>
									{strategy.currentPosition.entryTime && (
										<div className="text-xs text-gray-600 dark:text-gray-400">
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
							</div>
							{strategy.currentPosition.entryPrice && (
								<div className="text-right">
									<div className="text-xs text-gray-500 dark:text-gray-400">Entry Price</div>
									<div className="font-bold text-xs text-gray-900 dark:text-gray-100">
										₹{strategy.currentPosition.entryPrice.toFixed(2)}
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Secondary Info */}
				<div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700 items-center">
					<div className="flex items-center gap-1.5 text-xs flex-wrap">
						<span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg font-semibold">
							{strategy.productType}
						</span>
						<span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg font-semibold">
							{strategy.orderType}
						</span>
						<span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-black text-xs">
							Qty: {strategy.qty}
						</span>
					</div>
					{strategy.createdAt && (
						<div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
							Created {new Date(strategy.createdAt).toLocaleDateString()}
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex flex-wrap gap-2">
					{/* Start/Pause/Resume Button */}
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => onToggle(strategy)}
						className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg ${
							isActive
								? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
								: "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
						}`}
					>
						{isActive ? (
							<>
								<Pause size={14} /> Pause
							</>
						) : isPaused ? (
							<>
								<Play size={14} /> Resume
							</>
						) : (
							<>
								<Play size={14} /> Start
							</>
						)}
					</motion.button>

					{/* STOP Button - only show if strategy is active */}
					{isActive && onStop && (
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => {
								if (window.confirm(`Are you sure you want to STOP "${strategy.name}"? This will close all positions and remove it from active strategies.`)) {
									onStop(strategy);
								}
							}}
							className="px-3 py-2 rounded-lg font-bold text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
							title="Stop strategy and close all positions"
						>
							<Square size={14} /> Stop
						</motion.button>
					)}

					{/* Logs Button */}
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onLogsClick(strategyId, strategy.name)}
						className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all shadow-md hover:shadow-lg"
						title="View Logs"
					>
						<List size={14} />
					</motion.button>

					{/* Edit Button */}
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onEdit(strategy)}
						className="px-2.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md hover:shadow-lg"
						title="Edit Strategy"
					>
						<Edit size={14} />
					</motion.button>

					{/* Delete Button */}
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => onDelete(strategyId)}
						className="px-2.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg"
						title="Delete Strategy"
					>
						<Trash2 size={14} />
					</motion.button>
				</div>
			</div>
		</motion.div>
	);
}

