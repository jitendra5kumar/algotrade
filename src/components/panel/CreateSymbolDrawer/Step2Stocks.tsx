// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { PRODUCT_TYPES, ORDER_TYPES } from "./constants";
import type { FormData } from "./types";
import { ChevronDown, Clock, Target, AlertCircle, Settings } from "lucide-react";

interface Step2StocksProps {
	formData: FormData;
	onInputChange: (field: string, value: any) => void;
	onSymbolSelect: (instrument: any) => Promise<void>;
}

export default function Step2Stocks({ formData, onInputChange, onSymbolSelect }: Step2StocksProps) {
	return (
		<motion.div className="space-y-8">
			{/* Stop Loss & Target - Side by Side */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Stop Loss Configuration */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-1 h-6 bg-gradient-to-b from-red-600 to-red-500 rounded-full"></div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
								Stop Loss
							</h3>
						</div>
						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={() => onInputChange("stoplossEnabled", !formData.stoplossEnabled)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
								formData.stoplossEnabled
									? "bg-red-500 shadow-lg shadow-red-500/30"
									: "bg-gray-300 dark:bg-gray-600"
							}`}
						>
							<motion.span
								animate={{ x: formData.stoplossEnabled ? 22 : 2 }}
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
								className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
							/>
						</motion.button>
					</div>

					{formData.stoplossEnabled && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-4"
						>
							<div className="flex gap-6">
								<label className="flex items-center gap-2 cursor-pointer group">
									<input
										type="radio"
										name="stoplossType"
										value="points"
										checked={(formData.stoplossType || "points") === "points"}
										onChange={(e) => onInputChange("stoplossType", e.target.value)}
										className="w-4 h-4 text-red-600 focus:ring-red-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
										Points
									</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer group">
									<input
										type="radio"
										name="stoplossType"
										value="percentage"
										checked={(formData.stoplossType || "points") === "percentage"}
										onChange={(e) => onInputChange("stoplossType", e.target.value)}
										className="w-4 h-4 text-red-600 focus:ring-red-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
										Percentage
									</span>
								</label>
							</div>
							<input
								type="number"
								step={(formData.stoplossType || "points") === "percentage" ? "0.1" : "1"}
								placeholder={(formData.stoplossType || "points") === "points" ? "Enter stoploss in points" : "Enter stoploss in %"}
								value={formData.stoploss}
								onChange={(e) => onInputChange("stoploss", e.target.value)}
								className="w-full px-4 py-3 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
							/>
						</motion.div>
					)}
				</div>

				{/* Target Configuration */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-1 h-6 bg-gradient-to-b from-green-600 to-green-500 rounded-full"></div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
								Target Profit
							</h3>
						</div>
						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={() => onInputChange("targetEnabled", !formData.targetEnabled)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
								formData.targetEnabled
									? "bg-green-500 shadow-lg shadow-green-500/30"
									: "bg-gray-300 dark:bg-gray-600"
							}`}
						>
							<motion.span
								animate={{ x: formData.targetEnabled ? 22 : 2 }}
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
								className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
							/>
						</motion.button>
					</div>

					{formData.targetEnabled && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-4"
						>
							<div className="flex gap-6">
								<label className="flex items-center gap-2 cursor-pointer group">
									<input
										type="radio"
										name="targetType"
										value="points"
										checked={(formData.targetType || "points") === "points"}
										onChange={(e) => onInputChange("targetType", e.target.value)}
										className="w-4 h-4 text-green-600 focus:ring-green-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
										Points
									</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer group">
									<input
										type="radio"
										name="targetType"
										value="percentage"
										checked={(formData.targetType || "points") === "percentage"}
										onChange={(e) => onInputChange("targetType", e.target.value)}
										className="w-4 h-4 text-green-600 focus:ring-green-500"
									/>
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
										Percentage
									</span>
								</label>
							</div>
							<input
								type="number"
								step={(formData.targetType || "points") === "percentage" ? "0.1" : "1"}
								placeholder={(formData.targetType || "points") === "points" ? "Enter target in points" : "Enter target in %"}
								value={formData.target}
								onChange={(e) => onInputChange("target", e.target.value)}
								className="w-full px-4 py-3 border border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
							/>
						</motion.div>
					)}
				</div>
			</div>

			{/* Product Type & Order Type */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-amber-600 to-amber-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Product Type
						</h3>
					</div>

					<div className="relative">
						<select
							value={formData.productType}
							onChange={(e) => onInputChange("productType", e.target.value)}
							className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
						>
							<option value="">Select product type</option>
							{PRODUCT_TYPES.filter((pt) => {
								// For stocks: show only MIS and CNC
								if (formData.strategyType === "stocks" || formData.strategyType === "normal") {
									return pt.value === "mis" || pt.value === "cnc";
								}
								// For futures/options: show only MIS and NRML
								if (formData.strategyType === "futures" || formData.strategyType === "options") {
									return pt.value === "mis" || pt.value === "nrml";
								}
								return true; // Default: show all
							}).map((pt) => (
								<option key={pt.value} value={pt.value}>
									{pt.label}
								</option>
							))}
						</select>
						<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
					</div>
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-cyan-600 to-cyan-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Order Type
						</h3>
					</div>

					<div className="relative">
						<select
							value={formData.orderType}
							onChange={(e) => onInputChange("orderType", e.target.value)}
							className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
						>
							<option value="">Select order type</option>
							{ORDER_TYPES.map((ot) => (
								<option key={ot.value} value={ot.value}>
									{ot.label}
								</option>
							))}
						</select>
						<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
					</div>
				</div>
			</div>

			{/* Quantity */}
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-indigo-500 rounded-full"></div>
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
						Trade Quantity
					</h3>
				</div>

				<input
					type="number"
					placeholder="Enter quantity"
					value={formData.qty}
					onChange={(e) => onInputChange("qty", e.target.value)}
					className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
				/>
			</div>

			{/* Instant Entry */}
			<div className="space-y-4">
				<div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
					<div>
						<h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
							Instant Entry
						</h4>
						<p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
							Enter trade immediately when strategy starts based on current trend
						</p>
					</div>
					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={() => onInputChange("instantEntry", !formData.instantEntry)}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all flex-shrink-0 ${
							formData.instantEntry
								? "bg-blue-500 shadow-lg shadow-blue-500/30"
								: "bg-gray-300 dark:bg-gray-600"
						}`}
					>
						<motion.span
							animate={{ x: formData.instantEntry ? 22 : 2 }}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
							className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
						/>
					</motion.button>
				</div>
			</div>

			{/* Intraday Trading Settings */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-1 h-6 bg-gradient-to-b from-orange-600 to-orange-500 rounded-full"></div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
							Intraday Settings
						</h3>
					</div>
					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={() => onInputChange("intradayEnabled", !formData.intradayEnabled)}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
							formData.intradayEnabled
								? "bg-orange-500 shadow-lg shadow-orange-500/30"
								: "bg-gray-300 dark:bg-gray-600"
						}`}
					>
						<motion.span
							animate={{ x: formData.intradayEnabled ? 22 : 2 }}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
							className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
						/>
					</motion.button>
				</div>

				{formData.intradayEnabled && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg space-y-6"
					>
						{/* Trading Window */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
									<label className="block text-gray-900 font-semibold text-sm dark:text-gray-50">
										Trading Window
									</label>
								</div>
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={() => onInputChange("tradingWindowEnabled", !formData.tradingWindowEnabled)}
									className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${
										formData.tradingWindowEnabled
											? "bg-orange-500"
											: "bg-gray-300 dark:bg-gray-600"
									}`}
								>
									<motion.span
										animate={{ x: formData.tradingWindowEnabled ? 18 : 2 }}
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
										className="inline-block h-3 w-3 rounded-full bg-white shadow-md"
									/>
								</motion.button>
							</div>

							{formData.tradingWindowEnabled && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="grid grid-cols-2 gap-4"
								>
									<div>
										<label className="block text-gray-700 font-medium text-xs mb-2 dark:text-gray-300">
											Start Time
										</label>
										<input
											type="time"
											value={formData.tradingStartTime}
											onChange={(e) => onInputChange("tradingStartTime", e.target.value)}
											className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
										/>
									</div>
									<div>
										<label className="block text-gray-700 font-medium text-xs mb-2 dark:text-gray-300">
											End Time
										</label>
										<input
											type="time"
											value={formData.tradingEndTime}
											onChange={(e) => onInputChange("tradingEndTime", e.target.value)}
											className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
										/>
									</div>
								</motion.div>
							)}
						</div>

						{/* Square Off Time */}
						<div className="space-y-2">
							<label className="block text-gray-900 font-semibold text-sm dark:text-gray-50">
								Square Off Time
							</label>
							<input
								type="time"
								value={formData.squareOffTime}
								onChange={(e) => onInputChange("squareOffTime", e.target.value)}
								className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
								placeholder="e.g., 15:25"
							/>
							<p className="text-xs text-orange-700 dark:text-orange-300">
								Auto square-off at this time (optional)
							</p>
						</div>

						{/* Risk Management */}
						<div className="space-y-4">
							<h5 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
								Risk Management
							</h5>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-gray-700 font-medium text-xs mb-2 dark:text-gray-300">
										Trailing Stop Loss %
									</label>
									<input
										type="number"
										step="0.1"
										value={formData.trailingStopLoss}
										onChange={(e) => onInputChange("trailingStopLoss", e.target.value)}
										className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
										placeholder="e.g., 1.5"
									/>
								</div>
								<div>
									<label className="block text-gray-700 font-medium text-xs mb-2 dark:text-gray-300">
										Max Risk Per Trade %
									</label>
									<input
										type="number"
										step="0.1"
										value={formData.maxRiskPerTradePercent}
										onChange={(e) => onInputChange("maxRiskPerTradePercent", e.target.value)}
										className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
										placeholder="e.g., 2.0"
									/>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}