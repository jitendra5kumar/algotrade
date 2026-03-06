"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
	LayoutGrid,
	Table2,
	AlertCircle,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
	pauseStrategy,
	resumeStrategy,
	startStrategy,
	stopStrategy,
} from "@/lib/strategy-api";
import { Strategy, LiveData } from "./types";
import { StrategyCardView, StrategyTableView } from "./StrategyCard";

interface StrategyListProps {
	strategies: Strategy[];
	liveData: LiveData;
	refreshingData: boolean;
	onRefresh: () => void;
	onEdit: (strategy: Strategy) => void;
	onDelete: (id: string) => void;
	onLogsClick: (strategyId: string, name?: string) => void;
	onStrategiesRefresh?: () => void;
	onStrategyUpdate?: (strategyId: string, updates: Partial<Strategy>) => void;
}

type ViewMode = "card" | "table";

export default function StrategyList({
	strategies,
	liveData,
	refreshingData,
	onRefresh,
	onEdit,
	onDelete,
	onLogsClick,
	onStrategiesRefresh,
	onStrategyUpdate,
}: StrategyListProps) {
	const [viewMode, setViewMode] = useState<ViewMode>("card");

	const handleStopStrategy = async (strategy: Strategy) => {
		const loadingToast = toast.loading("Stopping strategy and closing positions...");
		try {
			const strategyId = strategy._id || strategy.id || "";
			const response = await stopStrategy(strategyId);
			
			if (response?.success) {
				toast.success("Strategy stopped successfully", { id: loadingToast });
				
                          // Optimistically update the local state
                          if (onStrategyUpdate) {
                                  onStrategyUpdate(strategyId, { status: "INACTIVE", currentPosition: undefined });
                          }
				
				// Refresh strategies list
				if (onStrategiesRefresh) {
					await onStrategiesRefresh();
				}
				
				// Refresh live data
				onRefresh();
			} else {
				toast.error(response?.message || "Failed to stop strategy", { id: loadingToast });
			}
		} catch (e: any) {
			toast.error(e.message || "Failed to stop strategy", { id: loadingToast });
		}
	};

	const handleToggleStrategy = async (strategy: Strategy) => {
		const loadingToast = toast.loading(
			strategy.status === "ACTIVE"
				? "Pausing strategy..."
				: strategy.status === "PAUSED"
					? "Resuming strategy..."
					: "Starting strategy...",
		);
		try {
			const strategyId = strategy._id || strategy.id || "";
			let response;
			let newStatus: "ACTIVE" | "PAUSED" | "INACTIVE";
			
			if (strategy.status === "ACTIVE") {
				response = await pauseStrategy(strategyId);
				newStatus = "PAUSED";
				toast.success("Strategy paused", { id: loadingToast });
			} else if (strategy.status === "PAUSED") {
				response = await resumeStrategy(strategyId);
				newStatus = "ACTIVE";
				toast.success("Strategy resumed", { id: loadingToast });
			} else {
				response = await startStrategy(strategyId);
				newStatus = "ACTIVE";
				toast.success("Strategy started (LIVE)", { id: loadingToast });
			}
			
			// Optimistically update the local state immediately
			if (onStrategyUpdate && response?.success) {
				onStrategyUpdate(strategyId, { status: newStatus });
			}
			
			// Refresh strategies list to ensure we have the latest data from backend
			// Await to ensure it completes before continuing
			if (onStrategiesRefresh) {
				console.log("Refreshing strategies after toggle...");
				await onStrategiesRefresh();
				console.log("Strategies refreshed successfully");
			} else {
				console.warn("onStrategiesRefresh not provided!");
			}
			// Also refresh live data
			onRefresh();
		} catch (e: any) {
			toast.error(e.message || "Action failed", { id: loadingToast });
		}
	};


	const hasStrategies = strategies && strategies.length > 0;

	return (
		<div className="space-y-5">
			{/* View Toggle & Refresh Bar */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center justify-between flex-wrap gap-3"
			>
				{/* View Toggle */}
				<motion.div
					className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-700 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm"
				>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setViewMode("card")}
						className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
							viewMode === "card"
								? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
						}`}
					>
						<LayoutGrid size={14} />
						Card
					</motion.button>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setViewMode("table")}
						className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
							viewMode === "table"
								? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
						}`}
					>
						<Table2 size={14} />
						Table
					</motion.button>
				</motion.div>
			</motion.div>

			{/* Content */}
			<AnimatePresence mode="wait">
				{!hasStrategies ? (
					// Empty State
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="py-12 text-center"
					>
						<div className="flex justify-center mb-3">
							<div className="p-3 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl">
								<AlertCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
							</div>
						</div>
						<p className="text-base font-black text-gray-900 dark:text-gray-100 mb-1">
							No Strategies Yet
						</p>
						<p className="text-xs text-gray-600 dark:text-gray-400">
							Create your first strategy to get started
						</p>
					</motion.div>
				) : viewMode === "card" ? (
					// Card View
					<motion.div
						key="card-view"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
					>
					{strategies.map((strategy, idx) => (
						<StrategyCardView
							key={strategy._id || strategy.id || idx}
							strategy={strategy}
							index={idx}
							liveData={liveData}
							onToggle={handleToggleStrategy}
							onEdit={onEdit}
							onDelete={onDelete}
							onLogsClick={onLogsClick}
							onStop={handleStopStrategy}
						/>
					))}
					</motion.div>
				) : (
					// Table View
					<motion.div
						key="table-view"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg"
					>
						{/* Table Header */}
						<div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-slate-900 dark:to-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
							<table className="w-full">
								<thead>
									<tr className="text-left text-xs font-bold text-gray-700 dark:text-gray-300">
										<th className="pb-1.5">Strategy</th>
										<th className="pb-1.5">Trend</th>
										<th className="pb-1.5">SL (Pts)</th>
										<th className="pb-1.5">TGT (Pts)</th>
										<th className="pb-1.5">Product</th>
										<th className="pb-1.5">Order</th>
										<th className="pb-1.5">Qty</th>
										<th className="pb-1.5">Status</th>
										<th className="pb-1.5 text-center">Actions</th>
									</tr>
								</thead>
							</table>
						</div>

						{/* Table Body */}
						<div className="divide-y divide-gray-200 dark:divide-slate-700 overflow-x-auto">
							<table className="w-full">
								<tbody>
									{strategies.map((strategy, idx) => (
										<StrategyTableView
											key={strategy._id || strategy.id || idx}
											strategy={strategy}
											index={idx}
											liveData={liveData}
											onToggle={handleToggleStrategy}
											onEdit={onEdit}
											onDelete={onDelete}
											onLogsClick={onLogsClick}
										/>
									))}
								</tbody>
							</table>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}